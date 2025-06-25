import json
import math
from pathlib import Path
import copy

# --- Constants ---
DATABASE_FILE = Path('database.json')
INIT_DATABASE_FILE = Path('init_database.json')
ALL_SKILLS = ["woodcutting", "mining", "foraging"]
ALL_ITEMS = ["wood", "stone", "herbs"]
BASE_XP = 100
XP_GROWTH_RATE = 1.15

DEFAULT_PROFILE_DATA = {
    "skills": {skill: 0 for skill in ALL_SKILLS},
    "inventory": {item: 0 for item in ALL_ITEMS},
}

# --- Data Validation & Defaults ---

def get_default_game_state():
    """Generates the default structure for the game state."""
    return {
        "profiles": [{
            "name": "Adventurer",
            "data": copy.deepcopy(DEFAULT_PROFILE_DATA)
        }],
        "selected_profile_index": 0
    }


def get_default_profile_data():
    """Returns the default data for a single profile."""
    return copy.deepcopy(DEFAULT_PROFILE_DATA)


def validate_profile(profile):
    """
    Performs a deep structural integrity check on a single profile object.
    Returns True if the structure is valid, otherwise False.
    """
    if not isinstance(profile, dict) or 'name' not in profile or 'data' not in profile:
        return False

    profile_data = profile['data']
    if 'skills' not in profile_data or 'inventory' not in profile_data:
        return False

    skills = profile_data['skills']
    if not isinstance(skills, dict) or set(skills.keys()) != set(ALL_SKILLS):
        return False
    for total_xp in skills.values():
        if not isinstance(total_xp, (int, float)):
            return False

    inventory = profile_data['inventory']
    if not isinstance(inventory, dict) or set(inventory.keys()) != set(ALL_ITEMS):
        return False
    for quantity in inventory.values():
        if not isinstance(quantity, (int, float)):
            return False

    return True

# --- Database Helper Functions ---


def read_database():
    if not DATABASE_FILE.exists() or DATABASE_FILE.stat().st_size == 0:
        if INIT_DATABASE_FILE.exists():
            clean_data = json.loads(INIT_DATABASE_FILE.read_text())
        else:
            clean_data = get_default_game_state()
        write_database(clean_data)
        return clean_data

    try:
        data = json.loads(DATABASE_FILE.read_text())
        if 'profiles' not in data or 'selected_profile_index' not in data:
            raise json.JSONDecodeError("Missing essential keys", "", 0)
        return data
    except (IOError, json.JSONDecodeError):
        if INIT_DATABASE_FILE.exists():
            clean_data = json.loads(INIT_DATABASE_FILE.read_text())
        else:
            clean_data = get_default_game_state()
        write_database(clean_data)
        return clean_data


def write_database(data):
    DATABASE_FILE.write_text(json.dumps(data, indent=2))

# --- Core Game Logic ---


def get_level_from_xp(total_xp):
    level, xp_for_next_level, total_xp_for_this_level = 0, BASE_XP, 0
    while total_xp >= total_xp_for_this_level + xp_for_next_level:
        total_xp_for_this_level += xp_for_next_level
        level += 1
        xp_for_next_level = math.floor(xp_for_next_level * XP_GROWTH_RATE)
    return {
        "level": level,
        "current_xp": total_xp - total_xp_for_this_level,
        "xp_to_next_level": xp_for_next_level,
    }


def get_processed_game_state():
    db = read_database()
    sanitized_profiles = []
    for profile in db.get('profiles', []):
        if validate_profile(profile):
            processed_skills, profile_total_level = {}, 0
            for skill_name, total_xp in profile['data']['skills'].items():
                derived_stats = get_level_from_xp(total_xp)
                processed_skills[skill_name] = {
                    "total_xp": total_xp, **derived_stats}
                profile_total_level += derived_stats['level']
            profile['data']['skills'] = processed_skills
            profile['total_level'] = profile_total_level
            profile['status'] = 'ok'
            sanitized_profiles.append(profile)
        else:
            sanitized_profiles.append({
                "name": profile.get('name', 'Unknown Corrupt Profile'),
                "data": {"skills": {}, "inventory": {}}, "total_level": 0, "status": "corrupt"
            })
    db['profiles'] = sanitized_profiles
    return db


def handle_action(action_id):
    db = read_database()
    
    selected_index = db.get('selected_profile_index', 0)
    profile = db['profiles'][selected_index]

    action_map = {
        "gather-wood-button": {"skill": "woodcutting", "xp": 10, "item": "wood", "quantity": 1},
        "mine-stone-button": {"skill": "mining", "xp": 15, "item": "stone", "quantity": 1},
        "forage-herbs-button": {"skill": "foraging", "xp": 5, "item": "herbs", "quantity": 1},
    }
    if action_id in action_map:
        action_info = action_map[action_id]
        skill, item = action_info['skill'], action_info.get('item')

        profile['data']['skills'][skill] += action_info['xp']
        if item:
            profile['data']['inventory'][item] = profile['data']['inventory'].get(
                item, 0) + action_info.get('quantity', 0)
        write_database(db)

        updated_state = get_processed_game_state()
        updated_state['recent_gain'] = action_info
        return updated_state
    else:
        return {"error": "Unknown action ID"}


def new_profile(name):
    db = read_database()
    if not name or name.isspace():
        return {"error": "Profile name cannot be empty"}
    if name.lower() in {p['name'].lower() for p in db['profiles']}:
        return {"error": f"Profile name '{name}' already exists."}
    db['profiles'].append({"name": name, "data": get_default_profile_data()})
    db['selected_profile_index'] = len(db['profiles']) - 1
    write_database(db)
    return get_processed_game_state()


def select_profile(index):
    db = read_database()
    if index is None or not (0 <= index < len(db['profiles'])):
        return {"error": "Invalid profile index"}
    db['selected_profile_index'] = index
    write_database(db)
    return get_processed_game_state()


def rename_profile(new_name):
    db = read_database()
    if not new_name or new_name.isspace():
        return {"error": "New name cannot be empty"}
    selected_index = db.get('selected_profile_index', 0)
    if new_name.lower() in {p['name'].lower() for i, p in enumerate(db['profiles']) if i != selected_index}:
        return {"error": f"Profile name '{new_name}' already exists."}
    db['profiles'][selected_index]['name'] = new_name
    write_database(db)
    return get_processed_game_state()


def delete_profile():
    db = read_database()
    if len(db['profiles']) <= 1:
        return {"error": "Cannot delete the last profile"}
    selected_index = db.get('selected_profile_index', 0)
    db['profiles'].pop(selected_index)
    db['selected_profile_index'] = max(0, selected_index - 1)
    write_database(db)
    return get_processed_game_state()


def reset_profile():
    db = read_database()
    selected_index = db.get('selected_profile_index', 0)
    db['profiles'][selected_index]['data'] = get_default_profile_data()
    write_database(db)
    return get_processed_game_state()


def hard_reset():
    if INIT_DATABASE_FILE.exists():
        db = json.loads(INIT_DATABASE_FILE.read_text())
    else:
        db = get_default_game_state()
    write_database(db)
    return get_processed_game_state()

def fix_profile(index_to_fix):
    db = read_database()
    if index_to_fix is None or not (0 <= index_to_fix < len(db['profiles'])):
        return {"error": "Invalid index provided for fixing."}
    original_name = db['profiles'][index_to_fix].get('name', 'Adventurer')
    db['profiles'][index_to_fix] = {
        "name": original_name, "data": get_default_profile_data()}
    write_database(db)
    return get_processed_game_state()