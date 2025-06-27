import json
from pathlib import Path
from typing import Any
from src.models import Recipe, Mob, ItemUnion

CONTENT_ROOT = Path(__file__).parent.parent / "content"


def load_json_file(file_path: Path) -> Any:
    with open(file_path, "r") as f:
        return json.load(f)


def load_objects_recursively(directory: Path, model_cls, id_field: str = "id", filter_func=None) -> dict:
    """
    Recursively load all JSON files in a directory, parse them as model_cls, and return a dict keyed by id_field.
    Optionally filter objects with filter_func(obj) -> bool.
    """
    objects = {}
    for path in directory.rglob("*.json"):
        data = load_json_file(path)
        if isinstance(data, list):
            for entry in data:
                try:
                    obj = model_cls(**entry)
                    if not filter_func or filter_func(obj):
                        objects[getattr(obj, id_field)] = obj
                except Exception:
                    continue
        else:
            try:
                obj = model_cls(**data)
                if not filter_func or filter_func(obj):
                    objects[getattr(obj, id_field)] = obj
            except Exception:
                continue
    return objects


# Note: For ITEMS, we want to try all ItemUnion types. So we can define a wrapper function:
def item_union_loader(data):
    for cls in ItemUnion.__args__:
        try:
            return cls(**data)
        except Exception:
            continue
    return None


# Main loader using the general function
ITEMS = load_objects_recursively(
    CONTENT_ROOT / "items", ItemUnion.__args__, filter_func=None)  # See note below
RECIPES = load_objects_recursively(CONTENT_ROOT / "recipes", Recipe)
MOBS = load_objects_recursively(CONTENT_ROOT / "mobs", Mob)

# Overwrite ITEMS with the correct loader
ITEMS = {}
for path in (CONTENT_ROOT / "items").rglob("*.json"):
    data = load_json_file(path)
    if isinstance(data, list):
        for entry in data:
            obj = item_union_loader(entry)
            if obj:
                ITEMS[obj.id] = obj
    else:
        obj = item_union_loader(data)
        if obj:
            ITEMS[obj.id] = obj
