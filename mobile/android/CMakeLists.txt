cmake_minimum_required(VERSION 3.15)
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
