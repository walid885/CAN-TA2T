cmake_minimum_required(VERSION 3.15)
project(CANBusSimulator VERSION 1.0.0 LANGUAGES CXX)

# C++ Standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Build options
option(BUILD_TESTS "Build test suite" ON)
option(BUILD_PYTHON_BINDINGS "Build Python bindings" ON)
option(USE_CONAN "Use Conan for dependency management" OFF)

# Output directories
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)

# Find dependencies
find_package(Python3 COMPONENTS Interpreter Development)

# Include directories
include_directories(${CMAKE_SOURCE_DIR}/include)

# Add subdirectories
add_subdirectory(src)

if(BUILD_TESTS)
    enable_testing()
    add_subdirectory(tests)
endif()

# Install Python simulator
install(DIRECTORY python/ 
        DESTINATION lib/python/can_simulator
        FILES_MATCHING PATTERN "*.py")

install(FILES dbc/vehicle.dbc 
        DESTINATION share/can_simulator)

# CPack configuration
set(CPACK_PACKAGE_NAME "CANBusSimulator")
set(CPACK_PACKAGE_VERSION ${PROJECT_VERSION})
set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "CAN Bus Message Simulator")
include(CPack)