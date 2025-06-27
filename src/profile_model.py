from pydantic import BaseModel, Field, field_validator
from typing import Dict


class Profile(BaseModel):
    skills: Dict[str, float] = Field(default_factory=dict)
    inventory: Dict[str, float] = Field(default_factory=dict)

    @field_validator('skills', mode='before')
    @classmethod
    def validate_skills(cls, v):
        if not isinstance(v, dict):
            raise ValueError('skills must be a dict')
        for k, val in v.items():
            if not isinstance(val, (int, float)):
                raise ValueError(f'skill {k} must be int or float')
        return v

    @field_validator('inventory', mode='before')
    @classmethod
    def validate_inventory(cls, v):
        if not isinstance(v, dict):
            raise ValueError('inventory must be a dict')
        for k, val in v.items():
            if not isinstance(val, (int, float)):
                raise ValueError(f'inventory item {k} must be int or float')
        return v
