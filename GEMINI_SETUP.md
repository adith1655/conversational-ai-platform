# Quick Setup with Gemini (Free)

## Why Gemini?
- ✅ **Free tier** with generous quota (60 requests/minute)
- ✅ **Up-to-date knowledge** (unlike local models)
- ✅ **Fast responses** (cloud-based, optimized infrastructure)
- ✅ **No cost** for moderate usage

## 3-Step Setup

### 1. Get your free API key

Visit: https://aistudio.google.com/app/apikey

- Sign in with your Google account
- Click "Create API key"
- Copy the key (starts with `AIza...`)

### 2. Create `.env` file

In the `conversational-ai-platform` folder, create a file named `.env` with:

```bash
LLM_PROVIDER=gemini
LLM_API_KEY=AIzaSy...your-actual-key-here
LLM_MODEL=gemini-2.5-flash
```

### 3. Start the server

```bash
python main.py
```

Then open: http://localhost:8000

## Models

| Model | Speed | Intelligence | Free Tier |
|-------|-------|--------------|-----------|
| `gemini-2.5-flash` | ⚡⚡⚡ Very Fast | 🧠🧠🧠 Excellent | ✅ Yes (recommended) |
| `gemini-2.5-pro` | ⚡⚡ Fast | 🧠🧠🧠🧠 Best | ✅ Yes |
| `gemini-3-flash-preview` | ⚡⚡⚡ Very Fast | 🧠🧠🧠🧠 Cutting Edge | ✅ Yes (preview) |

## That's it!

Your chatbot will now have:
- Current, up-to-date knowledge
- Fast, accurate responses
- Multi-turn conversation with memory
- Zero cost (within free tier limits)

## Troubleshooting

**Error: "API key not valid"**
- Check that you copied the full key from AI Studio
- Make sure `.env` is in the project root (same folder as `main.py`)
- No quotes needed around the key in `.env`

**Error: "google-genai not installed"**
```bash
pip install google-genai
```

**Want to use Ollama instead?**
See `README.md` for local/offline setup with Ollama.
