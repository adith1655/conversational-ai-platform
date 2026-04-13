"""Request/response schemas for the chat and booking APIs."""
from pydantic import BaseModel, Field


# ── Chat ─────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=32_768)
    session_id: str = Field(default="default", min_length=1, max_length=256)


class ChatResponse(BaseModel):
    reply: str
    session_id: str


# ── Booking ───────────────────────────────────────────────────────────────────

class BookingRequest(BaseModel):
    guest_name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=7, max_length=20)
    email: str = Field(default="", max_length=150)
    room_type: str = Field(..., min_length=1, max_length=50)
    check_in: str = Field(..., description="ISO date YYYY-MM-DD")
    check_out: str = Field(..., description="ISO date YYYY-MM-DD")
    guests: int = Field(..., ge=1, le=8)
    special_requests: str = Field(default="", max_length=500)


class BookingResponse(BaseModel):
    booking_id: str
    guest_name: str
    phone: str
    room_type: str
    check_in: str
    check_out: str
    guests: int
    status: str
    message: str
