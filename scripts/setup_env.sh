#!/bin/bash
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
    sudo apt-get install -y         build-essential         cmake         libmosquitto-dev         libpq-dev         libssl-dev         libboost-all-dev
fi

# Create build directory
mkdir -p build
echo "✅ Environment setup complete!"
echo "Run './scripts/build_all.sh' to build the project."
