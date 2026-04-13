"""Application configuration."""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Load from environment or .env."""

    app_name: str = "Green Grass Heritage - Booking Assistant"
    debug: bool = False
    
    # Resort Information
    resort_name: str = "Green Grass Heritage"
    resort_location: str = "Mangadewadi, Pune, Maharashtra 411046"
    resort_contact: str = "+91 7057999599"

    # LLM provider: "gemini", "ollama", or "openai"
    llm_provider: str = "gemini"  # gemini (free tier) | ollama (local, free) | openai (paid)
    
    # API key (required for Gemini & OpenAI, not needed for Ollama)
    llm_api_key: str = ""
    
    # Model name
    llm_model: str = "gemini-1.5-flash"  # gemini-1.5-flash, gemini-1.5-pro, llama3.2, gpt-4, etc.
    
    # Base URL (only for OpenAI-compatible APIs like Ollama)
    llm_base_url: str = "http://localhost:11434/v1"

    # Conversation buffer
    max_turns_in_context: int = 20  # last N user+assistant pairs
    max_tokens_context: int = 4096  # rough cap for context window

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
