# Number Sense Idle Game

[![License: CC BY-SA 4.0](https://img.shields.io/badge/License-CC_BY--SA_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by-sa/4.0/)
[![Built with Flask](https://img.shields.io/badge/Built%20with-Flask-000000.svg?&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)

A simple idle game built with Flask and vanilla JavaScript.

## Getting Started

This project is configured to work seamlessly with Project IDX and its Nix-based environment.

To start the development server, simply run the provided script:

```bash
./devserver.sh
```

This will install any necessary dependencies and start the Flask application. The server will run on the port specified by the `$PORT` environment variable, defaulting to 8080. The Project IDX preview manager will automatically handle starting and stopping this script.

## Manual Setup (without Project IDX)

If you are not using the Nix environment provided by Project IDX, you can set up the project manually using a Python virtual environment.

### 1. Create and Activate the Virtual Environment

From the project's root directory, run the following commands. This will create a local environment in a `venv` folder, which is already ignored by `.gitignore`.

**On macOS / Linux:**

```bash
python3 -m venv venv
source venv/bin/activate
```

**On Windows:**

```bash
python -m venv venv
venv\Scripts\activate
```

### 2. Install Dependencies

Once the virtual environment is active, install the required packages from the `requirements.txt` file:

```bash
pip install -r requirements.txt
```

### 3. Run the Application

With the dependencies installed, you can start the Flask server directly:

```bash
export FLASK_APP=main.py
flask run --host=0.0.0.0 --port=8080
```
