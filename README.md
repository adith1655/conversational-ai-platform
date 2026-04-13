# Deep Learning Conversational AI Platform

MVP implementation: **multi-turn chat** with **short-term memory** and **transformer-based response generation**.

## What's included (MVP)

- **API Gateway** – FastAPI app with `/api/v1/chat` and health
- **Conversation orchestrator** – Coordinates context and LLM calls
- **Short-term memory** – In-memory conversation buffer (last N turns per session)
- **LLM integration** – **Gemini by default** (free tier, up-to-date); also supports Ollama (local) and OpenAI

## Free LLM: Gemini (recommended)

The app uses **Google Gemini** by default — **free tier with generous quota**, up-to-date knowledge, and fast responses.

### Quick start with Gemini:

1. **Get a free API key:** Visit [Google AI Studio](https://aistudio.google.com/app/apikey) and click "Create API key"
2. **Create `.env` file** in the project root:
   ```bash
   LLM_PROVIDER=gemini
   LLM_API_KEY=your-gemini-api-key-here
   LLM_MODEL=gemini-1.5-flash
   ```
3. Start the app — that's it!

**Models:**
- `gemini-1.5-flash` — Fast, free tier (recommended)
- `gemini-1.5-pro` — Smarter, still free tier
- `gemini-2.0-flash-exp` — Experimental, cutting-edge

### Alternative: Ollama (local, offline)

If you prefer local/offline:

1. Install [Ollama](https://ollama.com)
2. Pull a model: `ollama pull llama3.2`
3. In `.env`:
   ```bash
   LLM_PROVIDER=ollama
   LLM_MODEL=llama3.2
   LLM_BASE_URL=http://localhost:11434/v1
   ```

## Setup

```bash
cd conversational-ai-platform
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

**For Gemini:** Create `.env` and add your API key (see "Free LLM: Gemini" above).

**For Ollama:** Copy `.env.example` to `.env` and set `LLM_PROVIDER=ollama`.

## Run

From the project root (`conversational-ai-platform`):

```bash
python main.py
```

Or:

```bash
uvicorn src.api.app:app --reload --host 0.0.0.0 --port 8000
```

- **Chat UI:** http://localhost:8000 (user-friendly multi-turn chat)
- **API docs:** http://localhost:8000/docs
- **Health:** http://localhost:8000/api/v1/health  

## API usage

**Health**

```http
GET /api/v1/health
```

**Chat (multi-turn)**

```http
POST /api/v1/chat
Content-Type: application/json

{
  "message": "What's the capital of France?",
  "session_id": "user-123"
}
```

Use the same `session_id` to keep context across messages.

**Clear session memory**

```http
POST /api/v1/sessions/{session_id}/clear
```

## Chat UI

Opening http://localhost:8000 in a browser shows the chat interface:

- **Message bubbles** for you and the assistant, with a typing indicator while the bot replies
- **Session memory** kept in the browser (same tab); use "Clear chat" to reset context
- **Enter** to send, **Shift+Enter** for a new line
- **API docs** link in the header for developers

## Project layout

```
conversational-ai-platform/
├── main.py                 # Run the API
├── frontend/               # Chat UI
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── requirements.txt
├── .env.example
├── src/
│   ├── config.py           # Settings (env)
│   ├── api/
│   │   ├── app.py          # FastAPI app
│   │   ├── routes.py       # Chat & health
│   │   └── schemas.py      # Request/response models
│   ├── memory/
│   │   └── conversation_buffer.py   # Short-term memory
│   ├── llm/
│   │   └── client.py       # Multi-provider LLM client (Gemini, Ollama, OpenAI)
│   └── orchestrator/
│       └── conversation.py # Multi-turn orchestration
```

## Next steps (from PRD)

- **Context & memory** – Vector long-term memory, relevance scoring
- **Reasoning & tools** – RAG, tool calls, verification
- **Production** – Safety layer, scaling, observability, persistent session store
