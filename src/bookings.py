"""Booking store: in-memory with JSON persistence for room reservations."""
import json
import uuid
from datetime import date, datetime
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Optional

ROOM_INVENTORY: dict[str, dict] = {
    "Standard Room": {
        "count": 4,
        "price": 2500,
        "description": "Queen bed, garden view, AC",
        "icon": "🌿",
        "max_guests": 2,
    },
    "Deluxe Room": {
        "count": 3,
        "price": 3500,
        "description": "King bed, mountain view, AC, mini-bar",
        "icon": "⭐",
        "max_guests": 3,
    },
    "Family Suite": {
        "count": 2,
        "price": 5500,
        "description": "2 bedrooms, living area, private balcony, sleeps 4",
        "icon": "🏡",
        "max_guests": 4,
    },
    "Honeymoon Suite": {
        "count": 1,
        "price": 6500,
        "description": "Private balcony, jacuzzi, king bed, romantic décor",
        "icon": "💑",
        "max_guests": 2,
    },
}


@dataclass
class Booking:
    booking_id: str
    guest_name: str
    phone: str
    email: str
    room_type: str
    check_in: str   # ISO date string YYYY-MM-DD
    check_out: str  # ISO date string YYYY-MM-DD
    guests: int
    special_requests: str
    status: str     # "confirmed" | "cancelled"
    created_at: str


class BookingStore:
    def __init__(self):
        self._bookings: dict[str, Booking] = {}
        self._data_file = Path(__file__).parent.parent / "bookings_data.json"
        self._load()

    # ── persistence ──────────────────────────────────────────────────────────

    def _load(self) -> None:
        if not self._data_file.exists():
            return
        try:
            with open(self._data_file) as f:
                data = json.load(f)
            for b in data:
                self._bookings[b["booking_id"]] = Booking(**b)
        except Exception:
            pass

    def _save(self) -> None:
        try:
            with open(self._data_file, "w") as f:
                json.dump([asdict(b) for b in self._bookings.values()], f, indent=2, default=str)
        except Exception:
            pass

    # ── core logic ───────────────────────────────────────────────────────────

    def _count_overlapping(self, room_type: str, check_in: str, check_out: str) -> int:
        cin = date.fromisoformat(check_in)
        cout = date.fromisoformat(check_out)
        count = 0
        for b in self._bookings.values():
            if b.status == "cancelled" or b.room_type != room_type:
                continue
            b_cin = date.fromisoformat(b.check_in)
            b_cout = date.fromisoformat(b.check_out)
            # Overlap: cin < b_cout AND cout > b_cin
            if cin < b_cout and cout > b_cin:
                count += 1
        return count

    def is_available(self, room_type: str, check_in: str, check_out: str) -> bool:
        if room_type not in ROOM_INVENTORY:
            return False
        capacity = ROOM_INVENTORY[room_type]["count"]
        return self._count_overlapping(room_type, check_in, check_out) < capacity

    # ── public API ───────────────────────────────────────────────────────────

    def get_availability(self, check_in: str, check_out: str) -> dict:
        result = {}
        for room_type, info in ROOM_INVENTORY.items():
            capacity = info["count"]
            booked = self._count_overlapping(room_type, check_in, check_out)
            available = max(0, capacity - booked)
            result[room_type] = {
                "total": capacity,
                "booked": booked,
                "available": available,
                "price": info["price"],
                "description": info["description"],
                "icon": info["icon"],
                "max_guests": info["max_guests"],
                "locked": available == 0,
            }
        return result

    def create_booking(
        self,
        guest_name: str,
        phone: str,
        email: str,
        room_type: str,
        check_in: str,
        check_out: str,
        guests: int,
        special_requests: str = "",
    ) -> Booking:
        if not self.is_available(room_type, check_in, check_out):
            raise ValueError(f"No {room_type} available for the selected dates")

        booking = Booking(
            booking_id=str(uuid.uuid4())[:8].upper(),
            guest_name=guest_name,
            phone=phone,
            email=email,
            room_type=room_type,
            check_in=check_in,
            check_out=check_out,
            guests=guests,
            special_requests=special_requests,
            status="confirmed",
            created_at=datetime.utcnow().isoformat(),
        )
        self._bookings[booking.booking_id] = booking
        self._save()
        return booking

    def get_booking(self, booking_id: str) -> Optional[Booking]:
        return self._bookings.get(booking_id.upper())

    def cancel_booking(self, booking_id: str) -> Optional[Booking]:
        b = self._bookings.get(booking_id.upper())
        if b:
            b.status = "cancelled"
            self._save()
        return b

    def availability_summary_text(self, check_in: str, check_out: str) -> str:
        """Plain-text summary for injecting into chatbot context."""
        avail = self.get_availability(check_in, check_out)
        lines = [f"Room availability ({check_in} → {check_out}):"]
        for room_type, info in avail.items():
            if info["locked"]:
                status = "FULLY BOOKED 🔒"
            else:
                status = f"{info['available']}/{info['total']} available ✅"
            lines.append(f"  • {room_type} ₹{info['price']}/night — {status}")
        return "\n".join(lines)


# Module-level singleton
booking_store = BookingStore()
