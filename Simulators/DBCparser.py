"""
DBC (CAN Database) file parser
Reads signal definitions and generates code/documentation
"""

import re
from dataclasses import dataclass
from typing import List, Dict, Optional
from pathlib import Path


@dataclass
class CANSignal:
    """Represents a CAN signal definition"""
    name: str
    start_bit: int
    length: int
    byte_order: str  # 'big_endian' or 'little_endian'
    value_type: str  # 'signed' or 'unsigned'
    scale: float
    offset: float
    min_value: float
    max_value: float
    unit: str
    receivers: List[str]
    
    def raw_to_physical(self, raw_value: int) -> float:
        """Convert raw CAN value to physical value"""
        return (raw_value * self.scale) + self.offset
    
    def physical_to_raw(self, physical_value: float) -> int:
        """Convert physical value to raw CAN value"""
        return int((physical_value - self.offset) / self.scale)


@dataclass
class CANMessage:
    """Represents a CAN message definition"""
    message_id: int
    name: str
    dlc: int  # Data Length Code (bytes)
    sender: str
    signals: List[CANSignal]
    cycle_time: Optional[int] = None  # milliseconds
    comment: Optional[str] = None


class DBCParser:
    """Parser for DBC files"""
    
    def __init__(self, dbc_file: str):
        self.dbc_file = Path(dbc_file)
        self.messages: Dict[int, CANMessage] = {}
        self.nodes: List[str] = []
        
    def parse(self):
        """Parse the DBC file"""
        if not self.dbc_file.exists():
            raise FileNotFoundError(f"DBC file not found: {self.dbc_file}")
        
        with open(self.dbc_file, 'r') as f:
            content = f.read()
        
        self._parse_nodes(content)
        self._parse_messages(content)
        self._parse_comments(content)
        self._parse_attributes(content)
        
        print(f"Parsed {len(self.messages)} messages from {self.dbc_file.name}")
        return self.messages
    
    def _parse_nodes(self, content: str):
        """Parse network nodes (ECUs)"""
        match = re.search(r'BU_:\s*(.+)', content)
        if match:
            self.nodes = match.group(1).split()
    
    def _parse_messages(self, content: str):
        """Parse message and signal definitions"""
        # Match message definitions
        msg_pattern = r'BO_\s+(\d+)\s+(\w+):\s*(\d+)\s+(\w+)'
        
        for msg_match in re.finditer(msg_pattern, content):
            msg_id = int(msg_match.group(1))
            msg_name = msg_match.group(2)
            dlc = int(msg_match.group(3))
            sender = msg_match.group(4)
            
            # Find signals for this message
            signals = self._parse_signals(content, msg_match.end())
            
            message = CANMessage(
                message_id=msg_id,
                name=msg_name,
                dlc=dlc,
                sender=sender,
                signals=signals
            )
            
            self.messages[msg_id] = message
    
    def _parse_signals(self, content: str, start_pos: int) -> List[CANSignal]:
        """Parse signals within a message"""
        signals = []
        
        # Signal pattern: SG_ SignalName : StartBit|Length@ByteOrder+ (Scale,Offset) [Min|Max] "Unit" Receivers
        sig_pattern = r'SG_\s+(\w+)\s*:\s*(\d+)\|(\d+)@([01])([+-])\s*\(([^,]+),([^)]+)\)\s*\[([^|]+)\|([^\]]+)\]\s*"([^"]*)"\s*(.+)'
        
        # Find all signals starting from current position
        pos = start_pos
        while True:
            match = re.search(sig_pattern, content[pos:pos+500])
            if not match:
                break
            
            name = match.group(1)
            start_bit = int(match.group(2))
            length = int(match.group(3))
            byte_order = 'big_endian' if match.group(4) == '0' else 'little_endian'
            value_type = 'signed' if match.group(5) == '-' else 'unsigned'
            scale = float(match.group(6))
            offset = float(match.group(7))
            min_val = float(match.group(8))
            max_val = float(match.group(9))
            unit = match.group(10)
            receivers = match.group(11).strip().split(',')
            
            signal = CANSignal(
                name=name,
                start_bit=start_bit,
                length=length,
                byte_order=byte_order,
                value_type=value_type,
                scale=scale,
                offset=offset,
                min_value=min_val,
                max_value=max_val,
                unit=unit,
                receivers=[r.strip() for r in receivers]
            )
            
            signals.append(signal)
            pos += match.end()
            
            # Check if next line is another signal or new message
            next_line = content[pos:pos+100].strip()
            if not next_line.startswith('SG_'):
                break
        
        return signals
    
    def _parse_comments(self, content: str):
        """Parse message and signal comments"""
        # Message comments: CM_ BO_ MessageID "Comment";
        msg_comment_pattern = r'CM_\s+BO_\s+(\d+)\s+"([^"]+)"'
        for match in re.finditer(msg_comment_pattern, content):
            msg_id = int(match.group(1))
            comment = match.group(2)
            if msg_id in self.messages:
                self.messages[msg_id].comment = comment
    
    def _parse_attributes(self, content: str):
        """Parse message attributes (like cycle time)"""
        # Cycle time: BA_ "GenMsgCycleTime" BO_ MessageID Value;
        cycle_pattern = r'BA_\s+"GenMsgCycleTime"\s+BO_\s+(\d+)\s+(\d+)'
        for match in re.finditer(cycle_pattern, content):
            msg_id = int(match.group(1))
            cycle_time = int(match.group(2))
            if msg_id in self.messages:
                self.messages[msg_id].cycle_time = cycle_time
    
    def generate_python_code(self, output_file: str):
        """Generate Python code for signal encoding/decoding"""
        code = """# Auto-generated from DBC file
# CAN Signal Encoders/Decoders

import struct
from enum import Enum

"""
        
        # Generate enum for message IDs
        code += "class MessageID(Enum):\n"
        for msg in self.messages.values():
            code += f"    {msg.name} = 0x{msg.message_id:03X}\n"
        code += "\n\n"
        
        # Generate signal classes
        for msg in self.messages.values():
            code += f"class {msg.name}:\n"
            code += f'    """Message: {msg.name} (ID: 0x{msg.message_id:03X})"""\n'
            if msg.comment:
                code += f'    # {msg.comment}\n'
            code += f"    MSG_ID = 0x{msg.message_id:03X}\n"
            code += f"    DLC = {msg.dlc}\n"
            if msg.cycle_time:
                code += f"    CYCLE_TIME_MS = {msg.cycle_time}\n"
            code += "\n"
            
            # Encode method
            code += "    @staticmethod\n"
            code += "    def encode("
            params = [f"{sig.name}: float" for sig in msg.signals]
            code += ", ".join(params)
            code += ") -> bytes:\n"
            code += '        """Encode signals into CAN frame"""\n'
            code += "        data = bytearray(8)\n"
            
            for sig in msg.signals:
                code += f"        # {sig.name} ({sig.unit})\n"
                code += f"        raw_{sig.name} = int(({sig.name} - {sig.offset}) / {sig.scale})\n"
                code += f"        # TODO: Pack into data at bit {sig.start_bit}\n"
            
            code += "        return bytes(data)\n\n"
            
            # Decode method
            code += "    @staticmethod\n"
            code += "    def decode(data: bytes) -> dict:\n"
            code += '        """Decode CAN frame into signals"""\n'
            code += "        signals = {}\n"
            
            for sig in msg.signals:
                code += f"        # {sig.name}\n"
                code += f"        # TODO: Extract from data at bit {sig.start_bit}\n"
                code += f"        raw_value = 0  # Extract {sig.length} bits\n"
                code += f"        signals['{sig.name}'] = (raw_value * {sig.scale}) + {sig.offset}\n"
            
            code += "        return signals\n\n\n"
        
        # Write to file
        with open(output_file, 'w') as f:
            f.write(code)
        
        print(f"Generated Python code: {output_file}")
    
    def generate_documentation(self, output_file: str):
        """Generate Markdown documentation"""
        doc = f"# CAN Database Documentation\n\n"
        doc += f"Generated from: {self.dbc_file.name}\n\n"
        doc += f"## Network Nodes\n\n"
        for node in self.nodes:
            doc += f"- {node}\n"
        doc += "\n"
        
        doc += f"## Messages ({len(self.messages)} total)\n\n"
        
        for msg in sorted(self.messages.values(), key=lambda m: m.message_id):
            doc += f"### {msg.name} (0x{msg.message_id:03X})\n\n"
            if msg.comment:
                doc += f"*{msg.comment}*\n\n"
            doc += f"- **Message ID**: 0x{msg.message_id:03X} ({msg.message_id})\n"
            doc += f"- **Sender**: {msg.sender}\n"
            doc += f"- **DLC**: {msg.dlc} bytes\n"
            if msg.cycle_time:
                doc += f"- **Cycle Time**: {msg.cycle_time} ms\n"
            doc += "\n"
            
            if msg.signals:
                doc += "#### Signals\n\n"
                doc += "| Signal | Start Bit | Length | Scale | Offset | Min | Max | Unit |\n"
                doc += "|--------|-----------|--------|-------|--------|-----|-----|------|\n"
                
                for sig in msg.signals:
                    doc += f"| {sig.name} | {sig.start_bit} | {sig.length} | "
                    doc += f"{sig.scale} | {sig.offset} | {sig.min_value} | "
                    doc += f"{sig.max_value} | {sig.unit} |\n"
                doc += "\n"
        
        with open(output_file, 'w') as f:
            f.write(doc)
        
        print(f"Generated documentation: {output_file}")
    
    def generate_sql_inserts(self, output_file: str):
        """Generate SQL INSERT statements for signal_definitions table"""
        sql = "-- Signal definitions from DBC file\n"
        sql += "-- Insert into signal_definitions table\n\n"
        
        for msg in self.messages.values():
            for sig in msg.signals:
                sql += f"INSERT INTO signal_definitions "
                sql += f"(can_id, signal_name, signal_type, unit, scale, offset, min_value, max_value, description) "
                sql += f"VALUES ("
                sql += f"{msg.message_id}, "
                sql += f"'{sig.name}', "
                sql += f"'{msg.name}', "
                sql += f"'{sig.unit}', "
                sql += f"{sig.scale}, "
                sql += f"{sig.offset}, "
                sql += f"{sig.min_value}, "
                sql += f"{sig.max_value}, "
                sql += f"'From {msg.name} message'"
                sql += ");\n"
        
        with open(output_file, 'w') as f:
            f.write(sql)
        
        print(f"Generated SQL inserts: {output_file}")


# Example usage
if __name__ == "__main__":
    parser = DBCParser("vehicle.dbc")
    messages = parser.parse()
    
    # Generate artifacts
    parser.generate_python_code("can_messages_generated.py")
    parser.generate_documentation("CAN_Database.md")
    parser.generate_sql_inserts("signal_definitions.sql")
    
    # Print summary
    print(f"\nSummary:")
    print(f"  Messages: {len(messages)}")
    total_signals = sum(len(msg.signals) for msg in messages.values())
    print(f"  Signals:  {total_signals}")
    print(f"  Nodes:    {len(parser.nodes)}")