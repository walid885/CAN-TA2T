# CAN Vehicle Monitoring - Technical Setup

## Prerequisites

```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install -y \
    build-essential cmake git \
    libmosquitto-dev libpq-dev libssl-dev libboost-all-dev \
    mosquitto mosquitto-clients postgresql-14 \
    python3 python3-pip

# Install PlatformIO for firmware
pip3 install platformio

# Install Android NDK (for mobile)
export ANDROID_NDK_HOME=/path/to/ndk
```

## Project Setup

```bash
# 1. Generate structure
python3 setup_hierarchy.py

# 2. Initialize build
mkdir -p build && cd build
cmake .. -DBUILD_BACKEND=ON -DBUILD_TOOLS=ON
make -j$(nproc)
```

## Phase 1: CAN Simulator (Immediate Start)

### Build Simulator
```bash
cd tools
g++ -std=c++17 -o can_simulator can_simulator.cpp -lpthread
```

### Run Simulator
```bash
./can_simulator --bus-speed 500000 --output mqtt --broker localhost
```

### Simulator Code Template
```cpp
// tools/can_simulator.cpp
#include <iostream>
#include <thread>
#include <random>
#include <mosquitto.h>

struct CANFrame {
    uint32_t id;
    uint8_t data[8];
    uint8_t len;
    uint64_t timestamp;
};

class CANSimulator {
private:
    mosquitto* mqtt_client;
    std::mt19937 rng;
    
public:
    void generate_rpm_frame(CANFrame& frame) {
        frame.id = 0x201;
        frame.len = 8;
        uint16_t rpm = 800 + (rng() % 6000);
        frame.data[0] = rpm & 0xFF;
        frame.data[1] = (rpm >> 8) & 0xFF;
    }
    
    void generate_speed_frame(CANFrame& frame) {
        frame.id = 0x202;
        frame.len = 8;
        uint16_t speed = rng() % 180;
        frame.data[0] = speed & 0xFF;
        frame.data[1] = (speed >> 8) & 0xFF;
    }
    
    void publish_frame(const CANFrame& frame) {
        char payload[256];
        snprintf(payload, sizeof(payload), 
                "{\"id\":%u,\"data\":[%d,%d,%d,%d,%d,%d,%d,%d],\"len\":%d}",
                frame.id, frame.data[0], frame.data[1], frame.data[2], 
                frame.data[3], frame.data[4], frame.data[5], 
                frame.data[6], frame.data[7], frame.len);
        mosquitto_publish(mqtt_client, NULL, "vehicle/can/raw", 
                         strlen(payload), payload, 1, false);
    }
    
    void run() {
        while(true) {
            CANFrame frame;
            generate_rpm_frame(frame);
            publish_frame(frame);
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
            
            generate_speed_frame(frame);
            publish_frame(frame);
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }
    }
};
```

## Database Setup

```sql
-- database/schema.sql
CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE can_messages (
    timestamp TIMESTAMPTZ NOT NULL,
    can_id INTEGER NOT NULL,
    data BYTEA NOT NULL,
    length INTEGER NOT NULL
);

SELECT create_hypertable('can_messages', 'timestamp');

CREATE TABLE decoded_signals (
    timestamp TIMESTAMPTZ NOT NULL,
    signal_name VARCHAR(64) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    unit VARCHAR(16)
);

SELECT create_hypertable('decoded_signals', 'timestamp');

CREATE INDEX idx_signal_name ON decoded_signals(signal_name, timestamp DESC);
```

```bash
# Initialize database
psql -U postgres -c "CREATE DATABASE vehicle_monitoring;"
psql -U postgres -d vehicle_monitoring -f database/schema.sql
```

## MQTT Broker Setup

```bash
# Start Mosquitto
mosquitto -c /etc/mosquitto/mosquitto.conf -v

# Test publisher
mosquitto_pub -t "vehicle/can/raw" -m '{"id":513,"data":[32,3,0,0,0,0,0,0],"len":8}'

# Test subscriber
mosquitto_sub -t "vehicle/can/#" -v
```

## Backend Build

```bash
cd backend
mkdir build && cd build
cmake ..
make -j$(nproc)
./can_backend_server
```

