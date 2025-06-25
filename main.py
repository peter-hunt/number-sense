import json
import math
import os
from pathlib import Path
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder='src', static_url_path='')

# --- Constants ---
DATABASE_FILE = Path('database.json')
INIT_DATABASE_FILE = Path('init_database.json')
ALL_SKILLS = ["Woodcutting", "Mining", "Foraging"]
BASE_XP = 100
XP_GROWTH_RATE = 1.15

# --- Core Game Logic ---
def get_level_from_xp(total_xp):
    """
    Calculates a player's level and progress from their total accumulated XP.
    This version correctly handles the accumulated XP from previous levels.
    """
    level = 0
    xp_for_next_level = BASE_XP
    total_xp_for_this_level = 0

    while total_xp >= total_xp_for_this_level + xp_for_next_level:
        total_xp_for_this_level += xp_for_next_level
        level += 1
        xp_for_next_level = math.floor(xp_for_next_level * XP_GROWTH_RATE)

    return {
        "level": level,
        "currentXP": total_xp - total_xp_for_this_level,
        "xpToNextLevel": xp_for_next_level,
    }

# --- Database Helper Functions ---
def read_database():
    """
    Reads the database file. If it doesn't exist, is empty, or is corrupted,
    it tries to create it from the init file or a default state.
    """
    # Create from init if main db file is missing or empty
    if not DATABASE_FILE.exists() or DATABASE_FILE.stat().st_size == 0:
        if INIT_DATABASE_FILE.exists():
            DATABASE_FILE.write_text(INIT_DATABASE_FILE.read_text())
        else:
            # If even the init file is gone, create from the default
            write_database(get_default_game_state())

    try:
        # Now we know the file exists and is not empty, so we can read it
        return json.loads(DATABASE_FILE.read_text())
    except (IOError, json.JSONDecodeError):
        # If there's an error parsing the JSON, fall back to the init file
        if INIT_DATABASE_FILE.exists():
            DATABASE_FILE.write_text(INIT_DATABASE_FILE.read_text())
            # Re-read the newly copied content
            return json.loads(DATABASE_FILE.read_text())
        else:
            # As a last resort, generate a fresh default state
            default_state = get_default_game_state()
            write_database(default_state)
            return default_state

def write_database(data):
    """Writes data to the database file using pathlib."""
    DATABASE_FILE.write_text(json.dumps(data, indent=2))

def get_default_game_state():
    """Generates the default structure for the game state."""
    return {
        "profiles": [
            {
                "name": "Adventurer",
                "data": {
                    "skills": {skill: {"totalXP": 0} for skill in ALL_SKILLS},
                    "inventory": { "Wood": 0, "Stone": 0, "Herbs": 0 }
                }
            }
        ],
        "selectedProfileIndex": 0
    }

def get_default_profile_data():
    """Returns the default data for a single profile."""
    return {
        "skills": {skill: {"totalXP": 0} for skill in ALL_SKILLS},
        "inventory": {"Wood": 0, "Stone": 0, "Herbs": 0},
    }

# --- API Endpoints ---

@app.route('/api/game-state', methods=['GET'])
def get_game_state():
    """
    Returns the entire current game state, with derived skill levels calculated.
    """
    db = read_database()

    for profile in db['profiles']:
        profile_total_level = 0
        if 'skills' in profile['data']:
            for skill_data in profile['data']['skills'].values():
                derived_stats = get_level_from_xp(skill_data['totalXP'])
                skill_data.update(derived_stats)
                profile_total_level += derived_stats['level']
        profile['totalLevel'] = profile_total_level

    return jsonify(db)

@app.route('/api/action', methods=['POST'])
def handle_action():
    """Handles a player action, like gathering resources."""
    db = read_database()
    data = request.get_json()
    action_id = data.get('actionId')

    if not action_id:
        return jsonify({"error": "No action ID provided"}), 400

    selected_index = db.get('selectedProfileIndex', 0)
    profile = db['profiles'][selected_index]

    action_map = {
        "gather-wood-button": {"skill": "Woodcutting", "xp": 10, "item": "Wood", "quantity": 1},
        "mine-stone-button": {"skill": "Mining", "xp": 15, "item": "Stone", "quantity": 1},
        "forage-herbs-button": {"skill": "Foraging", "xp": 5, "item": "Herbs", "quantity": 1},
    }

    if action_id in action_map:
        action_info = action_map[action_id]
        profile['data']['skills'][action_info['skill']]['totalXP'] += action_info['xp']
        if action_info.get('item'):
            profile['data']['inventory'][action_info['item']] += action_info['quantity']
        write_database(db)
    else:
        return jsonify({"error": "Unknown action ID"}), 400

    return get_game_state()

@app.route('/api/profile/new', methods=['POST'])
def new_profile():
    db = read_database()
    data = request.get_json()
    name = data.get('name')

    if not name or name.isspace():
        return jsonify({"error": "Profile name cannot be empty"}), 400

    new_profile_data = {
        "name": name,
        "data": get_default_profile_data()
    }
    db['profiles'].append(new_profile_data)
    db['selectedProfileIndex'] = len(db['profiles']) - 1
    write_database(db)
    return get_game_state()

@app.route('/api/profile/select', methods=['POST'])
def select_profile():
    db = read_database()
    data = request.get_json()
    index = data.get('index')

    if index is None or not (0 <= index < len(db['profiles'])):
        return jsonify({"error": "Invalid profile index"}), 400

    db['selectedProfileIndex'] = index
    write_database(db)
    return get_game_state()

@app.route('/api/profile/rename', methods=['PUT'])
def rename_profile():
    db = read_database()
    data = request.get_json()
    new_name = data.get('name')

    if not new_name or new_name.isspace():
        return jsonify({"error": "New name cannot be empty"}), 400

    selected_index = db.get('selectedProfileIndex', 0)
    db['profiles'][selected_index]['name'] = new_name
    write_database(db)
    return get_game_state()

@app.route('/api/profile/delete', methods=['DELETE'])
def delete_profile():
    db = read_database()

    if len(db['profiles']) <= 1:
        return jsonify({"error": "Cannot delete the last profile"}), 400

    selected_index = db.get('selectedProfileIndex', 0)
    db['profiles'].pop(selected_index)
    if db['selectedProfileIndex'] >= len(db['profiles']):
        db['selectedProfileIndex'] = len(db['profiles']) - 1
    write_database(db)
    return get_game_state()

@app.route('/api/profile/reset', methods=['POST'])
def reset_profile():
    """Resets the current profile's data to the default state."""
    db = read_database()
    selected_index = db.get('selectedProfileIndex', 0)
    db['profiles'][selected_index]['data'] = get_default_profile_data()
    write_database(db)
    return get_game_state()


@app.route('/api/hard-reset', methods=['POST'])
def hard_reset():
    """Resets the entire game state to the initial template."""
    if INIT_DATABASE_FILE.exists():
        DATABASE_FILE.write_text(INIT_DATABASE_FILE.read_text())
    else:
        # Fallback to in-memory default if init file is missing
        default_state = get_default_game_state()
        write_database(default_state)
    return get_game_state()

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
