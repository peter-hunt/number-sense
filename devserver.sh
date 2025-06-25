#!/bin/bash
set -e

# This script is designed to be run by the Project IDX preview manager.
# It ensures dependencies are installed and then starts the Flask server
# in the foreground.

# 1. Set up the virtual environment and install dependencies
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
echo "Installing/checking dependencies..."
pip install --quiet -r requirements.txt

# 2. Set Flask environment variables
export FLASK_APP=main.py
# The PORT is provided by the IDX environment, defaulting to 8080
export FLASK_RUN_PORT="${PORT:-8080}"
export FLASK_RUN_HOST="0.0.0.0"

# 3. Start the Flask server in the foreground
echo "Starting Flask server on port $FLASK_RUN_PORT..."
flask run
