import os
import logging
from flask import Flask, jsonify, request, send_from_directory
from src import profile_manager

app = Flask(__name__, static_folder='src', static_url_path='')

# Configure logging
logging.basicConfig(level=logging.INFO)

# --- API Endpoints ---

@app.route('/api/game-state', methods=['GET'])
def get_game_state():
    state = profile_manager.get_processed_game_state()
    app.logger.info(f"Game State: {state}")
    return jsonify(state)


@app.route('/api/profile/migrate', methods=['POST'])
def migrate_profile():
    return jsonify({"error": "Migration feature is not yet implemented."}), 501


@app.route('/api/profile/fix', methods=['POST'])
def fix_profile_route():
    data = request.get_json()
    index_to_fix = data.get('index')
    result = profile_manager.fix_profile(index_to_fix)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)


@app.route('/api/action', methods=['POST'])
def handle_action_route():
    data = request.get_json()
    action_id = data.get('action_id')
    if not action_id:
        return jsonify({"error": "No action ID provided"}), 400
    
    result = profile_manager.handle_action(action_id)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)


@app.route('/api/profile/new', methods=['POST'])
def new_profile_route():
    data = request.get_json()
    name = data.get('name')
    result = profile_manager.new_profile(name)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)


@app.route('/api/profile/select', methods=['POST'])
def select_profile_route():
    data = request.get_json()
    index = data.get('index')
    result = profile_manager.select_profile(index)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)


@app.route('/api/profile/rename', methods=['PUT'])
def rename_profile_route():
    data = request.get_json()
    new_name = data.get('name')
    result = profile_manager.rename_profile(new_name)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)


@app.route('/api/profile/delete', methods=['DELETE'])
def delete_profile_route():
    result = profile_manager.delete_profile()
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)


@app.route('/api/profile/reset', methods=['POST'])
def reset_profile_route():
    result = profile_manager.reset_profile()
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)


@app.route('/api/hard-reset', methods=['POST'])
def hard_reset_route():
    result = profile_manager.hard_reset()
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)

# --- Static File Serving ---

@app.route('/')
def index():
    return send_from_directory('src', 'index.html')


@app.route('/<path:path>')
def send_static_files(path):
    return send_from_directory('src', path)


def main():
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)


if __name__ == "__main__":
    main()
