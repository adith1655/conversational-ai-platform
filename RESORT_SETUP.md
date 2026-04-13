# The Green Hill Resort - AI Booking Assistant

This conversational AI platform has been customized specifically for **The Green Hill Resort** to handle guest inquiries and booking requests.

## Resort Information

- **Name:** The Green Hill Resort
- **Location:** Mangadewadi, Pune, Maharashtra 411046, India
- **Contact:** +91 7057999599

## Features

The AI booking assistant can help with:

✅ **Room Reservations** - Handle booking inquiries and collect guest information
✅ **Resort Information** - Answer questions about amenities, facilities, and services
✅ **Check-in/Check-out** - Provide information about booking dates and availability
✅ **Pricing & Packages** - Discuss room types and pricing options
✅ **Local Attractions** - Help with directions and nearby points of interest
✅ **Context Memory** - Maintains conversation context for natural, multi-turn conversations

## Quick Start

### 1. Ensure .env is configured

Your `.env` file should have:

```env
LLM_PROVIDER=gemini
LLM_API_KEY=your-gemini-api-key-here
LLM_MODEL=gemini-2.5-flash
```

### 2. Install dependencies (if not already done)

```bash
cd conversational-ai-platform
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 3. Start the server

**Option 1: Using main.py**
```bash
python main.py
```

**Option 2: Using uvicorn directly**
```bash
uvicorn src.api.app:app --reload --host 0.0.0.0 --port 8000
```

**Option 3: Using the batch file (Windows)**
```bash
start_server.bat
```

### 4. Access the booking interface

Open your browser and visit:
- **Booking Chat Interface:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/api/v1/health

## Customization Details

### AI System Prompt

The assistant has been configured with resort-specific knowledge in `src/orchestrator/conversation.py`:

- Resort name, location, and contact information
- Booking-focused conversation flow
- Instructions to collect guest details (name, phone, email, dates, number of guests)
- Guidance to direct guests to call for real-time availability and pricing

### Frontend Branding

The chat interface (`frontend/index.html`) has been customized:

- Updated page title and header with resort name
- Changed logo icon to 🏔️ (mountain)
- Added resort contact information in the tagline and footer
- Customized welcome message with resort details
- Changed "Assistant" to "Resort Assistant"

### Configuration

Resort details are centralized in `src/config.py`:
- `resort_name`: The Green Hill Resort
- `resort_location`: Mangadewadi, Pune, Maharashtra 411046
- `resort_contact`: +91 7057999599

## API Usage

### Send a chat message

```bash
POST http://localhost:8000/api/v1/chat
Content-Type: application/json

{
  "message": "I'd like to book a room for this weekend",
  "session_id": "guest-12345"
}
```

### Clear conversation history

```bash
POST http://localhost:8000/api/v1/sessions/guest-12345/clear
```

## Example Conversation Flow

**Guest:** "Hi, I'd like to book a room for this weekend"

**Assistant:** "Hello! Welcome to The Green Hill Resort. I'd be happy to help you with your booking. To get started, could you please provide:
- Check-in date
- Check-out date
- Number of guests
- Any room preferences (e.g., deluxe, standard, suite)"

**Guest:** "Check-in Friday, check-out Sunday, 2 adults"

**Assistant:** "Perfect! I have:
- Check-in: This Friday
- Check-out: Sunday
- 2 adults

To proceed with your booking, I'll need:
- Your full name
- Contact number
- Email address

May I also suggest calling us at +91 7057999599 for real-time availability and the best rates for your dates?"

## Customization Tips

### To modify the AI's behavior:

Edit the `DEFAULT_SYSTEM_PROMPT` in `src/orchestrator/conversation.py`

### To add more resort details:

1. Update the system prompt with specific room types, pricing, amenities
2. Consider adding a knowledge base or FAQ system for common questions
3. Add structured data about room types, packages, and seasonal rates

### To integrate with booking systems:

The platform is designed to be extensible. You can:
- Add API integrations to check real-time availability
- Connect to payment processing systems
- Integrate with hotel management software
- Add email/SMS notifications for bookings

## Support

For technical issues with the AI platform, refer to the main `README.md`.

For resort operations and booking confirmations, contact: **+91 7057999599**

## Future Enhancements

Consider adding:
- [ ] Real-time room availability checking
- [ ] Automated booking confirmation via email/SMS
- [ ] Integration with property management system
- [ ] Multi-language support for international guests
- [ ] Photo gallery of rooms and facilities
- [ ] Seasonal promotions and special offers
- [ ] Guest reviews and testimonials
- [ ] Weather information for Pune
- [ ] Local attractions and event recommendations
