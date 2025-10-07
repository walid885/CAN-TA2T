"""
CAN Bus Message Simulator with realistic vehicle behavior
Supports multiple output formats and database storage
"""

import random
import time
import json
import csv
import struct
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import List, Dict
from enum import Enum


class CANSignalType(Enum):
    """Standard automotive signal types"""
    ENGINE_RPM = 0x0C
    VEHICLE_SPEED = 0x0D
    COOLANT_TEMP = 0x05
    THROTTLE_POS = 0x11
    FUEL_LEVEL = 0x2F
    BATTERY_VOLTAGE = 0x42


@dataclass
class CANMessage:
    """Represents a single CAN message"""
    timestamp: float
    can_id: int
    signal_type: str
    signal_name: str
    raw_value: int
    physical_value: float
    unit: str
    data: bytes
    
    def to_dict(self):
        return {
            'timestamp': self.timestamp,
            'can_id': hex(self.can_id),
            'signal_type': self.signal_type,
            'signal_name': self.signal_name,
            'raw_value': self.raw_value,
            'physical_value': self.physical_value,
            'unit': self.unit,
            'data_hex': self.data.hex()
        }


class VehicleState:
    """Maintains realistic vehicle state with physics-based transitions"""
    
    def __init__(self):
        self.rpm = 800.0  # idle
        self.speed = 0.0
        self.throttle = 0.0
        self.coolant_temp = 20.0
        self.fuel_level = 75.0
        self.battery_voltage = 12.6
        self.engine_running = False
        
    def update(self, dt: float):
        """Update vehicle state with realistic physics"""
        
        # Engine startup/shutdown
        if random.random() < 0.001:
            self.engine_running = not self.engine_running
            
        if self.engine_running:
            # Random throttle changes (simulating driver behavior)
            self.throttle += random.uniform(-5, 10) * dt
            self.throttle = max(0, min(100, self.throttle))
            
            # RPM follows throttle with inertia
            target_rpm = 800 + (self.throttle / 100) * 5200
            self.rpm += (target_rpm - self.rpm) * 0.1
            
            # Speed follows RPM (simplified)
            target_speed = (self.rpm - 800) / 100
            self.speed += (target_speed - self.speed) * 0.05
            self.speed = max(0, self.speed)
            
            # Engine heat
            self.coolant_temp += (85 - self.coolant_temp) * 0.01
            
            # Fuel consumption
            self.fuel_level -= (self.throttle / 100) * 0.001
            
            # Battery charges while running
            self.battery_voltage = min(14.2, self.battery_voltage + 0.001)
        else:
            # Engine off
            self.rpm = 0
            self.speed = max(0, self.speed - 0.5 * dt)
            self.throttle = 0
            self.coolant_temp += (20 - self.coolant_temp) * 0.01
            self.battery_voltage = max(11.8, self.battery_voltage - 0.0001)
            
        # Add realistic noise
        self.rpm += random.gauss(0, 20)
        self.speed += random.gauss(0, 0.5)
        self.coolant_temp += random.gauss(0, 0.5)
        self.battery_voltage += random.gauss(0, 0.05)


