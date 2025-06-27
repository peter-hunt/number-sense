# Number Sense MMORPG Prototype

[![License: CC BY-SA 4.0](https://img.shields.io/badge/License-CC_BY--SA_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by-sa/4.0/)
[![Built with Flask](https://img.shields.io/badge/Built%20with-Flask-000000.svg?&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)

A prototype for a future browser-based MMORPG, built with Flask and vanilla JavaScript. This project explores core mechanics, persistence, and real-time features that could power a massively multiplayer online role-playing game.

---

## Table of Contents

- [Number Sense MMORPG Prototype](#number-sense-mmorpg-prototype)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#getting-started)
    - [Requirements](#requirements)
    - [Setup](#setup)
    - [Install Dependencies](#install-dependencies)
    - [Run the Application](#run-the-application)
      - [Local VSCode Preview](#local-vscode-preview)
  - [Notes](#notes)
  - [Contributing](#contributing)
  - [License](#license)

---

## Getting Started

### Requirements

- Python 3.12 or higher

### Setup

Create and activate the virtual environment from the project's root directory:

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

### Install Dependencies

With the virtual environment active, install required packages:

```bash
pip install -r requirements.txt
```

### Run the Application

You can start the Flask server using the Flask CLI:

```bash
flask run --host=127.0.0.1
```

By default, the server runs on host 127.0.0.1 and port 5000. You can override the port with:

```bash
flask run --host=127.0.0.1 --port=<port>
```

Then, open your browser and navigate to [http://127.0.0.1:5000](http://127.0.0.1:5000) (or the port you specified).

> **Note:** If port 5000 is already in use, Flask will display an error and not start the server. In that case, specify a different port with the `--port` option, for example:
>
> ```bash
> flask run --host=127.0.0.1 --port=5001
> ```

#### Local VSCode Preview

- In VSCode, use: Simple Browser: Show
- Navigate to: [http://127.0.0.1:5000](http://127.0.0.1:5000) (or the port you specified)

---

## Notes

- This project is an early-stage prototype for a web-based MMORPG.
- Contributions and feedback are welcome as the design and features evolve!

## Contributing

Pull requests and suggestions are encouraged. Please open an issue or submit a PR to contribute.

## License

This project is licensed under the [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) license.
