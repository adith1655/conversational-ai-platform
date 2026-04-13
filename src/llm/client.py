"""LLM client: supports Gemini, Ollama, and OpenAI-compatible APIs."""
import httpx
from typing import Any
from src.config import get_settings


class LLMClient:
    """
    Multi-provider LLM client:
    - Gemini: Google's free tier (up-to-date, generous quota)
    - Ollama: Local, open-source (free, no API key)
    - OpenAI: Paid API (or compatible endpoints)
    """

    def __init__(self):
        settings = get_settings()
        self._provider = settings.llm_provider.lower()
        self._api_key = settings.llm_api_key
        self._base_url = settings.llm_base_url
        self._model = settings.llm_model

        # Lazy-load Gemini SDK only if needed
        self._gemini_client = None
        if self._provider == "gemini":
            try:
                from google import genai
                if self._api_key:
                    self._gemini_client = genai.Client(api_key=self._api_key)
            except ImportError:
                raise ImportError(
                    "google-genai not installed. Run: pip install google-genai"
                )

    async def chat(
        self,
        messages: list[dict[str, str]],
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> str:
        """Send messages and return the assistant reply text."""
        if self._provider == "gemini":
            return await self._chat_gemini(messages, max_tokens, temperature)
        else:
            # OpenAI-compatible (Ollama, OpenAI, Azure, etc.)
            return await self._chat_openai_compatible(messages, max_tokens, temperature)

    async def _chat_gemini(
        self, messages: list[dict[str, str]], max_tokens: int, temperature: float
    ) -> str:
        """Call Gemini API using the new google-genai SDK."""
        if not self._gemini_client:
            raise ValueError("Gemini client not initialized. Set LLM_API_KEY in .env")

        from google.genai import types

        # Convert OpenAI-style messages to Gemini format
        gemini_contents = []
        system_instruction = None
        
        for msg in messages:
            role = msg["role"]
            if role == "system":
                system_instruction = msg["content"]
                continue
            gemini_role = "model" if role == "assistant" else "user"
            gemini_contents.append(
                types.Content(role=gemini_role, parts=[types.Part(text=msg["content"])])
            )

        # Use asyncio to run sync Gemini SDK
        import asyncio
        loop = asyncio.get_event_loop()

        def _generate():
            # Ensure model name has correct format (models/model-name)
            model_name = self._model if self._model.startswith("models/") else f"models/{self._model}"
            
            response = self._gemini_client.models.generate_content(
                model=model_name,
                contents=gemini_contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    max_output_tokens=max_tokens,
                    temperature=temperature,
                ),
            )
            return response.text

        return await loop.run_in_executor(None, _generate)

    async def _chat_openai_compatible(
        self, messages: list[dict[str, str]], max_tokens: int, temperature: float
    ) -> str:
        """Call OpenAI-compatible API (Ollama, OpenAI, Azure, etc.)."""
        payload: dict[str, Any] = {
            "model": self._model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        headers: dict[str, str] = {"Content-Type": "application/json"}
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{self._base_url.rstrip('/')}/chat/completions",
                headers=headers,
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            choice = data.get("choices", [{}])[0]
            return (choice.get("message", {}) or {}).get("content", "")
