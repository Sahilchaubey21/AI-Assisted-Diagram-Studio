import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.deps import get_user_from_token_string
from app.websocket_manager import manager, Connection

router = APIRouter()


@router.websocket("/ws/diagram/{diagram_id}")
async def diagram_socket(websocket: WebSocket, diagram_id: str, token: str = Query(...)):
    db: Session = SessionLocal()
    user = get_user_from_token_string(token, db)
    db.close()

    if not user:
        await websocket.close(code=4401)
        return

    await websocket.accept()
    conn = Connection(
        websocket=websocket,
        user_id=user.id,
        user_name=user.name,
        color=user.avatar_color,
    )
    await manager.connect(diagram_id, conn)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                message = json.loads(raw)
            except json.JSONDecodeError:
                continue

            # Stamp every outgoing event with who sent it, then relay to
            # everyone else in the room. Supported message["type"] values:
            # "draw_start", "draw_point", "draw_end", "shape_add",
            # "shape_update", "clear", "cursor_move", "ai_replace"
            message["user_id"] = user.id
            message["user_name"] = user.name
            message["color"] = user.avatar_color

            await manager.broadcast(diagram_id, message, exclude=websocket)

    except WebSocketDisconnect:
        manager.disconnect(diagram_id, websocket)
        await manager.broadcast(
            diagram_id,
            {"type": "presence", "users": manager.presence(diagram_id)},
        )
