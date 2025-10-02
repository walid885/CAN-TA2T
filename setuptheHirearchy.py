#!/usr/bin/env python3
"""
CAN Vehicle Monitoring Project - Directory Structure Generator
Creates the complete project hierarchy with placeholder files
"""

import os
import sys
from pathlib import Path

# Project structure definition
PROJECT_STRUCTURE = {
    "hardware": {
        "firmware": {
            "src": {
                "files": [
                    "can_controller.cpp",
                    "bluetooth_handler.cpp", 
                    "data_formatter.cpp",
                    "main.cpp"
                ]
            },
            "include": {
                "files": [
                    "can_controller.h",
                    "bluetooth_handler.h",
                    "data_formatter.h",
                    "config.h"
                ]
            },
            "lib": {},
            "files": ["platformio.ini", "CMakeLists.txt"]
        },
        "schematics": {
            "files": ["README.md"]
        }
    },
    
    "mobile": {
        "android": {
            "app/src/main": {
                "cpp": {
                    "files": [
                        "bluetooth_client.cpp",
                        "mqtt_publisher.cpp",
                        "jni_bridge.cpp",
                        "native-lib.cpp"
                    ]
                },
                "java/com/vehiclemonitor": {
                    "files": [
                        "MainActivity.java",
                        "BluetoothService.java",
                        "MqttService.java"
                    ]
                }
            },
            "files": ["CMakeLists.txt", "build.gradle"]
        },
        "docs": {
            "files": ["mobile_setup.md"]
        }
    },
    
    "backend": {
        "src": {
            "files": [
                "main.cpp",
                "mqtt_subscriber.cpp",
                "can_decoder.cpp",
                "database_manager.cpp",
                "websocket_server.cpp"
            ],
            "api": {
                "files": ["routes.cpp", "handlers.cpp"]
            }
        },
        "include": {
            "files": [
                "mqtt_subscriber.h",
                "can_decoder.h",
                "database_manager.h",
                "websocket_server.h"
            ],
            "api": {
                "files": ["routes.h", "handlers.h"]
            }
        },
        "config": {
            "files": [
                "can_database.dbc",
                "mqtt_config.json",
                "database_config.json"
            ]
        },
        "tests": {
            "files": [
                "test_can_decoder.cpp",
                "test_mqtt.cpp",
                "CMakeLists.txt"
            ]
        },
        "files": ["CMakeLists.txt"]
    },
    
    "frontend": {
        "wt-app": {
            "src": {
                "files": [
                    "DashboardApp.cpp",
                    "CANDataWidget.cpp",
                    "ChartWidget.cpp",
                    "main.cpp"
                ]
            },
            "include": {
                "files": [
                    "DashboardApp.h",
                    "CANDataWidget.h",
                    "ChartWidget.h"
                ]
            },
            "files": ["CMakeLists.txt"]
        },
        "web-classic": {
            "files": ["index.html"],
            "css": {
                "files": ["styles.css", "dashboard.css"]
            },
            "js": {
                "files": [
                    "websocket_client.js",
                    "dashboard.js",
                    "charts.js"
                ]
            },
            "assets": {
                "images": {},
                "icons": {}
            }
        }
    },
    
    "database": {
        "migrations": {
            "files": [
                "001_initial_schema.sql",
                "002_add_indexes.sql"
            ]
        },
        "files": ["schema.sql", "seed_data.sql"]
    },
    
    "tools": {
        "files": [
            "can_simulator.cpp",
            "mqtt_logger.cpp",
            "dbc_parser.cpp",
            "CMakeLists.txt"
        ]
    },
    
    "docs": {
        "files": [
            "architecture.md",
            "api_reference.md",
            "setup_guide.md",
            "can_protocol.md",
            "README.md"
        ]
    },
    
    "docker": {
        "files": [
            "Dockerfile.backend",
            "Dockerfile.mosquitto",
            "docker-compose.yml",
            "README.md"
        ]
    },
    
    "scripts": {
        "files": [
            "setup_env.sh",
            "build_all.sh",
            "deploy.sh"
        ]
    }
}

# Root level files
ROOT_FILES = [
    "CMakeLists.txt",
    "README.md",
    ".gitignore",
    "LICENSE"
]

