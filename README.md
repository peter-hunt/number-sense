# Number Sense Idle Game

A simple idle game built with Flask and vanilla JavaScript.

## Getting Started (with Nix)

This project is configured to work with Nix, which manages the development environment. The required Python packages are defined in `.idx/dev.nix` and are automatically made available.

To start the server, simply run:

```bash
./devserver.sh
```

This will start the Flask application on port 8080.

## Getting Started (Manual Setup)

For a traditional setup, you can use a Python virtual environment.

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
python main.py
```

The application will be running on `http://127.0.0.1:8080`.
