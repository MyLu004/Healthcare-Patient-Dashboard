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

# Set in backend env (.env / host): VAPI_WEBHOOK_SECRET="super-secret"
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


def _to_int(x: Any):
    return int(x) if x is not None else None


def _to_bool(x: Any, default: bool = True) -> bool:
    if isinstance(x, bool):
        return x
    if x is None:
        return default
    s = str(x).strip().lower()
    if s in ("true", "1", "yes", "y", "on"):
        return True
    if s in ("false", "0", "no", "n", "off"):
        return False
    return default


def _patient_overlap(
    db: Session,
    patient_id: int,
    start_at: datetime,
    end_at: datetime,
    exclude_id: Optional[int] = None,
) -> bool:
    q = db.query(models.Appointment).filter(
        models.Appointment.patient_id == patient_id,
        models.Appointment.start_at < end_at,
        models.Appointment.end_at > start_at,
        models.Appointment.status.in_(
            [models.ApptStatus.requested, models.ApptStatus.confirmed]
        ),
    )
    if exclude_id:
        q = q.filter(models.Appointment.id != exclude_id)
    return db.query(q.exists()).scalar()  # type: ignore


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
    if VAPI_WEBHOOK_SECRET and x_vapi_signature != VAPI_WEBHOOK_SECRET:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature")

    body = await request.json()
    message = (body or {}).get("message") or {}
    if message.get("type") != "tool-calls":
        return {"results": []}

    results: List[Dict[str, Any]] = []

    def add_result(tool_call_id: str, payload: Dict[str, Any]) -> None:
        results.append({"toolCallId": tool_call_id, "result": payload})

    # ---------- START: accept BOTH shapes & dedupe by id ----------
    tool_calls_raw: List[dict] = []
    seen_ids = set()

    for key in ("toolCallList", "toolCalls"):
        arr = message.get(key) or []
        if isinstance(arr, list):
            for tc in arr:
                tid = tc.get("id") or f"{key}:{len(tool_calls_raw)}"
                if tid in seen_ids:
                    continue
                seen_ids.add(tid)
                tool_calls_raw.append(tc)
    # ---------- END: accept BOTH shapes ----------

    for tc in tool_calls_raw:
        tool_call_id = tc.get("id")

        # Support both locations for name/args
        fn = tc.get("function") or {}
        name = (tc.get("name") or fn.get("name") or "").strip()

        
        print(f"[VAPI] tool={name!r} args={args!r}")

        args = tc.get("arguments", None)
        if args is None:
            args = fn.get("arguments", {})

        if isinstance(args, str):
            try:
                args = json.loads(args)
            except Exception:
                args = {}

        def ok(payload: Dict[str, Any]) -> None:
            add_result(tool_call_id, payload)

        def err(msg: str, code: int = 400) -> None:
            ok({"error": msg, "code": code})

        # ---- Optional: tiny debug so you can SEE what's parsed ----
        # print(f"[VAPI] tool={name} args={args}")

        try:
            # --------------------------
            # list_availability
            # --------------------------
            if name == "list_availability":
                if "provider_id" not in args:
                    err("provider_id is required"); continue
                provider_id = int(args["provider_id"])
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

            # --------------------------
            # create_appointment
            # --------------------------
            elif name == "create_appointment":
                required = ["patient_id", "provider_id", "start_at", "end_at", "visit_type"]
                missing = [k for k in required if k not in args]
                if missing:
                    err(f"Missing fields: {', '.join(missing)}"); continue

                patient_id  = int(args["patient_id"])
                provider_id = int(args["provider_id"])
                start_at    = _parse_iso(args["start_at"])
                end_at      = _parse_iso(args["end_at"])
                vt_raw      = str(args.get("visit_type", "telehealth")).lower().strip()
                try:
                    visit_type = models.VisitType(vt_raw)
                except ValueError:
                    err("visit_type must be 'telehealth' or 'in_person'"); continue

                facility_id = args.get("facility_id")
                if facility_id is not None:
                    facility_id = int(facility_id)

                if end_at <= start_at:
                    err("end_at must be after start_at"); continue
                if visit_type == models.VisitType.in_person and facility_id is None:
                    err("in_person requires facility_id"); continue
                if visit_type == models.VisitType.telehealth and facility_id is not None:
                    err("telehealth must not include facility_id"); continue

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
                db.add(appt); db.commit(); db.refresh(appt)
                ok({
                    "appointment_id": appt.id,
                    "status": appt.status.value,
                    "start_at": _iso(appt.start_at),
                    "end_at": _iso(appt.end_at),
                    "provider_id": appt.provider_id,
                })

            # --------------------------
            # update_appointment
            # --------------------------
            elif name == "update_appointment":
                if "appointment_id" not in args:
                    err("appointment_id is required"); continue
                appt_id = int(args["appointment_id"])
                appt = db.get(models.Appointment, appt_id)
                if not appt:
                    err("Appointment not found", 404); continue

                data = {}
                for key in ("start_at","end_at","visit_type","facility_id","location","reason"):
                    if key in args and args[key] is not None:
                        data[key] = args[key]
                if "start_at" in data:
                    data["start_at"] = _parse_iso(data["start_at"])
                if "end_at" in data:
                    data["end_at"] = _parse_iso(data["end_at"])
                if "visit_type" in data:
                    try:
                        data["visit_type"] = models.VisitType(str(data["visit_type"]).lower().strip())
                    except ValueError:
                        err("visit_type must be 'telehealth' or 'in_person'"); continue

                new_start = data.get("start_at", appt.start_at)
                new_end   = data.get("end_at", appt.end_at)
                if new_end <= new_start:
                    err("end_at must be after start_at"); continue
                # Optional: ownership checks here if you want

                for k, v in data.items():
                    setattr(appt, k, v)
                db.commit(); db.refresh(appt)

                ok({
                    "appointment_id": appt.id,
                    "status": appt.status.value,
                    "start_at": _iso(appt.start_at),
                    "end_at": _iso(appt.end_at),
                })

            # --------------------------
            # cancel_appointment
            # --------------------------
            elif name == "cancel_appointment":
                if "appointment_id" not in args:
                    err("appointment_id is required"); continue
                appt = db.get(models.Appointment, int(args["appointment_id"]))
                if not appt:
                    err("Appointment not found", 404); continue
                appt.status = models.ApptStatus.cancelled
                db.commit(); db.refresh(appt)
                ok({"ok": True, "status": appt.status.value})

            # --------------------------
            # list_my_appointments
            # --------------------------
            elif name == "list_my_appointments":
                if "patient_id" not in args:
                    err("patient_id is required"); continue
                patient_id = int(args["patient_id"])
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

            else:
                err(f"Unknown tool '{name}'", 404)

        except Exception as e:
            ok({"error": str(e)})



    return {"results": results}