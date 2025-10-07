-- TimescaleDB Schema for CAN Message Storage
-- Install TimescaleDB extension first: CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Main time-series table for CAN messages
CREATE TABLE can_messages (
    timestamp TIMESTAMPTZ NOT NULL,
    can_id INTEGER NOT NULL,
    signal_type VARCHAR(50) NOT NULL,
    signal_name VARCHAR(100) NOT NULL,
    raw_value BIGINT,
    physical_value DOUBLE PRECISION,
    unit VARCHAR(20),
    data_hex TEXT,
    PRIMARY KEY (timestamp, can_id, signal_name)
);

-- Convert to hypertable (TimescaleDB specific)
SELECT create_hypertable('can_messages', 'timestamp');

-- Create indexes for common queries
CREATE INDEX idx_can_id ON can_messages (can_id, timestamp DESC);
CREATE INDEX idx_signal_name ON can_messages (signal_name, timestamp DESC);
CREATE INDEX idx_signal_type ON can_messages (signal_type, timestamp DESC);

-- Continuous aggregate for 1-minute averages
CREATE MATERIALIZED VIEW can_messages_1min
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 minute', timestamp) AS bucket,
    can_id,
    signal_name,
    AVG(physical_value) as avg_value,
    MIN(physical_value) as min_value,
    MAX(physical_value) as max_value,
    COUNT(*) as sample_count
FROM can_messages
GROUP BY bucket, can_id, signal_name;

-- Continuous aggregate for 1-hour statistics
CREATE MATERIALIZED VIEW can_messages_1hour
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', timestamp) AS bucket,
    can_id,
    signal_name,
    AVG(physical_value) as avg_value,
    MIN(physical_value) as min_value,
    MAX(physical_value) as max_value,
    STDDEV(physical_value) as std_dev,
    COUNT(*) as sample_count
FROM can_messages
GROUP BY bucket, can_id, signal_name;

-- Compression policy (compress data older than 7 days)
SELECT add_compression_policy('can_messages', INTERVAL '7 days');

-- Retention policy (drop data older than 90 days)
SELECT add_retention_policy('can_messages', INTERVAL '90 days');

-- Metadata table for signal definitions
CREATE TABLE signal_definitions (
    signal_id SERIAL PRIMARY KEY,
    can_id INTEGER NOT NULL,
    signal_name VARCHAR(100) NOT NULL,
    signal_type VARCHAR(50),
    unit VARCHAR(20),
    scale DOUBLE PRECISION,
    offset DOUBLE PRECISION,
    min_value DOUBLE PRECISION,
    max_value DOUBLE PRECISION,
    description TEXT,
    UNIQUE(can_id, signal_name)
);

-- Insert signal definitions based on our simulator
INSERT INTO signal_definitions (can_id, signal_name, signal_type, unit, scale, offset, min_value, max_value, description) VALUES
(256, 'RPM', 'ENGINE', 'rpm', 0.25, 0, 0, 8000, 'Engine rotational speed'),
(257, 'Speed', 'VEHICLE', 'km/h', 0.01, 0, 0, 250, 'Vehicle speed'),
(258, 'CoolantTemp', 'ENGINE', '°C', 1.0, -40, -40, 215, 'Engine coolant temperature'),
(259, 'ThrottlePosition', 'ENGINE', '%', 0.39, 0, 0, 100, 'Throttle pedal position'),
(260, 'FuelLevel', 'FUEL', '%', 0.39, 0, 0, 100, 'Fuel tank level'),
(261, 'BatteryVoltage', 'ELECTRICAL', 'V', 0.01, 0, 0, 16, 'Battery voltage');

-- Vehicle session tracking
CREATE TABLE vehicle_sessions (
    session_id SERIAL PRIMARY KEY,
    vehicle_id VARCHAR(50),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    total_distance DOUBLE PRECISION,
    avg_speed DOUBLE PRECISION,
    max_speed DOUBLE PRECISION,
    fuel_consumed DOUBLE PRECISION
);

-- Anomaly detection table
CREATE TABLE can_anomalies (
    anomaly_id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    can_id INTEGER,
    signal_name VARCHAR(100),
    expected_value DOUBLE PRECISION,
    actual_value DOUBLE PRECISION,
    deviation_percent DOUBLE PRECISION,
    severity VARCHAR(20),
    description TEXT
);

CREATE INDEX idx_anomalies_timestamp ON can_anomalies (timestamp DESC);

-- Python database insertion helper
CREATE OR REPLACE FUNCTION insert_can_message(
    p_timestamp TIMESTAMPTZ,
    p_can_id INTEGER,
    p_signal_type VARCHAR,
    p_signal_name VARCHAR,
    p_raw_value BIGINT,
    p_physical_value DOUBLE PRECISION,
    p_unit VARCHAR,
    p_data_hex TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO can_messages (timestamp, can_id, signal_type, signal_name, raw_value, physical_value, unit, data_hex)
    VALUES (p_timestamp, p_can_id, p_signal_type, p_signal_name, p_raw_value, p_physical_value, p_unit, p_data_hex)
    ON CONFLICT (timestamp, can_id, signal_name) DO UPDATE
    SET physical_value = EXCLUDED.physical_value,
        raw_value = EXCLUDED.raw_value,
        data_hex = EXCLUDED.data_hex;
END;
$$ LANGUAGE plpgsql;

-- Useful queries

-- Get latest values for all signals
CREATE VIEW latest_vehicle_state AS
SELECT DISTINCT ON (signal_name)
    signal_name,
    physical_value,
    unit,
    timestamp
FROM can_messages
ORDER BY signal_name, timestamp DESC;

-- Get RPM history for last hour
-- SELECT timestamp, physical_value FROM can_messages 
-- WHERE signal_name = 'RPM' AND timestamp > NOW() - INTERVAL '1 hour'
-- ORDER BY timestamp;

-- Get aggregated stats
-- SELECT bucket, signal_name, avg_value, min_value, max_value
-- FROM can_messages_1min
-- WHERE signal_name = 'Speed' AND bucket > NOW() - INTERVAL '1 day';