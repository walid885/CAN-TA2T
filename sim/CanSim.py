"""
CAN Bus Message Simulator with direct database insertion
Generates realistic vehicle behavior and stores directly in TimescaleDB
"""

import random
import time
import struct
from dataclasses import dataclass
from datetime import datetime
from typing import List
from enum import Enum
import psycopg2
from psycopg2.extras import execute_batch


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
    timestamp: datetime
    can_id: str
    signal_type: str
    signal_name: str
    raw_value: int
    physical_value: float
    unit: str
    data_hex: str
    
    def to_tuple(self):
        """Convert to tuple for database insertion"""
        return (
            self.timestamp,
            self.can_id,
            self.signal_type,
            self.signal_name,
            self.raw_value,
            self.physical_value,
            self.unit,
            self.data_hex
        )


class VehicleState:
    """Maintains realistic vehicle state with physics-based transitions"""
    
    def __init__(self):
        self.rpm = 800.0  # idle
        self.speed = 0.0
        self.throttle = 0.0
        self.coolant_temp = 20.0
        self.fuel_level = 75.0
        self.battery_voltage = 12.6
        self.engine_running = True
        self.trip_mode = 'idle'  # idle, accelerating, cruising, decelerating
        self.mode_timer = 0
        
    def update(self, dt: float):
        """Update vehicle state with realistic physics"""
        
        self.mode_timer += dt
        
        # Change driving mode periodically for variety
        if self.mode_timer > random.uniform(5, 15):
            self.mode_timer = 0
            modes = ['idle', 'accelerating', 'cruising', 'decelerating']
            self.trip_mode = random.choice(modes)
        
        # Different behavior based on mode
        if self.trip_mode == 'idle':
            self.throttle = max(0, self.throttle - 5 * dt)
            target_rpm = 800
            
        elif self.trip_mode == 'accelerating':
            self.throttle = min(100, self.throttle + 10 * dt)
            target_rpm = 800 + (self.throttle / 100) * 5200
            
        elif self.trip_mode == 'cruising':
            self.throttle = 30 + random.uniform(-5, 5)
            target_rpm = 2000 + random.uniform(-100, 100)
            
        elif self.trip_mode == 'decelerating':
            self.throttle = max(0, self.throttle - 8 * dt)
            target_rpm = max(800, self.rpm - 200 * dt)
        
        # RPM follows target with inertia
        self.rpm += (target_rpm - self.rpm) * 0.1
        self.rpm = max(0, self.rpm)
        
        # Speed follows RPM (simplified transmission model)
        if self.rpm > 800:
            target_speed = (self.rpm - 800) / 80
            self.speed += (target_speed - self.speed) * 0.05
        else:
            self.speed = max(0, self.speed - 1 * dt)
        
        # Engine temperature rises with load
        if self.rpm > 800:
            target_temp = 85 + (self.throttle / 100) * 15
            self.coolant_temp += (target_temp - self.coolant_temp) * 0.01
        else:
            self.coolant_temp += (20 - self.coolant_temp) * 0.01
        
        # Fuel consumption based on throttle and RPM
        self.fuel_level -= (self.throttle / 100) * (self.rpm / 3000) * 0.001
        self.fuel_level = max(0, self.fuel_level)
        
        # Battery voltage varies with load
        if self.rpm > 1000:
            self.battery_voltage = min(14.4, self.battery_voltage + 0.002)
        else:
            self.battery_voltage = max(11.5, self.battery_voltage - 0.0005)
        
        # Add realistic noise to all signals
        self.rpm += random.gauss(0, 15)
        self.speed += random.gauss(0, 0.3)
        self.coolant_temp += random.gauss(0, 0.3)
        self.battery_voltage += random.gauss(0, 0.03)
        self.throttle = max(0, min(100, self.throttle + random.gauss(0, 1)))