# File content templates
FILE_TEMPLATES = {
    ".gitignore": """# Build directories
build/
cmake-build-*/
*.o
*.a
*.so
*.dylib

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Python
__pycache__/
*.pyc
.env

# Platform specific
.DS_Store
Thumbs.db

# Dependencies
node_modules/
vendor/

# Logs
*.log
logs/

# Database
*.db
*.sqlite
""",
    
    "README.md": """# CAN Vehicle Monitoring System

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
""",
    
    "CMakeLists.txt": """cmake_minimum_required(VERSION 3.15)
project(CANVehicleMonitoring VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Options
option(BUILD_BACKEND "Build backend server" ON)
option(BUILD_FRONTEND_WT "Build Wt frontend" ON)
option(BUILD_TOOLS "Build development tools" ON)
option(BUILD_TESTS "Build tests" OFF)

# Add subdirectories
if(BUILD_BACKEND)
    add_subdirectory(backend)
endif()

if(BUILD_FRONTEND_WT)
    add_subdirectory(frontend/wt-app)
endif()

if(BUILD_TOOLS)
    add_subdirectory(tools)
endif()

# Installation
install(DIRECTORY config/ DESTINATION etc/can-monitor)
install(DIRECTORY scripts/ DESTINATION bin
    FILE_PERMISSIONS OWNER_EXECUTE OWNER_WRITE OWNER_READ
                     GROUP_EXECUTE GROUP_READ
                     WORLD_EXECUTE WORLD_READ)
""",

    "platformio.ini": """[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino

; Upload settings
upload_speed = 921600
monitor_speed = 115200

; Libraries
lib_deps = 
    sandeepmistry/CAN@^0.3.1
    BluetoothSerial

; Build flags
build_flags = 
    -DCORE_DEBUG_LEVEL=3
    -DCAN_SPEED=500000

; Filesystem
board_build.filesystem = littlefs
""",

    "mqtt_config.json": """{
    "broker": {
        "host": "localhost",
        "port": 1883,
        "keepalive": 60
    },
    "topics": {
        "raw_can": "vehicle/can/raw",
        "decoded": "vehicle/can/decoded",
        "status": "vehicle/status"
    },
    "qos": 1,
    "client_id": "can_backend_server"
}
""",

    "docker-compose.yml": """version: '3.8'

services:
  mosquitto:
    build:
      context: .
      dockerfile: Dockerfile.mosquitto
    ports:
      - "1883:1883"
      - "9001:9001"
    volumes:
      - mosquitto_data:/mosquitto/data
      - mosquitto_logs:/mosquitto/log

  timescaledb:
    image: timescale/timescaledb:latest-pg14
    environment:
      POSTGRES_PASSWORD: canmonitor
      POSTGRES_DB: vehicle_monitoring
    ports:
      - "5432:5432"
    volumes:
      - timescale_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    depends_on:
      - mosquitto
      - timescaledb
    ports:
      - "8080:8080"
    environment:
      MQTT_BROKER: mosquitto
      DB_HOST: timescaledb
      DB_NAME: vehicle_monitoring
    volumes:
      - ./config:/app/config

volumes:
  mosquitto_data:
  mosquitto_logs:
  timescale_data:
""",

    "setup_env.sh": """#!/bin/bash
# Environment setup script for CAN Vehicle Monitoring

set -e

echo "🚀 Setting up CAN Vehicle Monitoring environment..."

# Check for required tools
command -v cmake >/dev/null 2>&1 || { echo "❌ CMake not found. Please install CMake."; exit 1; }
command -v g++ >/dev/null 2>&1 || { echo "❌ g++ not found. Please install g++."; exit 1; }

# Install dependencies (Ubuntu/Debian)
if [ -f /etc/debian_version ]; then
    echo "📦 Installing dependencies for Debian/Ubuntu..."
    sudo apt-get update
    sudo apt-get install -y \
        build-essential \
        cmake \
        libmosquitto-dev \
        libpq-dev \
        libssl-dev \
        libboost-all-dev
fi

# Create build directory
mkdir -p build
echo "✅ Environment setup complete!"
echo "Run './scripts/build_all.sh' to build the project."
"""
}

def create_directory_structure(base_path: Path, structure: dict):
    """Recursively create directory structure"""
    for name, content in structure.items():
        current_path = base_path / name
        
        # Create directory
        current_path.mkdir(parents=True, exist_ok=True)
        print(f"📁 Created: {current_path}")
        
        # Handle nested structure
        if isinstance(content, dict):
            # Create files in this directory
            if "files" in content:
                for filename in content["files"]:
                    file_path = current_path / filename
                    create_file_with_template(file_path)
                
                # Remove 'files' key and recurse for subdirectories
                subdirs = {k: v for k, v in content.items() if k != "files"}
                if subdirs:
                    create_directory_structure(current_path, subdirs)
            else:
                # No files, just recurse
                create_directory_structure(current_path, content)

