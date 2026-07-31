import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    avatar_color = Column(String, default="#6C5CE7")
    created_at = Column(DateTime, default=datetime.utcnow)

    diagrams = relationship("Diagram", back_populates="owner", cascade="all, delete-orphan")


class Diagram(Base):
    __tablename__ = "diagrams"

    id = Column(String, primary_key=True, default=gen_uuid)
    title = Column(String, default="Untitled diagram")
    # JSON-encoded canvas state: strokes, shapes, text nodes
    content = Column(Text, default="[]")
    thumbnail = Column(Text, nullable=True)  # base64 PNG snapshot, optional
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="diagrams")
