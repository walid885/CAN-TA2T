import psycopg2
import csv
from datetime import datetime

conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="canbus",
    user="postgres",
    password="canbus_pass"
)

cur = conn.cursor()

with open('can_messages.csv', 'r') as f:
    reader = csv.DictReader(f)
    count = 0
    for row in reader:
        # Convert Unix timestamp to PostgreSQL timestamp
        ts = datetime.fromtimestamp(float(row['timestamp']))
        
        cur.execute("""
            INSERT INTO can_messages 
            (timestamp, can_id, signal_type, signal_name, raw_value, physical_value, unit, data_hex)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (
            ts,
            row['can_id'],
            row['signal_type'],
            row['signal_name'],
            int(row['raw_value']),
            float(row['physical_value']),
            row['unit'],
            row['data_hex']
        ))
        
        count += 1
        if count % 100 == 0:
            print(f"Imported {count} records...")
            conn.commit()

conn.commit()
cur.close()
conn.close()
print(f"Import complete! Total records: {count}")