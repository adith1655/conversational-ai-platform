# 🚀 Quick Start Guide

## Current Status
Your app is **ready to run** but needs:
1. Your Gemini API key (free)
2. Manual start from your terminal

---

## Step 1: Get Gemini API Key (1 minute)

1. Visit: **https://aistudio.google.com/app/apikey**
2. Click "Create API key"
3. Copy the key (starts with `AIza...`)

---

## Step 2: Add Your API Key

Open the file `.env` in this folder and replace the placeholder:

**Before:**
```
LLM_API_KEY=PASTE-YOUR-GEMINI-API-KEY-HERE
```

**After:**
```
LLM_API_KEY=AIzaSyC_your_actual_key_here_123456
```

Save the file.

---

## Step 3: Start the Server

### Option A: Double-click (Windows)

Just double-click: **`start_server.bat`**

### Option B: Command line

Open PowerShell or Command Prompt:

```bash
cd d:\Dekstop\VS\conversational-ai-platform
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## Step 4: Open the Chat

Open your browser and go to:

**http://localhost:8000**

You'll see a beautiful chat interface. Type a message and press Enter!

---

## ⚠️ Important Notes

**The app will NOT work until you:**
1. Add your real Gemini API key to `.env`
2. Start the server from YOUR OWN terminal (not through Cursor/IDE)

The server must keep running while you chat. Don't close the terminal window.

---

## Need Help?

- **Server won't start?** Make sure Python is installed: `python --version`
- **"Module not found" error?** Run: `pip install -r requirements.txt`
- **Chat gives errors?** Check that your API key in `.env` is correct
- **Want to use Ollama instead?** See `README.md`

---

## Files You Need

✅ `.env` — Add your API key here
✅ `start_server.bat` — Double-click to run (Windows)
✅ `README.md` — Full documentation
✅ `GEMINI_SETUP.md` — Detailed Gemini setup

Everything else is already configured!
