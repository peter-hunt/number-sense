# Number Sense MMORPG Prototype

[![License: CC BY-SA 4.0](https://img.shields.io/badge/License-CC_BY--SA_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by-sa/4.0/)
[![Built with Flask](https://img.shields.io/badge/Built%20with-Flask-000000.svg?&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)

A prototype for a future browser-based MMORPG, built with Flask and vanilla JavaScript. This project explores core mechanics, persistence, and real-time features that could power a massively multiplayer online role-playing game.

## Getting Started

This project is designed for rapid prototyping and experimentation, with a focus on extensibility for future MMORPG development.

### Local Nix Preview

If you are using Project IDX or have Nix installed, you can preview the application in a reproducible environment. The provided `devserver.sh` script will automatically set up the environment and start the Flask server. This ensures all dependencies are managed and the app runs consistently across systems.

To start the development server with Nix:

```bash
./devserver.sh
```

The server will run on the port specified by the `$PORT` environment variable (default: 8080). Project IDX's preview manager will handle starting and stopping the script, making it easy to iterate on your MMORPG prototype.

## Manual Setup (without Project IDX or Nix)

If you are not using the Nix environment, you can set up the project manually using a Python virtual environment.

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

---

This project is an early-stage prototype for a web-based MMORPG. Contributions and feedback are welcome as the design and features evolve!
