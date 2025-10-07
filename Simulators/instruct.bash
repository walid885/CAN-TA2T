# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Start databases
cd docker
docker-compose up -d

# 3. Initialize database schema
cd scripts
./setup_db.sh

# 4. Build C++ components (optional for Milestone 1)
mkdir build && cd build
cmake ..
make

# 5. Run Python simulator
cd python
python can_simulator.py

# 6. Load data into database
python db_connector.py