class CANSimulator:
    """Main simulator class with direct database insertion"""
    
    def __init__(self, db_config: dict, sample_rate_hz: float = 10.0):
        self.vehicle = VehicleState()
        self.sample_rate = sample_rate_hz
        self.db_config = db_config
        self.batch_buffer = []
        self.batch_size = 500
        
    def _encode_signal(self, value: float, scale: float, offset: float) -> int:
        """Convert physical value to raw CAN value"""
        return int((value - offset) / scale)
    
    def _create_can_frame(self, can_id: int, data: bytes) -> str:
        """Create standard CAN frame and return as hex string"""
        frame = data[:8].ljust(8, b'\x00')
        return frame.hex()
    
    def generate_message(self, current_time: datetime, signal_type: CANSignalType) -> CANMessage:
        """Generate a single CAN message based on vehicle state"""
        
        if signal_type == CANSignalType.ENGINE_RPM:
            raw = self._encode_signal(self.vehicle.rpm, 0.25, 0)
            data = struct.pack('>H', raw & 0xFFFF)
            return CANMessage(
                timestamp=current_time,
                can_id='0x100',
                signal_type='ENGINE',
                signal_name='RPM',
                raw_value=raw,
                physical_value=round(self.vehicle.rpm, 2),
                unit='rpm',
                data_hex=self._create_can_frame(0x100, data)
            )
            
        elif signal_type == CANSignalType.VEHICLE_SPEED:
            raw = self._encode_signal(self.vehicle.speed, 0.01, 0)
            data = struct.pack('>H', raw & 0xFFFF)
            return CANMessage(
                timestamp=current_time,
                can_id='0x101',
                signal_type='VEHICLE',
                signal_name='Speed',
                raw_value=raw,
                physical_value=round(self.vehicle.speed, 2),
                unit='km/h',
                data_hex=self._create_can_frame(0x101, data)
            )
            
        elif signal_type == CANSignalType.COOLANT_TEMP:
            raw = self._encode_signal(self.vehicle.coolant_temp, 1.0, -40)
            data = struct.pack('B', raw & 0xFF)
            return CANMessage(
                timestamp=current_time,
                can_id='0x102',
                signal_type='ENGINE',
                signal_name='CoolantTemp',
                raw_value=raw,
                physical_value=round(self.vehicle.coolant_temp, 2),
                unit='°C',
                data_hex=self._create_can_frame(0x102, data)
            )
            
        elif signal_type == CANSignalType.THROTTLE_POS:
            raw = self._encode_signal(self.vehicle.throttle, 0.39, 0)
            data = struct.pack('B', raw & 0xFF)
            return CANMessage(
                timestamp=current_time,
                can_id='0x103',
                signal_type='ENGINE',
                signal_name='ThrottlePosition',
                raw_value=raw,
                physical_value=round(self.vehicle.throttle, 2),
                unit='%',
                data_hex=self._create_can_frame(0x103, data)
            )
            
        elif signal_type == CANSignalType.FUEL_LEVEL:
            raw = self._encode_signal(self.vehicle.fuel_level, 0.39, 0)
            data = struct.pack('B', raw & 0xFF)
            return CANMessage(
                timestamp=current_time,
                can_id='0x104',
                signal_type='FUEL',
                signal_name='FuelLevel',
                raw_value=raw,
                physical_value=round(self.vehicle.fuel_level, 2),
                unit='%',
                data_hex=self._create_can_frame(0x104, data)
            )
            
        elif signal_type == CANSignalType.BATTERY_VOLTAGE:
            raw = self._encode_signal(self.vehicle.battery_voltage, 0.01, 0)
            data = struct.pack('>H', raw & 0xFFFF)
            return CANMessage(
                timestamp=current_time,
                can_id='0x105',
                signal_type='ELECTRICAL',
                signal_name='BatteryVoltage',
                raw_value=raw,
                physical_value=round(self.vehicle.battery_voltage, 3),
                unit='V',
                data_hex=self._create_can_frame(0x105, data)
            )
    
    def flush_batch(self, conn, cur):
        """Insert buffered messages to database"""
        if not self.batch_buffer:
            return
        
        execute_batch(cur, """
            INSERT INTO can_messages 
            (timestamp, can_id, signal_type, signal_name, raw_value, physical_value, unit, data_hex)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, self.batch_buffer, page_size=500)
        
        conn.commit()
        count = len(self.batch_buffer)
        self.batch_buffer.clear()
        return count
    
    def run(self, num_samples: int = 10000):
        """Run simulation and insert directly to database"""
        
        # Connect to database
        conn = psycopg2.connect(**self.db_config)
        cur = conn.cursor()
        
        print(f"Starting simulation for {num_samples} samples at {self.sample_rate}Hz")
        print(f"Estimated duration: {num_samples / (self.sample_rate * 6):.1f} seconds")
        
        dt = 1.0 / self.sample_rate
        total_inserted = 0
        
        try:
            for i in range(num_samples // 6):  # Divide by 6 signal types
                current_time = datetime.now()
                
                # Update vehicle physics
                self.vehicle.update(dt)
                
                # Generate messages for all signal types
                for signal_type in CANSignalType:
                    msg = self.generate_message(current_time, signal_type)
                    self.batch_buffer.append(msg.to_tuple())
                
                # Flush batch when buffer is full
                if len(self.batch_buffer) >= self.batch_size:
                    count = self.flush_batch(conn, cur)
                    total_inserted += count
                    print(f"Inserted {total_inserted} records... (Trip mode: {self.vehicle.trip_mode}, "
                          f"RPM: {self.vehicle.rpm:.0f}, Speed: {self.vehicle.speed:.1f} km/h)")
                
                # Small delay to prevent overwhelming the system
                time.sleep(dt / 10)
            
            # Flush remaining messages
            if self.batch_buffer:
                count = self.flush_batch(conn, cur)
                total_inserted += count
            
            print(f"\n✓ Simulation complete!")
            print(f"✓ Total records inserted: {total_inserted}")
            
        except Exception as e:
            print(f"Error during simulation: {e}")
            conn.rollback()
            raise
        finally:
            cur.close()
            conn.close()


# Main execution
if __name__ == "__main__":
    # Database configuration
    db_config = {
        'host': 'localhost',
        'port': 5432,
        'database': 'canbus',
        'user': 'postgres',
        'password': 'canbus_pass'
    }
    
    # Create simulator and run
    simulator = CANSimulator(db_config, sample_rate_hz=10)
    simulator.run(num_samples=10000)
    
    print("\nSimulation complete! Check your database with:")
    print("  SELECT COUNT(*) FROM can_messages;")
    print("  SELECT signal_name, COUNT(*) FROM can_messages GROUP BY signal_name;")