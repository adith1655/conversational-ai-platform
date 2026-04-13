# 🏔️ The Green Hill Resort - Quick Start Guide

## What is This?

This is an AI-powered booking assistant specifically configured for **The Green Hill Resort**. It can chat with potential guests, answer their questions, and help them book rooms 24/7.

## Resort Details

- **Name:** The Green Hill Resort
- **Location:** Mangadewadi, Pune, Maharashtra 411046
- **Phone:** +91 7057999599

## How to Start the Booking Assistant

### Step 1: Make sure your API key is set

Check that `d:\Dekstop\VS\conversational-ai-platform\.env` contains your Gemini API key:

```env
LLM_PROVIDER=gemini
LLM_API_KEY=AIzaSyDRG65DCpjyH0fJW0btfYP29ARFKaoWsD0
LLM_MODEL=gemini-2.5-flash
```

### Step 2: Start the server

**Easiest way - Double click:**
- `start_server.bat` (if it exists)

**Or from command line:**

```powershell
cd "d:\Dekstop\VS\conversational-ai-platform"
python main.py
```

### Step 3: Open in browser

Go to: **http://localhost:8000**

You'll see the booking chat interface with The Green Hill Resort branding!

## What Can Guests Ask?

The AI assistant can help with:

- ✅ "Do you have rooms available this weekend?"
- ✅ "What amenities do you offer?"
- ✅ "How much does a room cost?"
- ✅ "I'd like to book a room for 2 people"
- ✅ "What's nearby to visit in Pune?"
- ✅ "How do I get to your resort?"

## How It Works

1. **Guest types a message** asking about the resort
2. **AI responds** with helpful information about rooms, amenities, pricing
3. **Conversation continues** - the AI remembers what was discussed
4. **Booking details collected** - when ready, the AI asks for guest name, phone, dates
5. **Final step** - AI provides your phone number (+91 7057999599) for confirmation

## What the AI Knows

The assistant has been programmed with:
- Resort name, location, and contact details
- How to handle booking inquiries
- What questions to ask guests (dates, number of people, preferences)
- When to suggest calling for real-time availability

## Customization Options

### To add more information (room types, pricing, amenities):

Edit: `d:\Dekstop\VS\conversational-ai-platform\src\orchestrator\conversation.py`

Find the `DEFAULT_SYSTEM_PROMPT` section and add details like:

```python
"Room Types:\n"
"- Deluxe Room: ₹3,000/night - King bed, mountain view, AC\n"
"- Standard Room: ₹2,000/night - Queen bed, garden view, AC\n"
"- Suite: ₹5,000/night - 2 rooms, living area, balcony\n\n"
"Amenities:\n"
"- Swimming pool, Restaurant, Free WiFi, Parking, Room service\n\n"
```

### To change the look:

Edit: `d:\Dekstop\VS\conversational-ai-platform\frontend\index.html`

### To modify colors and styling:

Edit: `d:\Dekstop\VS\conversational-ai-platform\frontend\styles.css`

## Troubleshooting

### Server won't start?
- Make sure Python is installed: `python --version`
- Install dependencies: `pip install -r requirements.txt`
- Check if port 8000 is already in use

### AI not responding?
- Verify your Gemini API key is correct in `.env`
- Check your internet connection (needed for Gemini API)
- Look at the terminal for error messages

### Want to reset a conversation?
- Click "Clear chat" button in the interface
- Or close and reopen your browser tab

## Testing the Assistant

Try these test conversations:

**Test 1 - Basic Inquiry:**
```
Guest: Hi, what kind of rooms do you have?
Expected: AI introduces the resort and asks about their needs
```

**Test 2 - Booking Flow:**
```
Guest: I want to book a room for this weekend
Expected: AI asks for check-in/out dates, number of guests
Guest: Friday to Sunday, 2 people
Expected: AI collects name, phone, email
```

**Test 3 - Information:**
```
Guest: How do I reach your resort from Pune airport?
Expected: AI provides directions or suggests calling
```

## Need Help?

For technical issues: Check `README.md` and `RESORT_SETUP.md`
For booking operations: Call +91 7057999599

---

**Ready to launch?** Just run `python main.py` and visit http://localhost:8000! 🏔️
