#!/bin/sh
# Activate the virtual environment
. .venv/bin/activate

# Install dependencies just in case they are missing
pip install -r requirements.txt -q

# Run the flask application
python -u -m flask --app main run -p ${PORT:-8080} --debug
