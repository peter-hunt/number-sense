# Flask Web App Starter

A Flask starter template as per [these docs](https://flask.palletsprojects.com/en/3.0.x/quickstart/#a-minimal-application).

## Getting Started

This project is configured to work with Nix, which manages the development environment. The required Python packages, including Flask, are defined in the `.idx/dev.nix` file and are automatically made available to the entire workspace.

### Running the Application

To start the development server, run the following command:

```bash
./devserver.sh
```

This will start the Flask application on port 8080 by default. Previews should run automatically when starting a workspace.
