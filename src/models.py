from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Union, Literal


class Item(BaseModel):
    id: str  # Changed from int to str for human-readable IDs
    name: str
    description: Optional[str] = None
    type: Optional[str] = None
    value: Optional[int] = None
    attributes: Optional[Dict[str, int]] = None


class Tool(Item):
    type: Literal["tool"]
    durability: int
    efficiency: Optional[int] = None


class Weapon(Item):
    type: Literal["weapon"]
    damage: int
    range: Optional[int] = None


class Armor(Item):
    type: Literal["armor"]
    defense: int
    slot: Optional[str] = None  # e.g., head, chest, legs


class Material(Item):
    type: Literal["material"]


ItemUnion = Union[Tool, Weapon, Armor, Material]


class Recipe(BaseModel):
    id: str  # Changed from int to str
    name: str
    ingredients: List[str]  # List of item IDs as strings
    result: str  # Item ID as string
    steps: Optional[List[str]] = None


class Mob(BaseModel):
    id: str  # Changed from int to str
    name: str
    description: Optional[str] = None
    stats: Optional[Dict[str, int]] = None
    drops: Optional[List[str]] = None  # List of item IDs as strings
    level: Optional[int] = None