class CANSimulator:
    """Main simulator class"""
    
    def __init__(self, sample_rate_hz: float = 10.0):
        self.vehicle = VehicleState()
        self.sample_rate = sample_rate_hz
        self.messages: List[CANMessage] = []
        
    def _encode_signal(self, value: float, scale: float, offset: float) -> int:
        """Convert physical value to raw CAN value"""
        return int((value - offset) / scale)
    
    def _create_can_frame(self, can_id: int, data: bytes) -> bytes:
        """Create standard CAN frame (simplified)"""
        return data[:8].ljust(8, b'\x00')
    
    def generate_message(self, current_time: float, signal_type: CANSignalType) -> CANMessage:
        """Generate a single CAN message based on vehicle state"""
        
        if signal_type == CANSignalType.ENGINE_RPM:
            raw = self._encode_signal(self.vehicle.rpm, 0.25, 0)
            data = struct.pack('>H', raw & 0xFFFF)
            return CANMessage(
                timestamp=current_time,
                can_id=0x100,
                signal_type='ENGINE',
                signal_name='RPM',
                raw_value=raw,
                physical_value=self.vehicle.rpm,
                unit='rpm',
                data=self._create_can_frame(0x100, data)
            )
            
        elif signal_type == CANSignalType.VEHICLE_SPEED:
            raw = self._encode_signal(self.vehicle.speed, 0.01, 0)
            data = struct.pack('>H', raw & 0xFFFF)
            return CANMessage(
                timestamp=current_time,
                can_id=0x101,
                signal_type='VEHICLE',
                signal_name='Speed',
                raw_value=raw,
                physical_value=self.vehicle.speed,
                unit='km/h',
                data=self._create_can_frame(0x101, data)
            )
            
        elif signal_type == CANSignalType.COOLANT_TEMP:
            raw = self._encode_signal(self.vehicle.coolant_temp, 1.0, -40)
            data = struct.pack('B', raw & 0xFF)
            return CANMessage(
                timestamp=current_time,
                can_id=0x102,
                signal_type='ENGINE',
                signal_name='CoolantTemp',
                raw_value=raw,
                physical_value=self.vehicle.coolant_temp,
                unit='°C',
                data=self._create_can_frame(0x102, data)
            )
            
        elif signal_type == CANSignalType.THROTTLE_POS:
            raw = self._encode_signal(self.vehicle.throttle, 0.39, 0)
            data = struct.pack('B', raw & 0xFF)
            return CANMessage(
                timestamp=current_time,
                can_id=0x103,
                signal_type='ENGINE',
                signal_name='ThrottlePosition',
                raw_value=raw,
                physical_value=self.vehicle.throttle,
                unit='%',
                data=self._create_can_frame(0x103, data)
            )
            
        elif signal_type == CANSignalType.FUEL_LEVEL:
            raw = self._encode_signal(self.vehicle.fuel_level, 0.39, 0)
            data = struct.pack('B', raw & 0xFF)
            return CANMessage(
                timestamp=current_time,
                can_id=0x104,
                signal_type='FUEL',
                signal_name='FuelLevel',
                raw_value=raw,
                physical_value=self.vehicle.fuel_level,
                unit='%',
                data=self._create_can_frame(0x104, data)
            )
            
        elif signal_type == CANSignalType.BATTERY_VOLTAGE:
            raw = self._encode_signal(self.vehicle.battery_voltage, 0.01, 0)
            data = struct.pack('>H', raw & 0xFFFF)
            return CANMessage(
                timestamp=current_time,
                can_id=0x105,
                signal_type='ELECTRICAL',
                signal_name='BatteryVoltage',
                raw_value=raw,
                physical_value=self.vehicle.battery_voltage,
                unit='V',
                data=self._create_can_frame(0x105, data)
            )
    
    def run(self, duration_seconds: float):
        """Run simulation for specified duration"""
        start_time = time.time()
        dt = 1.0 / self.sample_rate
        
        print(f"Starting simulation for {duration_seconds}s at {self.sample_rate}Hz")
        
        while (time.time() - start_time) < duration_seconds:
            current_time = time.time()
            
            # Update vehicle physics
            self.vehicle.update(dt)
            
            # Generate messages for all signal types
            for signal_type in CANSignalType:
                msg = self.generate_message(current_time, signal_type)
                self.messages.append(msg)
            
            time.sleep(dt)
        
        print(f"Simulation complete. Generated {len(self.messages)} messages")
    
    def export_json(self, filename: str):
        """Export messages to JSON format"""
        with open(filename, 'w') as f:
            json.dump([msg.to_dict() for msg in self.messages], f, indent=2)
        print(f"Exported to {filename}")
    
    def export_csv(self, filename: str):
        """Export messages to CSV format"""
        if not self.messages:
            return
            
        with open(filename, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=self.messages[0].to_dict().keys())
            writer.writeheader()
            writer.writerows([msg.to_dict() for msg in self.messages])
        print(f"Exported to {filename}")
    
    def get_db_insert_data(self) -> List[Dict]:
        """Prepare data for database insertion"""
        return [msg.to_dict() for msg in self.messages]


# Example usage
if __name__ == "__main__":
    simulator = CANSimulator(sample_rate_hz=10)
    simulator.run(duration_seconds=30)
    
    # Export to different formats
    simulator.export_json("can_messages.json")
    simulator.export_csv("can_messages.csv")
    
    # Get data ready for DB insertion
    db_data = simulator.get_db_insert_data()
    print(f"Ready to insert {len(db_data)} records into database")