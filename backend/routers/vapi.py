# routers/vapi.py
from __future__ import annotations

import os
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from database import get_db
import models

router = APIRouter(prefix="/vapi", tags=["Vapi"])

# Set this in your backend env (.env or host):
# VAPI_WEBHOOK_SECRET="super-secret"
VAPI_WEBHOOK_SECRET = os.getenv("VAPI_WEBHOOK_SECRET", "")


# ---------------------------
# Helpers
# ---------------------------

def _iso(dt: datetime) -> str:
    """Return RFC3339/ISO string in UTC."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat()


def _parse_iso(s: str) -> datetime:
    """Parse ISO8601 strings including trailing 'Z'."""
    s = (s or "").strip()
    if not s:
        raise ValueError("Empty datetime string")
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    return datetime.fromisoformat(s)


def _to_int(x: Any) -> int:
    return int(x) if x is not None else None


# ---------------------------
# Healthcheck
# ---------------------------

@router.get("/health")
def healthcheck() -> Dict[str, str]:
    return {"ok": "vapi"}


# ---------------------------
# Webhook entry
# ---------------------------

@router.post("/tools")
async def vapi_tool_calls(
    request: Request,
    db: Session = Depends(get_db),
    x_vapi_signature: Optional[str] = Header(None),
):
    """
    Vapi posts tool calls here.

    Incoming (simplified):
    {
      "message": {
        "type": "tool-calls",
        "toolCallList": [
          {"id":"...","name":"list_availability","arguments": {...}},
          ...
        ]
      }
    }

    Response MUST be:
    { "results": [ { "toolCallId": "<id>", "result": {...} }, ... ] }
    """
    # --- Verify shared-secret ---
    if VAPI_WEBHOOK_SECRET and x_vapi_signature != VAPI_WEBHOOK_SECRET:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature")

    body = await request.json()
    message = (body or {}).get("message") or {}
    if message.get("type") != "tool-calls":
        # Ignore non tool events
        return {"results": []}

    results: List[Dict[str, Any]] = []

    def add_result(tool_call_id: str, payload: Dict[str, Any]) -> None:
        results.append({"toolCallId": tool_call_id, "result": payload})

    for tc in message.get("toolCallList", []) or []:
        tool_call_id = tc.get("id")
        name = (tc.get("name") or "").strip()
        args = tc.get("arguments") or {}

        # Some providers send JSON string for args
        if isinstance(args, str):
            try:
                args = json.loads(args)
            except Exception:
                args = {}

        def ok(payload: Dict[str, Any]) -> None:
            add_result(tool_call_id, payload)

        def err(msg: str, code: int = 400) -> None:
            ok({"error": msg, "code": code})

        try:
            # -------------------------------------------------
            # list_availability
            # -------------------------------------------------
            if name == "list_availability":
                if "provider_id" not in args:
                    err("provider_id is required"); continue

                provider_id = _to_int(args["provider_id"])
                start_from = args.get("start_from")

                q = db.query(models.Availability).filter(
                    models.Availability.provider_id == provider_id
                )
                if start_from:
                    q = q.filter(models.Availability.start_at >= _parse_iso(start_from))

                rows = q.order_by(models.Availability.start_at.asc()).limit(200).all()
                slots = [{
                    "id": r.id,
                    "provider_id": r.provider_id,
                    "start_at": _iso(r.start_at),
                    "end_at": _iso(r.end_at),
                    "visit_type": r.visit_type.value,
                    "facility_id": r.facility_id,
                    "location": getattr(r, "location", None),
                } for r in rows]
                ok({"slots": slots})

            # -------------------------------------------------
            # create_appointment
            # -------------------------------------------------
            elif name == "create_appointment":
                required = ["patient_id", "provider_id", "start_at", "end_at", "visit_type"]
                missing = [k for k in required if k not in args]
                if missing:
                    err(f"Missing fields: {', '.join(missing)}"); continue

                patient_id  = _to_int(args["patient_id"])
                provider_id = _to_int(args["provider_id"])
                start_at    = _parse_iso(args["start_at"])
                end_at      = _parse_iso(args["end_at"])

                # Normalize visit_type (accept mixed case)
                visit_type_raw = str(args.get("visit_type", "telehealth")).lower().strip()
                try:
                    visit_type = models.VisitType(visit_type_raw)
                except ValueError:
                    err("visit_type must be 'telehealth' or 'in_person'"); continue

                facility_id = args.get("facility_id")
                if facility_id is not None:
                    facility_id = _to_int(facility_id)

                # Business rules (mirror your /appointments router)
                if end_at <= start_at:
                    err("end_at must be after start_at"); continue
                if visit_type == models.VisitType.in_person and facility_id is None:
                    err("in_person requires facility_id"); continue
                if visit_type == models.VisitType.telehealth and facility_id is not None:
                    err("telehealth must not include facility_id"); continue

                # Block if overlaps a confirmed appt for this provider
                conflict = db.query(models.Appointment).filter(
                    models.Appointment.provider_id == provider_id,
                    models.Appointment.start_at < end_at,
                    models.Appointment.end_at > start_at,
                    models.Appointment.status == models.ApptStatus.confirmed,
                ).first()
                if conflict:
                    err("Time slot not available", 409); continue

                appt = models.Appointment(
                    patient_id=patient_id,
                    provider_id=provider_id,
                    facility_id=facility_id,
                    availability_id=args.get("availability_id"),
                    start_at=start_at,
                    end_at=end_at,
                    visit_type=visit_type,
                    location=args.get("location"),
                    reason=args.get("reason"),
                    status=models.ApptStatus.requested,
                    video_url=None,
                )
                try:
                    db.add(appt)
                    db.commit()
                except Exception:
                    db.rollback()
                    raise
                db.refresh(appt)

                ok({
                    "appointment_id": appt.id,
                    "status": appt.status.value,
                    "start_at": _iso(appt.start_at),
                    "end_at": _iso(appt.end_at),
                    "provider_id": appt.provider_id,
                })

            # -------------------------------------------------
            # cancel_appointment
            # -------------------------------------------------
            elif name == "cancel_appointment":
                # Require identity: either patient_id OR provider_id, plus appointment_id
                if "appointment_id" not in args or ("patient_id" not in args and "provider_id" not in args):
                    err("appointment_id and patient_id or provider_id are required"); continue

                appt_id = _to_int(args["appointment_id"])
                appt = db.get(models.Appointment, appt_id)
                if not appt:
                    err("Appointment not found", 404); continue

                pid = args.get("patient_id")
                prvid = args.get("provider_id")

                if pid is not None and _to_int(pid) != appt.patient_id and prvid is None:
                    err("Forbidden: appointment does not belong to patient", 403); continue
                if prvid is not None and _to_int(prvid) != appt.provider_id and pid is None:
                    err("Forbidden: appointment does not belong to provider", 403); continue

                try:
                    appt.status = models.ApptStatus.cancelled
                    db.commit()
                except Exception:
                    db.rollback()
                    raise
                db.refresh(appt)
                ok({"ok": True, "status": appt.status.value})

            # -------------------------------------------------
            # list_my_appointments
            # -------------------------------------------------
            elif name == "list_my_appointments":
                if "patient_id" not in args:
                    err("patient_id is required"); continue

                patient_id = _to_int(args["patient_id"])
                active_only = bool(args.get("active_only", True))

                q = db.query(models.Appointment).filter(
                    models.Appointment.patient_id == patient_id
                )
                if active_only:
                    q = q.filter(
                        models.Appointment.status.in_(
                            [models.ApptStatus.requested, models.ApptStatus.confirmed]
                        )
                    )
                rows = q.order_by(models.Appointment.start_at.asc()).limit(100).all()

                data = [{
                    "id": a.id,
                    "start_at": _iso(a.start_at),
                    "end_at": _iso(a.end_at),
                    "visit_type": a.visit_type.value,
                    "status": a.status.value,
                    "provider_id": a.provider_id,
                    "facility_id": a.facility_id,
                } for a in rows]
                ok({"appointments": data})

            # -------------------------------------------------
            # Unknown tool
            # -------------------------------------------------
            else:
                err(f"Unknown tool '{name}'", 404)

        except Exception as e:
            # Don't leak stack traces/PHI; return concise error
            ok({"error": str(e)})

    return {"results": results}
