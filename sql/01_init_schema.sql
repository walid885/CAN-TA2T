CREATE EXTENSION IF NOT EXISTS timescaledb;

drop TABLE can_messages; 
drop TABLE signal_definitions
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

SELECT create_hypertable('can_messages', 'timestamp');

CREATE INDEX idx_can_id ON can_messages (can_id, timestamp DESC);
CREATE INDEX idx_signal_name ON can_messages (signal_name, timestamp DESC);

CREATE TABLE signal_definitions (
    signal_id SERIAL PRIMARY KEY,
    can_id INTEGER NOT NULL,
    signal_name VARCHAR(100) NOT NULL,
    signal_type VARCHAR(50),
    unit VARCHAR(20),
    scale DOUBLE PRECISION,
    value_offset DOUBLE PRECISION,
    min_value DOUBLE PRECISION,
    max_value DOUBLE PRECISION,
    description TEXT,
    UNIQUE(can_id, signal_name)
);

CREATE VIEW latest_vehicle_state AS
SELECT DISTINCT ON (signal_name)
    signal_name,
    physical_value,
    unit,
    timestamp
FROM can_messages
ORDER BY signal_name, timestamp DESC;
