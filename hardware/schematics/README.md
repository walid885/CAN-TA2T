# CAN Vehicle Monitoring System

## 🚗 Project Overview
Real-time CAN bus data acquisition, transmission via Bluetooth/MQTT, and web-based visualization.

## 📁 Project Structure
```
can-vehicle-monitoring/
├── hardware/       # ESP32/STM32 firmware
├── mobile/         # Android gateway app
├── backend/        # C++ backend server
├── frontend/       # Web dashboard
├── database/       # Database schemas
└── tools/          # Development utilities
```

## 🛠️ Tech Stack
- **Hardware**: ESP32 + MCP2515 CAN module
- **Mobile**: Android (C++ NDK + Java)
- **Backend**: Crow (C++) + Mosquitto MQTT
- **Database**: TimescaleDB (PostgreSQL)
- **Frontend**: Wt Framework (C++) or HTML/JS

## 🚀 Quick Start
See `docs/setup_guide.md` for detailed setup instructions.

## 📖 Documentation
- Architecture: `docs/architecture.md`
- API Reference: `docs/api_reference.md`
- CAN Protocol: `docs/can_protocol.md`

## 🔧 Build Instructions
```bash
# Setup environment
./scripts/setup_env.sh

# Build all components
./scripts/build_all.sh
```

## 📝 License
[Add your license here]
