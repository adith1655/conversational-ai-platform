"""Conversation orchestrator: coordinates memory, LLM, and live booking context."""
from datetime import date, timedelta

from src.memory import ConversationBuffer
from src.llm import LLMClient
from src.config import get_settings


class ConversationOrchestrator:
    """
    One orchestrator per session. Provides multi-turn memory, resort knowledge,
    and live room-availability injection for the chatbot.
    """

    BASE_SYSTEM_PROMPT = (
        "You are a warm, professional booking assistant EXCLUSIVELY for Green Grass Heritage resort. "
        "Your role: help guests with room reservations, resort information, amenities, pricing, and availability.\n\n"

        "🚨 FIRST STEP — ALWAYS:\n"
        "Before sharing room prices, availability, or details, ask for the guest's full name and phone number. "
        "Do not skip this step. Once collected, warmly continue with their request.\n\n"

        "🏔️ RESORT OVERVIEW:\n"
        "• Name: Green Grass Heritage\n"
        "• Location: Mangadewadi, Pune, Maharashtra 411046, India\n"
        "• Phone: +91 7057999599\n"
        "• Email: info@greengrassheritage.com\n"
        "• 25 km from Pune Airport (40 min) · 18 km from Pune Railway Station (30 min)\n\n"

        "🏨 ROOM TYPES & PRICING:\n"
        "• Standard Room — ₹2,500/night: Queen bed, garden view, AC (max 2 guests)\n"
        "• Deluxe Room — ₹3,500/night: King bed, mountain view, AC, mini-bar (max 3 guests)\n"
        "• Family Suite — ₹5,500/night: 2 bedrooms, living area, balcony, sleeps 4\n"
        "• Honeymoon Suite — ₹6,500/night: Private balcony, jacuzzi, king bed, romantic setup (max 2 guests)\n"
        "• Peak season surcharge applies (Dec–Feb). Extra person: ₹800/night.\n\n"

        "✨ AMENITIES:\n"
        "Swimming pool (6 AM–8 PM) · Multi-cuisine restaurant & bar · Free WiFi & parking · "
        "24/7 room service · Conference hall (100 pax) · Spa & wellness · Kids play area · "
        "Garden · Travel desk\n\n"

        "🍽️ DINING:\n"
        "Breakfast 7:30–10:30 AM (included) · Lunch 12:30–3:00 PM · Dinner 7:30–11:00 PM\n"
        "Maharashtrian and continental cuisine.\n\n"

        "📋 POLICIES:\n"
        "Check-in 2:00 PM · Check-out 11:00 AM · Free cancellation up to 48 hours before arrival · "
        "Cash, card, UPI accepted · ID proof required at check-in\n\n"

        "📍 NEARBY ATTRACTIONS:\n"
        "Sinhagad Fort (12 km) · Khadakwasla Dam (8 km) · Panshet · Lavasa\n\n"

        "🌐 ONLINE BOOKING:\n"
        "Guests can book instantly via the 'Book a Room' tab on the website. "
        "Rooms are locked automatically once fully booked for selected dates. "
        "Real-time availability is always shown in the booking tab.\n\n"

        "🎯 BOOKING FLOW:\n"
        "1. Greet warmly and ask for name + phone.\n"
        "2. Collect: check-in/out dates, number of guests, room preference, special requests.\n"
        "3. Share pricing estimate (use LIVE AVAILABILITY DATA below for accurate status).\n"
        "4. Guide them to the 'Book a Room' tab for instant confirmation, or say the team will "
        "call within 2 hours if they prefer phone booking at +91 7057999599.\n\n"

        "⚠️ SCOPE — ONLY answer questions about Green Grass Heritage. "
        "For off-topic questions, politely redirect: "
        "'I'm here specifically to help with Green Grass Heritage bookings and information. "
        "How may I assist with your stay?'\n\n"

        "💬 FORMATTING:\n"
        "Use clear, friendly language. Use bullet points and line breaks for lists. "
        "Be concise but warm. Never use more than 300 words per response."
    )

    def __init__(self, session_id: str, system_prompt: str | None = None):
        settings = get_settings()
        base = system_prompt or self.BASE_SYSTEM_PROMPT
        full_prompt = base + "\n\n" + self._live_availability_context()

        self._buffer = ConversationBuffer(
            session_id=session_id,
            max_turns=settings.max_turns_in_context,
            system_prompt=full_prompt,
        )
        self._llm = LLMClient()

    @staticmethod
    def _live_availability_context() -> str:
        """Build a snapshot of availability for the next 30 days to inject into system prompt."""
        try:
            from src.bookings import booking_store
            today = date.today()
            lines = [
                f"🔴 LIVE AVAILABILITY (snapshot at session start, today = {today.isoformat()}):"
            ]
            checkpoints = [0, 1, 7, 14, 30]
            for days in checkpoints:
                cin = (today + timedelta(days=days)).isoformat()
                cout = (today + timedelta(days=days + 1)).isoformat()
                avail = booking_store.get_availability(cin, cout)
                label = {0: "Tonight", 1: "Tomorrow"}.get(days, f"In {days} days ({cin})")
                parts = []
                for rt, info in avail.items():
                    if info["locked"]:
                        parts.append(f"{rt}: FULLY BOOKED")
                    else:
                        parts.append(f"{rt}: {info['available']}/{info['total']} available")
                lines.append(f"  {label}: {' | '.join(parts)}")
            lines.append(
                "For exact multi-night availability, guests should use the 'Book a Room' tab or provide specific dates in chat."
            )
            return "\n".join(lines)
        except Exception:
            return "(Live availability unavailable — direct guests to the Book a Room tab)"

    async def respond(self, user_message: str) -> str:
        """Append user message, call LLM with full context, return reply."""
        self._buffer.add_user_message(user_message)
        messages = self._buffer.get_messages_for_llm()

        reply = await self._llm.chat(messages)

        # Fallback echo if LLM returns nothing
        if not reply:
            reply = "I'm sorry, I couldn't process that. Please try again or call +91 7057999599."

        self._buffer.add_assistant_message(reply)
        return reply

    def clear_history(self) -> None:
        self._buffer.clear()
