"""Short-term memory: in-memory conversation buffer for multi-turn context."""
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime


@dataclass
class Turn:
    """A single conversation turn (user or assistant)."""
    role: str  # "user" | "assistant" | "system"
    content: str
    timestamp: datetime = field(default_factory=datetime.utcnow)


class ConversationBuffer:
    """
    Keeps the last N turns for a session to provide context to the LLM.
    Thread-safe per session if one buffer per conversation/session is used.
    """

    def __init__(
        self,
        session_id: str,
        max_turns: int = 20,
        system_prompt: Optional[str] = None,
    ):
        self.session_id = session_id
        self.max_turns = max_turns
        self._turns: list[Turn] = []
        if system_prompt:
            self._turns.append(Turn(role="system", content=system_prompt))

    def add_user_message(self, content: str) -> None:
        self._turns.append(Turn(role="user", content=content))
        self._trim()

    def add_assistant_message(self, content: str) -> None:
        self._turns.append(Turn(role="assistant", content=content))
        self._trim()

    def _trim(self) -> None:
        """Keep only the last max_turns (excluding system)."""
        system = [t for t in self._turns if t.role == "system"]
        others = [t for t in self._turns if t.role != "system"]
        if len(others) > self.max_turns:
            others = others[-self.max_turns:]
        self._turns = system + others

    def get_messages_for_llm(self) -> list[dict[str, str]]:
        """Format for OpenAI-compatible chat API: list of {role, content}."""
        return [{"role": t.role, "content": t.content} for t in self._turns]

    def clear(self) -> None:
        """Clear history but keep system prompt if any."""
        system = [t for t in self._turns if t.role == "system"]
        self._turns = system

    def turn_count(self) -> int:
        return len([t for t in self._turns if t.role != "system"])