def create_file_with_template(file_path: Path):
    """Create a file with appropriate template content"""
    # Skip if file already exists
    if file_path.exists():
        print(f"⏭️  Skipped (exists): {file_path}")
        return
    
    filename = file_path.name
    
    # Get template if available
    if filename in FILE_TEMPLATES:
        content = FILE_TEMPLATES[filename]
    else:
        # Generate default content based on file extension
        ext = file_path.suffix
        content = generate_default_content(filename, ext)
    
    # Write file
    file_path.write_text(content)
    print(f"✅ Created: {file_path}")
    
    # Make shell scripts executable
    if ext in ['.sh']:
        file_path.chmod(0o755)

def generate_default_content(filename: str, ext: str) -> str:
    """Generate default content based on file type"""
    templates = {
        ".cpp": f"""// {filename}
// CAN Vehicle Monitoring System

#include <iostream>

// TODO: Implement functionality

int main() {{
    std::cout << "Module: {filename}" << std::endl;
    return 0;
}}
""",
        ".h": f"""// {filename}
// CAN Vehicle Monitoring System

#ifndef {filename.upper().replace('.', '_').replace('-', '_')}
#define {filename.upper().replace('.', '_').replace('-', '_')}

// TODO: Add declarations

#endif // {filename.upper().replace('.', '_').replace('-', '_')}
""",
        ".java": f"""// {filename}
package com.vehiclemonitor;

public class {filename.replace('.java', '')} {{
    // TODO: Implement functionality
}}
""",
        ".js": f"""// {filename}
// CAN Vehicle Monitoring - Web Frontend

// TODO: Implement functionality
console.log('Module: {filename}');
""",
        ".py": f"""#!/usr/bin/env python3
# {filename}

def main():
    \"\"\"Main function\"\"\"
    print("Module: {filename}")

if __name__ == "__main__":
    main()
""",
        ".md": f"""# {filename.replace('.md', '').replace('_', ' ').title()}

TODO: Add documentation

## Overview

## Details
""",
        ".sql": f"""-- {filename}
-- CAN Vehicle Monitoring Database

-- TODO: Add SQL statements
""",
        ".json": """{\n    "TODO": "Add configuration"\n}\n""",
        ".yml": """# Configuration file\n# TODO: Add configuration\n""",
        ".sh": f"""#!/bin/bash
# {filename}

set -e
echo "Running {filename}..."
# TODO: Add script logic
""",
        ".ini": f"""# {filename}
# Configuration file

[section]
# TODO: Add configuration
""",
        ".dbc": """VERSION ""

NS_ :

BS_:

BU_:

BO_ 0 EXAMPLE: 8 Vector__XXX
 SG_ Signal1 : 0|16@1+ (1,0) [0|0] "" Vector__XXX

""",
        ".html": """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CAN Vehicle Monitor</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <h1>CAN Vehicle Monitoring Dashboard</h1>
    <!-- TODO: Add content -->
    <script src="js/dashboard.js"></script>
</body>
</html>
""",
        ".css": """/* Styles for CAN Vehicle Monitor */

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    background-color: #f5f5f5;
}

/* TODO: Add styles */
"""
    }
    
    return templates.get(ext, f"# {filename}\n# TODO: Add content\n")

def main():
    """Main function"""
    # Get the project root (current directory or specified path)
    if len(sys.argv) > 1:
        project_root = Path(sys.argv[1])
    else:
        project_root = Path.cwd()
    
    print(f"🏗️  Creating project structure in: {project_root}")
    print("=" * 60)
    
    # Create main structure
    create_directory_structure(project_root, PROJECT_STRUCTURE)
    
    # Create root-level files
    print("\n📄 Creating root-level files...")
    for filename in ROOT_FILES:
        file_path = project_root / filename
        create_file_with_template(file_path)
    
    print("\n" + "=" * 60)
    print("✨ Project structure created successfully!")
    print(f"📍 Location: {project_root.absolute()}")
    print("\n📚 Next steps:")
    print("  1. Review the generated structure")
    print("  2. Run: ./scripts/setup_env.sh")
    print("  3. Start with Phase 1: hardware/firmware")
    print("  4. Read docs/setup_guide.md for detailed instructions")

if __name__ == "__main__":
    main()