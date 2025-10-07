#!/bin/bash

echo "Setting up CAN Bus Simulator databases..."

# Start Docker containers
docker-compose up -d

# Wait for databases to be ready
echo "Waiting for databases to initialize..."
sleep 10

# Initialize TimescaleDB schema
echo "Initializing TimescaleDB schema..."
docker exec -i canbus_timescaledb psql -U postgres -d canbus < ../sql/timescale_schema.sql

echo "Setup complete!"
echo "TimescaleDB: localhost:5432 (user: postgres, password: canbus_password)"
echo "InfluxDB: localhost:8086 (token: canbus_token)"
echo "Grafana: localhost:3000 (user: admin, password: admin)"