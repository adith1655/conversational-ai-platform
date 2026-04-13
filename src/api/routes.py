"""Chat, availability, and booking endpoints."""
from datetime import date as dt_date

from fastapi import APIRouter, HTTPException, Query

from src.api.schemas import (
    ChatRequest, ChatResponse,
    BookingRequest, BookingResponse,
)
from src.orchestrator import ConversationOrchestrator
from src.bookings import booking_store, ROOM_INVENTORY

router = APIRouter(prefix="/api/v1", tags=["api"])

# In-memory session store (replace with Redis/DB for production)
_sessions: dict[str, ConversationOrchestrator] = {}


def _get_orchestrator(session_id: str) -> ConversationOrchestrator:
    if session_id not in _sessions:
        _sessions[session_id] = ConversationOrchestrator(session_id=session_id)
    return _sessions[session_id]


# ── Health ────────────────────────────────────────────────────────────────────

@router.get("/health")
async def health():
    return {"status": "ok", "service": "green-grass-heritage"}


# ── Chat ──────────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Multi-turn chat with memory and live availability context."""
    try:
        orch = _get_orchestrator(req.session_id)
        reply = await orch.respond(req.message)
        return ChatResponse(reply=reply, session_id=req.session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions/{session_id}/clear")
async def clear_session(session_id: str):
    """Clear conversation history and availability context for a session."""
    if session_id in _sessions:
        del _sessions[session_id]
    return {"session_id": session_id, "cleared": True}


# ── Availability ──────────────────────────────────────────────────────────────

@router.get("/availability")
async def get_availability(
    check_in: str = Query(..., description="ISO date YYYY-MM-DD"),
    check_out: str = Query(..., description="ISO date YYYY-MM-DD"),
):
    """Return real-time room availability for a date range."""
    try:
        cin = dt_date.fromisoformat(check_in)
        cout = dt_date.fromisoformat(check_out)
    except ValueError:
        raise HTTPException(status_code=400, detail="Dates must be in YYYY-MM-DD format")

    if cout <= cin:
        raise HTTPException(status_code=400, detail="check_out must be after check_in")
    if cin < dt_date.today():
        raise HTTPException(status_code=400, detail="check_in cannot be in the past")

    availability = booking_store.get_availability(check_in, check_out)
    nights = (cout - cin).days
    return {
        "check_in": check_in,
        "check_out": check_out,
        "nights": nights,
        "availability": availability,
    }


@router.get("/rooms")
async def get_rooms():
    """Return all room types with static details."""
    return {"rooms": ROOM_INVENTORY}


# ── Bookings ──────────────────────────────────────────────────────────────────

@router.post("/bookings", response_model=BookingResponse)
async def create_booking(req: BookingRequest):
    """Create a confirmed room booking; returns booking ID."""
    try:
        cin = dt_date.fromisoformat(req.check_in)
        cout = dt_date.fromisoformat(req.check_out)
    except ValueError:
        raise HTTPException(status_code=400, detail="Dates must be in YYYY-MM-DD format")

    if cout <= cin:
        raise HTTPException(status_code=400, detail="check_out must be after check_in")
    if cin < dt_date.today():
        raise HTTPException(status_code=400, detail="check_in cannot be in the past")
    if req.room_type not in ROOM_INVENTORY:
        raise HTTPException(status_code=400, detail=f"Unknown room type: {req.room_type}")

    max_guests = ROOM_INVENTORY[req.room_type]["max_guests"]
    if req.guests > max_guests:
        raise HTTPException(
            status_code=400,
            detail=f"{req.room_type} supports a maximum of {max_guests} guests",
        )

    try:
        booking = booking_store.create_booking(
            guest_name=req.guest_name,
            phone=req.phone,
            email=req.email,
            room_type=req.room_type,
            check_in=req.check_in,
            check_out=req.check_out,
            guests=req.guests,
            special_requests=req.special_requests or "",
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    nights = (dt_date.fromisoformat(req.check_out) - dt_date.fromisoformat(req.check_in)).days
    price_per_night = ROOM_INVENTORY[req.room_type]["price"]
    total = nights * price_per_night

    return BookingResponse(
        booking_id=booking.booking_id,
        guest_name=booking.guest_name,
        phone=booking.phone,
        room_type=booking.room_type,
        check_in=booking.check_in,
        check_out=booking.check_out,
        guests=booking.guests,
        status=booking.status,
        message=(
            f"Booking confirmed! Your ID is {booking.booking_id}. "
            f"Total estimate: ₹{total:,} for {nights} night{'s' if nights > 1 else ''}. "
            f"Our team will contact you at {booking.phone} within 2 hours to confirm payment."
        ),
    )


@router.get("/bookings/{booking_id}")
async def get_booking(booking_id: str):
    """Retrieve a booking by ID."""
    booking = booking_store.get_booking(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.post("/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: str):
    """Cancel a booking by ID."""
    booking = booking_store.cancel_booking(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"booking_id": booking_id, "status": "cancelled"}
