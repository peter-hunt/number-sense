import json
import math
from pathlib import Path
import copy
import os

# --- Constants ---
PROFILES_DIR = Path('profiles')
SETTINGS_FILE = Path('data/settings.json')
INIT_PROFILE_FILE = Path('data/init_profile.json')
BASE_XP = 100
XP_GROWTH_RATE = 1.15
ALL_STATS = ["strength", "intelligence", "dexterity"]

# --- Load Initial Data ---


def load_initial_profile_template():
    """Loads the initial profile structure from the JSON file."""
    try:
        return json.loads(INIT_PROFILE_FILE.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        # Fallback to a hardcoded default if the file is missing or corrupt
        return {
            "skills": {"woodcutting": 0, "mining": 0, "foraging": 0},
            "inventory": {"wood": 0, "stone": 0, "herbs": 0},
        }


# Load the template once at startup
INITIAL_PROFILE_TEMPLATE = load_initial_profile_template()
ALL_SKILLS = list(INITIAL_PROFILE_TEMPLATE.get('skills', {}).keys())
ALL_ITEMS = list(INITIAL_PROFILE_TEMPLATE.get('inventory', {}).keys())


# --- Initialization ---
PROFILES_DIR.mkdir(exist_ok=True)
SETTINGS_FILE.parent.mkdir(exist_ok=True)

# --- Data Validation & Defaults ---


def get_default_profile_data():
    """Returns the default data for a single profile by copying the template."""
    return copy.deepcopy(INITIAL_PROFILE_TEMPLATE)


def validate_profile_data(data):
    """
    Performs a deep structural integrity check on a profile's data.
    """
    if 'skills' not in data or 'inventory' not in data:
        return False

    skills = data['skills']
    if not isinstance(skills, dict) or set(skills.keys()) != set(ALL_SKILLS):
        return False
    for total_xp in skills.values():
        if not isinstance(total_xp, (int, float)):
            return False

    inventory = data['inventory']
    if not isinstance(inventory, dict) or set(inventory.keys()) != set(ALL_ITEMS):
        return False
    for quantity in inventory.values():
        if not isinstance(quantity, (int, float)):
            return False
    return True

# --- Profile & Settings I/O ---


def get_profile_list():
    """Returns a list of profile names from the profiles directory."""
    return [p.stem for p in PROFILES_DIR.glob('*.json')]


def read_profile(profile_name):
    """Reads and validates a single profile file."""
    profile_file = PROFILES_DIR / f"{profile_name}.json"
    if not profile_file.exists():
        return None
    try:
        data = json.loads(profile_file.read_text())
        if validate_profile_data(data):
            return {"name": profile_name, "data": data, "status": "ok"}
        else:
            return {"name": profile_name, "data": get_default_profile_data(), "status": "corrupt"}
    except (IOError, json.JSONDecodeError):
        return {"name": profile_name, "data": get_default_profile_data(), "status": "corrupt"}


def write_profile(profile_name, data):
    """Writes data to a profile file."""
    profile_file = PROFILES_DIR / f"{profile_name}.json"
    profile_file.write_text(json.dumps(data, indent=2))


def get_selected_profile_name():
    """Gets the selected profile name from settings."""
    if not SETTINGS_FILE.exists():
        profile_list = get_profile_list()
        if not profile_list:
            # First time run: create a default profile
            new_profile("Adventurer")  # This will set the selected profile
            return "Adventurer"

        set_selected_profile_name(profile_list[0])
        return profile_list[0]

    try:
        settings = json.loads(SETTINGS_FILE.read_text())
        selected_name = settings.get('selected_profile_name')
        # Validate that the selected profile still exists
        if selected_name and (PROFILES_DIR / f"{selected_name}.json").exists():
            return selected_name
        else:
            # If not, select the first available profile
            profile_list = get_profile_list()
            if profile_list:
                set_selected_profile_name(profile_list[0])
                return profile_list[0]
            else:
                # If no profiles exist at all, create one
                new_profile("Adventurer")
                return "Adventurer"
    except (IOError, json.JSONDecodeError):
        # If settings are corrupt, select the first profile
        profile_list = get_profile_list()
        if profile_list:
            set_selected_profile_name(profile_list[0])
            return profile_list[0]
        else:
            new_profile("Adventurer")
            return "Adventurer"


def set_selected_profile_name(profile_name):
    """Sets the selected profile name in settings."""
    SETTINGS_FILE.write_text(json.dumps(
        {"selected_profile_name": profile_name}))


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


def calculate_stats(skills):
    """Calculates player stats based on skill levels."""
    stats = {stat: 1 for stat in ALL_STATS}  # Base value of 1 for all stats

    # Example logic: Strength from mining, Dexterity from woodcutting, Intelligence from foraging
    if 'mining' in skills:
        stats['strength'] += math.floor(
            get_level_from_xp(skills['mining'])['level'] / 5)
    if 'woodcutting' in skills:
        stats['dexterity'] += math.floor(
            get_level_from_xp(skills['woodcutting'])['level'] / 5)
    if 'foraging' in skills:
        stats['intelligence'] += math.floor(
            get_level_from_xp(skills['foraging'])['level'] / 3)

    return stats


def get_processed_game_state():
    """Builds the complete game state from individual files."""
    profile_names = get_profile_list()
    selected_name = get_selected_profile_name()
    if not profile_names:
        # If after all checks, there are no profiles, create a default one.
        new_profile("Adventurer")
        profile_names = ["Adventurer"]
        selected_name = "Adventurer"
    all_profiles = []
    selected_profile_index = 0
    for i, name in enumerate(profile_names):
        profile = read_profile(name)

        # Store the raw skills before processing for stats calculation
        raw_skills = profile['data']['skills'].copy()

        processed_skills, profile_total_level = {}, 0
        # Process skills for both valid and corrupt profiles to show levels if possible
        for skill_name, total_xp in profile['data']['skills'].items():
            derived_stats = get_level_from_xp(total_xp)
            processed_skills[skill_name] = {
                "total_xp": total_xp, **derived_stats}
            profile_total_level += derived_stats['level']
        profile['data']['skills'] = processed_skills
        profile['total_level'] = profile_total_level

        # Calculate stats using the raw skill XP values
        profile['data']['stats'] = calculate_stats(raw_skills)

        all_profiles.append(profile)
        if name == selected_name:
            selected_profile_index = i
    return {
        "profiles": all_profiles,
        "selected_profile_index": selected_profile_index
    }


def handle_action(action_id):
    selected_name = get_selected_profile_name()
    profile = read_profile(selected_name)

    if profile['status'] == 'corrupt':
        return {"error": "Cannot perform actions on a corrupt profile. Please fix it first."}

    action_map = {
        "gather-wood-button": {"skill": "woodcutting", "xp": 10, "item": "wood", "quantity": 1},
        "mine-stone-button": {"skill": "mining", "xp": 15, "item": "stone", "quantity": 1},
        "forage-herbs-button": {"skill": "foraging", "xp": 5, "item": "herbs", "quantity": 1},
    }

    if action_id in action_map:
        action_info = action_map[action_id]
        skill = action_info['skill']
        item = action_info.get('item')

        profile['data']['skills'][skill] += action_info['xp']
        if item:
            profile['data']['inventory'][item] = profile['data']['inventory'].get(
                item, 0) + action_info.get('quantity', 0)

        write_profile(selected_name, profile['data'])

        updated_state = get_processed_game_state()
        updated_state['recent_gain'] = action_info
        return updated_state
    else:
        return {"error": "Unknown action ID"}

# --- Profile Management Functions ---


def new_profile(name):
    if not name or name.isspace():
        return {"error": "Profile name cannot be empty"}
    if name.lower() in {p.lower() for p in get_profile_list()}:
        return {"error": f"Profile name '{name}' already exists."}

    write_profile(name, get_default_profile_data())
    set_selected_profile_name(name)
    return get_processed_game_state()


def select_profile(index):
    profile_list = get_profile_list()
    if index is None or not (0 <= index < len(profile_list)):
        return {"error": "Invalid profile index"}

    set_selected_profile_name(profile_list[index])
    return get_processed_game_state()


def rename_profile(new_name):
    if not new_name or new_name.isspace():
        return {"error": "New name cannot be empty"}

    selected_name = get_selected_profile_name()
    profile_list = get_profile_list()
    # Exclude the current profile name from the check
    if new_name.lower() in {p.lower() for p in profile_list if p.lower() != selected_name.lower()}:
        return {"error": f"Profile name '{new_name}' already exists."}

    profile_data = read_profile(selected_name)['data']

    write_profile(new_name, profile_data)
    set_selected_profile_name(new_name)

    old_file = PROFILES_DIR / f"{selected_name}.json"
    if old_file.exists():
        old_file.unlink()

    return get_processed_game_state()


def delete_profile():
    profile_list = get_profile_list()
    if len(profile_list) <= 1:
        return {"error": "Cannot delete the last profile"}

    name_to_delete = get_selected_profile_name()

    current_index = profile_list.index(name_to_delete)
    new_index_to_select = max(0, current_index - 1)
    if new_index_to_select < len(profile_list):
        set_selected_profile_name(profile_list[new_index_to_select])

    file_to_delete = PROFILES_DIR / f"{name_to_delete}.json"
    if file_to_delete.exists():
        file_to_delete.unlink()

    return get_processed_game_state()


def reset_profile():
    selected_name = get_selected_profile_name()
    write_profile(selected_name, get_default_profile_data())
    return get_processed_game_state()


def fix_profile(index_to_fix):
    """'Fixes' a corrupt profile by resetting it to the default state."""
    profile_list = get_profile_list()
    if index_to_fix is None or not (0 <= index_to_fix < len(profile_list)):
        return {"error": "Invalid index provided for fixing."}

    name_to_fix = profile_list[index_to_fix]
    write_profile(name_to_fix, get_default_profile_data())
    return get_processed_game_state()


def hard_reset():
    """Deletes all profiles and starts fresh."""
    for profile_file in PROFILES_DIR.glob('*.json'):
        profile_file.unlink()

    if SETTINGS_FILE.exists():
        SETTINGS_FILE.unlink()

    # Create a new default profile
    new_profile("Adventurer")

    return get_processed_game_state()
