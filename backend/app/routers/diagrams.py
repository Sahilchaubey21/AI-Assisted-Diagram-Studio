import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Diagram, User
from app.schemas import DiagramCreate, DiagramOut, DiagramUpdate, DiagramSummary

router = APIRouter(prefix="/api/diagrams", tags=["diagrams"])


def _to_out(d: Diagram) -> DiagramOut:
    return DiagramOut(
        id=d.id,
        title=d.title,
        content=json.loads(d.content or "[]"),
        thumbnail=d.thumbnail,
        owner_id=d.owner_id,
        created_at=d.created_at,
        updated_at=d.updated_at,
    )


@router.get("", response_model=list[DiagramSummary])
def list_diagrams(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    diagrams = (
        db.query(Diagram)
        .filter(Diagram.owner_id == user.id)
        .order_by(Diagram.updated_at.desc())
        .all()
    )
    return diagrams


@router.post("", response_model=DiagramOut, status_code=201)
def create_diagram(
    payload: DiagramCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    diagram = Diagram(title=payload.title or "Untitled diagram", content="[]", owner_id=user.id)
    db.add(diagram)
    db.commit()
    db.refresh(diagram)
    return _to_out(diagram)


@router.get("/{diagram_id}", response_model=DiagramOut)
def get_diagram(diagram_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    diagram = db.query(Diagram).filter(Diagram.id == diagram_id).first()
    if not diagram:
        raise HTTPException(status_code=404, detail="Diagram not found")
    if diagram.owner_id != user.id:
        raise HTTPException(status_code=403, detail="You don't have access to this diagram")
    return _to_out(diagram)


@router.put("/{diagram_id}", response_model=DiagramOut)
def update_diagram(
    diagram_id: str,
    payload: DiagramUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    diagram = db.query(Diagram).filter(Diagram.id == diagram_id).first()
    if not diagram:
        raise HTTPException(status_code=404, detail="Diagram not found")
    if diagram.owner_id != user.id:
        raise HTTPException(status_code=403, detail="You don't have access to this diagram")

    if payload.title is not None:
        diagram.title = payload.title
    if payload.content is not None:
        diagram.content = json.dumps(payload.content)
    if payload.thumbnail is not None:
        diagram.thumbnail = payload.thumbnail

    db.commit()
    db.refresh(diagram)
    return _to_out(diagram)


@router.delete("/{diagram_id}", status_code=204)
def delete_diagram(diagram_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    diagram = db.query(Diagram).filter(Diagram.id == diagram_id).first()
    if not diagram:
        raise HTTPException(status_code=404, detail="Diagram not found")
    if diagram.owner_id != user.id:
        raise HTTPException(status_code=403, detail="You don't have access to this diagram")
    db.delete(diagram)
    db.commit()
    return None
