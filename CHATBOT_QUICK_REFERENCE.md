# 🎯 Quick Reference: Focused Chatbot Behavior

## One-Page Guide for Staff

---

## ✅ Chatbot WILL Answer:

| Category | Examples |
|----------|----------|
| **Bookings** | "I want to book a room", "Check availability", "Room prices" |
| **Amenities** | "Do you have WiFi?", "Swimming pool timings?", "Restaurant menu?" |
| **Location** | "Where are you located?", "Distance from airport?", "Nearby places?" |
| **Policies** | "Cancellation policy?", "Check-in time?", "Pet-friendly?" |
| **Pricing** | "Room rates?", "Extra charges?", "Group discounts?" |
| **Events** | "Conference hall?", "Wedding venue?", "Honeymoon package?" |

---

## ❌ Chatbot WON'T Answer:

| Category | Examples | Response Type |
|----------|----------|---------------|
| **General Knowledge** | "What is AI?", "Capital of France?" | Polite decline |
| **Other Hotels** | "Is Taj better?", "Other options?" | Focus on own resort |
| **Personal Advice** | "Career advice?", "Health tips?" | Out of scope |
| **Entertainment** | "Tell a joke", "Sing a song" | Redirect to resort |
| **Unrelated Travel** | "Mumbai to Delhi?", "Visa info?" | Resort-specific only |

---

## 🎯 How It Responds to Off-Topic

### Template:
1. **Acknowledge**: "I appreciate your question..."
2. **Clarify**: "...but I'm designed for resort bookings..."
3. **Redirect**: "I can help with rooms, amenities..."
4. **Ask**: "How may I assist with your stay?"

### Example:
**User:** "What's the weather?"
**Bot:** "I don't have real-time weather info, but Pune has pleasant weather! Our resort has indoor and outdoor facilities for any weather. Would you like to book a room?"

---

## 💡 Key Principles (iPAL-Inspired)

1. **Stay Focused** - Resort only, always
2. **Be Polite** - Never rude, always professional
3. **Redirect** - Guide back to resort topics
4. **Add Value** - Mention amenities in every response
5. **No Competitors** - Never discuss other properties

---

## 🚀 Quick Test

**Test 1:** Ask "What is 2+2?"
**Should:** Decline politely + redirect

**Test 2:** Ask "Do you have rooms?"
**Should:** Provide detailed info + pricing

**Test 3:** Ask "Tell me about other hotels"
**Should:** Focus on own strengths only

---

## 📞 Escalation

For complex queries the bot declines:
- **Phone:** +91 7057999599
- **Email:** info@greenhillresort.com

---

## ✨ Success = Focused + Professional + Helpful

**Access:** http://localhost:8000
**Model:** ICICI iPAL-inspired domain-specific assistant
**Purpose:** Convert inquiries → Bookings ✅

---

**Remember:** Like a resort concierge who's excellent at their job - helpful within resort matters, professional with everything else!
