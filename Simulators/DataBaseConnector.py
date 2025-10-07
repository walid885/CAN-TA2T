"""
Database connector for CAN message storage
Supports PostgreSQL/TimescaleDB and InfluxDB
"""

import psycopg2
from psycopg2.extras import execute_batch
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
from datetime import datetime
from typing import List, Dict
import os


class TimescaleDBConnector:
    """PostgreSQL/TimescaleDB connector for CAN messages"""
    
    def __init__(self, host="localhost", port=5432, database="canbus", 
                 user="postgres", password=""):
        self.conn_params = {
            'host': host,
            'port': port,
            'database': database,
            'user': user,
            'password': password
        }
        self.conn = None
        
    def connect(self):
        """Establish database connection"""
        self.conn = psycopg2.connect(**self.conn_params)
        print("Connected to TimescaleDB")
        
    def disconnect(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            print("Disconnected from TimescaleDB")
    
    def insert_messages(self, messages: List[Dict], batch_size=1000):
        """Batch insert CAN messages"""
        if not self.conn:
            self.connect()
            
        cursor = self.conn.cursor()
        
        insert_query = """
            INSERT INTO can_messages 
            (timestamp, can_id, signal_type, signal_name, raw_value, 
             physical_value, unit, data_hex)
            VALUES (to_timestamp(%s), %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (timestamp, can_id, signal_name) DO NOTHING
        """
        
        # Prepare data tuples
        data = [
            (
                msg['timestamp'],
                int(msg['can_id'], 16),
                msg['signal_type'],
                msg['signal_name'],
                msg['raw_value'],
                msg['physical_value'],
                msg['unit'],
                msg['data_hex']
            )
            for msg in messages
        ]
        
        # Batch insert
        execute_batch(cursor, insert_query, data, page_size=batch_size)
        self.conn.commit()
        
        print(f"Inserted {len(messages)} messages")
        cursor.close()
    
    def query_signal_history(self, signal_name: str, hours: int = 1):
        """Query signal history"""
        if not self.conn:
            self.connect()
            
        cursor = self.conn.cursor()
        query = """
            SELECT timestamp, physical_value, unit
            FROM can_messages
            WHERE signal_name = %s 
            AND timestamp > NOW() - INTERVAL '%s hours'
            ORDER BY timestamp
        """
        cursor.execute(query, (signal_name, hours))
        results = cursor.fetchall()
        cursor.close()
        
        return [
            {'timestamp': row[0], 'value': row[1], 'unit': row[2]}
            for row in results
        ]
    
    def get_latest_values(self):
        """Get latest value for each signal"""
        if not self.conn:
            self.connect()
            
        cursor = self.conn.cursor()
        query = "SELECT * FROM latest_vehicle_state"
        cursor.execute(query)
        results = cursor.fetchall()
        cursor.close()
        
        return [
            {
                'signal_name': row[0],
                'value': row[1],
                'unit': row[2],
                'timestamp': row[3]
            }
            for row in results
        ]


class InfluxDBConnector:
    """InfluxDB connector for time-series CAN data"""
    
    def __init__(self, url="http://localhost:8086", token="", org="canbus", bucket="vehicle_data"):
        self.url = url
        self.token = token
        self.org = org
        self.bucket = bucket
        self.client = None
        self.write_api = None
        
    def connect(self):
        """Establish InfluxDB connection"""
        self.client = InfluxDBClient(url=self.url, token=self.token, org=self.org)
        self.write_api = self.client.write_api(write_options=SYNCHRONOUS)
        print("Connected to InfluxDB")
        
    def disconnect(self):
        """Close InfluxDB connection"""
        if self.client:
            self.client.close()
            print("Disconnected from InfluxDB")
    
    def insert_messages(self, messages: List[Dict]):
        """Insert CAN messages as InfluxDB points"""
        if not self.write_api:
            self.connect()
        
        points = []
        for msg in messages:
            point = (
                Point("can_message")
                .tag("can_id", msg['can_id'])
                .tag("signal_type", msg['signal_type'])
                .tag("signal_name", msg['signal_name'])
                .tag("unit", msg['unit'])
                .field("raw_value", msg['raw_value'])
                .field("physical_value", msg['physical_value'])
                .field("data_hex", msg['data_hex'])
                .time(int(msg['timestamp'] * 1e9))  # nanoseconds
            )
            points.append(point)
        
        self.write_api.write(bucket=self.bucket, record=points)
        print(f"Inserted {len(points)} points to InfluxDB")
    
    def query_signal_history(self, signal_name: str, hours: int = 1):
        """Query signal history from InfluxDB"""
        query_api = self.client.query_api()
        
        query = f'''
            from(bucket: "{self.bucket}")
            |> range(start: -{hours}h)
            |> filter(fn: (r) => r["_measurement"] == "can_message")
            |> filter(fn: (r) => r["signal_name"] == "{signal_name}")
            |> filter(fn: (r) => r["_field"] == "physical_value")
        '''
        
        result = query_api.query(query=query, org=self.org)
        
        data = []
        for table in result:
            for record in table.records:
                data.append({
                    'timestamp': record.get_time(),
                    'value': record.get_value(),
                    'unit': record.values.get('unit')
                })
        
        return data


# Example usage and integration with simulator
if __name__ == "__main__":
    from can_simulator import CANSimulator
    
    # Run simulation
    simulator = CANSimulator(sample_rate_hz=10)
    simulator.run(duration_seconds=10)
    
    # Get messages
    messages = simulator.get_db_insert_data()
    
    # Option 1: Use TimescaleDB
    print("\n=== TimescaleDB Storage ===")
    ts_db = TimescaleDBConnector(
        host="localhost",
        database="canbus",
        user="postgres",
        password="your_password"
    )
    
    try:
        ts_db.connect()
        ts_db.insert_messages(messages)
        
        # Query latest values
        latest = ts_db.get_latest_values()
        print("\nLatest vehicle state:")
        for signal in latest:
            print(f"  {signal['signal_name']}: {signal['value']:.2f} {signal['unit']}")
        
        # Query RPM history
        rpm_history = ts_db.query_signal_history('RPM', hours=1)
        print(f"\nRPM history: {len(rpm_history)} records")
        
    except Exception as e:
        print(f"TimescaleDB error: {e}")
    finally:
        ts_db.disconnect()
    
    # Option 2: Use InfluxDB
    print("\n=== InfluxDB Storage ===")
    influx_db = InfluxDBConnector(
        url="http://localhost:8086",
        token="your_token",
        org="canbus",
        bucket="vehicle_data"
    )
    
    try:
        influx_db.connect()
        influx_db.insert_messages(messages)
        
        # Query signal history
        speed_history = influx_db.query_signal_history('Speed', hours=1)
        print(f"Speed history: {len(speed_history)} records")
        
    except Exception as e:
        print(f"InfluxDB error: {e}")
    finally:
        influx_db.disconnect()