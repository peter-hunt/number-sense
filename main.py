import sys

# --- Python Version Check ---
if sys.version_info < (3, 12):
    error_message = (
        f"Error: Your Python version is {sys.version_info.major}.{sys.version_info.minor}.\n"
        f"This application requires Python 3.12 or newer to run.\n"
        "Please upgrade your Python installation."
    )
    raise SystemExit(error_message)


# --- Flask Application Setup ---
from flask import Flask, jsonify, request, send_from_directory
from src import profile_manager
import logging
import os

app = Flask(__name__, static_folder="src", static_url_path="")

# Configure logging
logging.basicConfig(level=logging.INFO)


# --- API Endpoints ---
@app.route("/api/game-state", methods=["GET"])
def get_game_state():
    """Retrieves the current state of all profiles."""
    state = profile_manager.get_processed_game_state()
    # The detailed game state is no longer logged to avoid clutter.
    # app.logger.info(f"Game State: {state}")
    return jsonify(state)


@app.route("/api/profile/migrate", methods=["POST"])
def migrate_profile():
    """(Deprecated) An endpoint for migrating old data structures."""
    return jsonify({"error": "Migration feature is no longer supported."}), 501


@app.route("/api/profile/fix", methods=["POST"])
def fix_profile_route():
    """Resets a specified corrupt profile to its default state."""
    data = request.get_json()
    index_to_fix = data.get("index")
    result = profile_manager.fix_profile(index_to_fix)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)


@app.route("/api/action", methods=["POST"])
def handle_action_route():
    """Handles a player action (e.g., gathering resources)."""
    data = request.get_json()
    action_id = data.get("action_id")
    if not action_id:
        return jsonify({"error": "No action ID provided"}), 400

    result = profile_manager.handle_action(action_id)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)


@app.route("/api/profile/new", methods=["POST"])
def new_profile_route():
    """Creates a new player profile."""
    data = request.get_json()
    name = data.get("name")
    result = profile_manager.new_profile(name)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)


@app.route("/api/profile/select", methods=["POST"])
def select_profile_route():
    """Selects a profile to be the active one."""
    data = request.get_json()
    index = data.get("index")
    result = profile_manager.select_profile(index)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)


@app.route("/api/profile/rename", methods=["PUT"])
def rename_profile_route():
    """Renames the currently selected profile."""
    data = request.get_json()
    new_name = data.get("name")
    result = profile_manager.rename_profile(new_name)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)


@app.route("/api/profile/delete", methods=["DELETE"])
def delete_profile_route():
    """Deletes the currently selected profile."""
    result = profile_manager.delete_profile()
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)


@app.route("/api/profile/reset", methods=["POST"])
def reset_profile_route():
    """Resets the currently selected profile to its default state."""
    result = profile_manager.reset_profile()
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)


@app.route("/api/hard-reset", methods=["POST"])
def hard_reset_route():
    """Deletes all profiles and resets the game to its initial state."""
    result = profile_manager.hard_reset()
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)


@app.route("/api/settings", methods=["GET"])
def get_settings_route():
    """Returns all user settings from settings.json."""
    settings = profile_manager.get_settings()
    return jsonify(settings)


@app.route("/api/settings", methods=["POST"])
def set_settings_route():
    """Sets user settings in settings.json."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No settings provided"}), 400
    profile_manager.set_settings(data)
    return jsonify({"success": True, **data})


# --- Static File Serving ---
@app.route("/")
def index():
    """Serves the main index.html file."""
    return send_from_directory("src", "index.html")


@app.route("/<path:path>")
def send_static_files(path):
    """Serves other static files from the "src" directory."""
    return send_from_directory("src", path)


def main():
    """Main entry point for the Flask application."""
    # The server is managed by devserver.sh, so this part is not directly run in that environment.
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