### Backend Main Loop
```cpp
// backend/src/main.cpp
#include "mqtt_subscriber.h"
#include "can_decoder.h"
#include "database_manager.h"

int main() {
    MQTTSubscriber mqtt("localhost", 1883);
    CANDecoder decoder("config/can_database.dbc");
    DatabaseManager db("host=localhost dbname=vehicle_monitoring");
    
    mqtt.subscribe("vehicle/can/raw", [&](const std::string& payload) {
        auto frame = parse_can_frame(payload);
        auto signals = decoder.decode(frame);
        db.store_signals(signals);
    });
    
    mqtt.run();
    return 0;
}
```

## Hardware Firmware (ESP32)

```bash
cd hardware/firmware
pio run --target upload
pio device monitor
```

### Firmware Core
```cpp
// hardware/firmware/src/main.cpp
#include <CAN.h>
#include <BluetoothSerial.h>

BluetoothSerial BT;

void setup() {
    Serial.begin(115200);
    BT.begin("CAN_Monitor");
    
    if (!CAN.begin(500E3)) {
        Serial.println("CAN init failed");
        while(1);
    }
}

void loop() {
    int packetSize = CAN.parsePacket();
    if (packetSize) {
        uint32_t id = CAN.packetId();
        uint8_t data[8];
        uint8_t len = 0;
        
        while (CAN.available() && len < 8) {
            data[len++] = CAN.read();
        }
        
        // Send via Bluetooth
        char buf[128];
        snprintf(buf, sizeof(buf), "{\"id\":%lu,\"data\":[", id);
        BT.print(buf);
        for(int i=0; i<len; i++) {
            BT.printf("%d%s", data[i], i<len-1?",":"");
        }
        BT.println("]}");
    }
}
```

## Docker Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## Testing Flow

```bash
# Terminal 1: Start MQTT broker
mosquitto -v

# Terminal 2: Start database
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=canmonitor timescale/timescaledb:latest-pg14

# Terminal 3: Run simulator
./tools/can_simulator

# Terminal 4: Run backend
./backend/build/can_backend_server

# Terminal 5: Monitor MQTT
mosquitto_sub -t "vehicle/can/#" -v
```

## DBC File Format

```
// config/can_database.dbc
VERSION ""

NS_ : NS_DESC_ CM_ BA_DEF_ BA_ VAL_ CAT_DEF_ CAT_ FILTER BA_DEF_DEF_ EV_DATA_ ENVVAR_DATA_ SGTYPE_ SGTYPE_VAL_ BA_DEF_SGTYPE_ BA_SGTYPE_ SIG_TYPE_REF_ VAL_TABLE_ SIG_GROUP_ SIG_VALTYPE_ SIGTYPE_VALTYPE_ BO_TX_BU_ BA_DEF_REL_ BA_REL_ BA_SGTYPE_REL_ SG_MUL_VAL_

BS_:

BU_: ECU_Engine ECU_Transmission

BO_ 513 Engine_RPM: 8 ECU_Engine
 SG_ EngineSpeed : 0|16@1+ (0.25,0) [0|16383.75] "rpm"  ECU_Transmission
 SG_ EngineTemp : 16|8@1+ (1,-40) [-40|215] "C"  ECU_Transmission

BO_ 514 Vehicle_Speed: 8 ECU_Transmission
 SG_ Speed : 0|16@1+ (0.01,0) [0|655.35] "km/h"  ECU_Engine
 SG_ Odometer : 16|32@1+ (0.1,0) [0|429496729.5] "km"  ECU_Engine
```

## Build Targets

```bash
# Build everything
cmake .. && make all

# Build specific components
make can_backend_server    # Backend server
make can_simulator        # CAN simulator
make dbc_parser          # DBC parser utility
make test_can_decoder    # Decoder tests

# Run tests
ctest --output-on-failure
```

## Network Architecture

```
[ESP32 + MCP2515] --BT--> [Android Phone] --MQTT--> [Backend Server] --WebSocket--> [Web Dashboard]
                                               |
                                               v
                                        [TimescaleDB]
```

## Port Configuration

- MQTT: 1883 (TCP), 9001 (WebSocket)
- PostgreSQL: 5432
- Backend API: 8080
- WebSocket: 8080/ws
- Wt Dashboard: 8081

## Quick Verification

```bash
# Check MQTT broker
mosquitto_sub -h localhost -t "#" -v

# Check database
psql -h localhost -U postgres -d vehicle_monitoring -c "SELECT COUNT(*) FROM can_messages;"

# Check backend health
curl http://localhost:8080/api/health

# Generate test data
echo '{"id":513,"data":[32,3,100,50,0,0,0,0],"len":8}' | mosquitto_pub -t "vehicle/can/raw" -l
```