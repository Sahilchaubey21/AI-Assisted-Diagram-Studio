from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------

class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    avatar_color: str

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Diagrams ----------

class DiagramCreate(BaseModel):
    title: Optional[str] = "Untitled diagram"


class DiagramUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[list[dict[str, Any]]] = None
    thumbnail: Optional[str] = None


class DiagramOut(BaseModel):
    id: str
    title: str
    content: list[dict[str, Any]]
    thumbnail: Optional[str] = None
    owner_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DiagramSummary(BaseModel):
    id: str
    title: str
    thumbnail: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------- AI ----------

class Point(BaseModel):
    x: float
    y: float


class StrokeIn(BaseModel):
    id: str
    points: list[Point]
    color: str = "#1B1B2F"
    width: float = 3


class CleanUpRequest(BaseModel):
    strokes: list[StrokeIn]
    canvas_width: float = 1200
    canvas_height: float = 800


class CleanShape(BaseModel):
    id: str
    type: str  # rectangle | ellipse | line | path | text
    x: float
    y: float
    width: float = 0
    height: float = 0
    points: Optional[list[Point]] = None
    label: Optional[str] = None
    color: str = "#1B1B2F"


class CleanUpResponse(BaseModel):
    shapes: list[CleanShape]
    engine: str  # "anthropic" | "heuristic"
