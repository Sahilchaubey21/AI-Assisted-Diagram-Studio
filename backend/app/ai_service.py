import json
import math
import uuid

import httpx

from app.config import settings
from app.schemas import CleanUpRequest, CleanShape

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_MODEL = "claude-sonnet-4-6"


# ---------------------------------------------------------------------------
# Heuristic fallback — works with zero API keys, zero external calls.
# Classifies each hand-drawn stroke as a rectangle, ellipse, straight line,
# or (if too irregular for any of those) a smoothed freehand path.
# ---------------------------------------------------------------------------

def _bbox(points):
    xs = [p.x for p in points]
    ys = [p.y for p in points]
    return min(xs), min(ys), max(xs), max(ys)


def _dist(a, b) -> float:
    return math.hypot(a.x - b.x, a.y - b.y)


def _is_closed(points, width: float, height: float) -> bool:
    span = max(width, height, 1.0)
    return _dist(points[0], points[-1]) < 0.18 * span


def _circularity_score(points, cx: float, cy: float) -> float:
    """0 = perfect circle/ellipse, higher = more irregular / cornered."""
    radii = [math.hypot(p.x - cx, p.y - cy) for p in points]
    if not radii:
        return 999
    mean_r = sum(radii) / len(radii)
    if mean_r == 0:
        return 999
    variance = sum((r - mean_r) ** 2 for r in radii) / len(radii)
    return math.sqrt(variance) / mean_r


def _simplify_path(points, epsilon_ratio: float = 0.02):
    """Ramer-Douglas-Peucker simplification so freehand strokes become
    clean polylines instead of a huge cloud of raw mouse samples."""
    if len(points) <= 2:
        return points

    def rdp(pts, epsilon):
        if len(pts) < 3:
            return pts
        start, end = pts[0], pts[-1]
        max_dist, index = 0.0, 0
        for i in range(1, len(pts) - 1):
            d = _perp_distance(pts[i], start, end)
            if d > max_dist:
                max_dist, index = d, i
        if max_dist > epsilon:
            left = rdp(pts[: index + 1], epsilon)
            right = rdp(pts[index:], epsilon)
            return left[:-1] + right
        return [start, end]

    _, _, x2, y2 = _bbox(points)
    x1, y1, _, _ = _bbox(points)
    diag = math.hypot(x2 - x1, y2 - y1) or 1
    epsilon = diag * epsilon_ratio
    return rdp(points, epsilon)


def _perp_distance(p, a, b) -> float:
    if a.x == b.x and a.y == b.y:
        return _dist(p, a)
    num = abs((b.y - a.y) * p.x - (b.x - a.x) * p.y + b.x * a.y - b.y * a.x)
    den = math.hypot(b.y - a.y, b.x - a.x)
    return num / den


def heuristic_clean_up(req: CleanUpRequest) -> list[CleanShape]:
    shapes: list[CleanShape] = []

    for stroke in req.strokes:
        pts = stroke.points
        if len(pts) < 2:
            continue

        x1, y1, x2, y2 = _bbox(pts)
        width, height = x2 - x1, y2 - y1
        cx, cy = x1 + width / 2, y1 + height / 2

        if _is_closed(pts, width, height) and width > 8 and height > 8:
            score = _circularity_score(pts, cx, cy)
            if score < 0.22:
                # Round, closed loop -> ellipse / circle
                shapes.append(
                    CleanShape(
                        id=str(uuid.uuid4()),
                        type="ellipse",
                        x=x1,
                        y=y1,
                        width=width,
                        height=height,
                        color=stroke.color,
                    )
                )
            else:
                # Closed but angular -> rectangle
                shapes.append(
                    CleanShape(
                        id=str(uuid.uuid4()),
                        type="rectangle",
                        x=x1,
                        y=y1,
                        width=width,
                        height=height,
                        color=stroke.color,
                    )
                )
        elif width > 0.6 * max(height, 1) or height > 0.6 * max(width, 1):
            # Roughly straight, open stroke -> snap to a clean line
            # only if it's actually close to straight; otherwise keep as path
            simplified = _simplify_path(pts, epsilon_ratio=0.015)
            if len(simplified) <= 2:
                shapes.append(
                    CleanShape(
                        id=str(uuid.uuid4()),
                        type="line",
                        x=pts[0].x,
                        y=pts[0].y,
                        points=[pts[0], pts[-1]],
                        color=stroke.color,
                    )
                )
            else:
                shapes.append(
                    CleanShape(
                        id=str(uuid.uuid4()),
                        type="path",
                        x=x1,
                        y=y1,
                        points=simplified,
                        color=stroke.color,
                    )
                )
        else:
            simplified = _simplify_path(pts, epsilon_ratio=0.015)
            shapes.append(
                CleanShape(
                    id=str(uuid.uuid4()),
                    type="path",
                    x=x1,
                    y=y1,
                    points=simplified,
                    color=stroke.color,
                )
            )

    return shapes


# ---------------------------------------------------------------------------
# Real AI path — uses Anthropic's API to interpret the sketch's *intent*
# (e.g. "this is a flowchart with 3 boxes and labeled arrows") when a key
# is configured. Falls back to the heuristic above on any failure.
# ---------------------------------------------------------------------------

async def anthropic_clean_up(req: CleanUpRequest) -> list[CleanShape] | None:
    if not settings.ANTHROPIC_API_KEY:
        return None

    stroke_summary = [
        {
            "id": s.id,
            "bbox": list(_bbox(s.points)),
            "point_count": len(s.points),
            "start": [s.points[0].x, s.points[0].y],
            "end": [s.points[-1].x, s.points[-1].y],
        }
        for s in req.strokes
    ]

    system_prompt = (
        "You interpret rough hand-drawn diagram strokes and convert them into "
        "a clean, structured diagram. Given stroke bounding boxes and endpoints, "
        "infer whether each stroke is a rectangle, ellipse, straight connector line, "
        "or freehand path, and infer any implied text labels from context. "
        "Respond ONLY with a JSON array of shape objects, no prose, no markdown fences. "
        "Each object: {id, type: 'rectangle'|'ellipse'|'line'|'path', x, y, width, height, "
        "label (string or null), color}. Coordinates are in pixels on a "
        f"{req.canvas_width}x{req.canvas_height} canvas."
    )

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                ANTHROPIC_URL,
                headers={
                    "x-api-key": settings.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": ANTHROPIC_MODEL,
                    "max_tokens": 2000,
                    "system": system_prompt,
                    "messages": [
                        {"role": "user", "content": json.dumps(stroke_summary)}
                    ],
                },
            )
            response.raise_for_status()
            data = response.json()
            text = "".join(
                block.get("text", "") for block in data.get("content", []) if block.get("type") == "text"
            )
            text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            raw_shapes = json.loads(text)
            return [CleanShape(**shape) for shape in raw_shapes]
    except Exception:
        return None


async def clean_up_strokes(req: CleanUpRequest) -> tuple[list[CleanShape], str]:
    ai_shapes = await anthropic_clean_up(req)
    if ai_shapes is not None:
        return ai_shapes, "anthropic"
    return heuristic_clean_up(req), "heuristic"
