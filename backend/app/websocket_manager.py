import json
from dataclasses import dataclass, field

from fastapi import WebSocket


@dataclass
class Connection:
    websocket: WebSocket
    user_id: str
    user_name: str
    color: str


@dataclass
class Room:
    connections: list[Connection] = field(default_factory=list)


class ConnectionManager:
    """
    Tracks who is connected to which diagram ("room") and fans out
    drawing / cursor / presence events to everyone else in that room.
    One room == one diagram being collaboratively edited.
    """

    def __init__(self):
        self.rooms: dict[str, Room] = {}

    def _room(self, diagram_id: str) -> Room:
        if diagram_id not in self.rooms:
            self.rooms[diagram_id] = Room()
        return self.rooms[diagram_id]

    async def connect(self, diagram_id: str, conn: Connection):
        room = self._room(diagram_id)
        room.connections.append(conn)
        await self.broadcast(
            diagram_id,
            {
                "type": "presence",
                "users": [
                    {"user_id": c.user_id, "name": c.user_name, "color": c.color}
                    for c in room.connections
                ],
            },
        )

    def disconnect(self, diagram_id: str, websocket: WebSocket):
        room = self.rooms.get(diagram_id)
        if not room:
            return
        room.connections = [c for c in room.connections if c.websocket is not websocket]
        if not room.connections:
            del self.rooms[diagram_id]

    async def broadcast(self, diagram_id: str, message: dict, exclude: WebSocket | None = None):
        room = self.rooms.get(diagram_id)
        if not room:
            return
        payload = json.dumps(message)
        dead: list[WebSocket] = []
        for conn in room.connections:
            if conn.websocket is exclude:
                continue
            try:
                await conn.websocket.send_text(payload)
            except Exception:
                dead.append(conn.websocket)
        for ws in dead:
            self.disconnect(diagram_id, ws)

    def presence(self, diagram_id: str) -> list[dict]:
        room = self.rooms.get(diagram_id)
        if not room:
            return []
        return [
            {"user_id": c.user_id, "name": c.user_name, "color": c.color}
            for c in room.connections
        ]


manager = ConnectionManager()
