(function () {
  "use strict";

  /* ═══════════════════════════════════════════════════════════════
     Constants & state
  ═══════════════════════════════════════════════════════════════ */
  const API = {
    CHAT:         "/api/v1/chat",
    CLEAR:        (sid) => `/api/v1/sessions/${encodeURIComponent(sid)}/clear`,
    AVAILABILITY: "/api/v1/availability",
    BOOKINGS:     "/api/v1/bookings",
  };

  const SESSION_KEY = "ggh-session-id";

  let _selectedRoom = null;
  let _checkIn      = null;
  let _checkOut     = null;
  let _guests       = 2;

  /* ═══════════════════════════════════════════════════════════════
     Session
  ═══════════════════════════════════════════════════════════════ */
  function getSessionId() {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = "web-" + Math.random().toString(36).slice(2, 11) + "-" + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  /* ═══════════════════════════════════════════════════════════════
     Tab navigation
  ═══════════════════════════════════════════════════════════════ */
  const navTabs   = document.querySelectorAll(".nav-tab");
  const tabPanels = document.querySelectorAll(".tab-panel");

  navTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  function switchTab(tabName) {
    navTabs.forEach((t) => {
      t.classList.toggle("active", t.dataset.tab === tabName);
      t.setAttribute("aria-selected", t.dataset.tab === tabName ? "true" : "false");
    });
    tabPanels.forEach((p) => {
      p.classList.toggle("hidden", p.id !== "tab-" + tabName);
    });
    if (tabName === "chat") {
      setTimeout(() => {
        const input = document.getElementById("user-input");
        if (input) input.focus();
      }, 60);
    }
    // Scroll to top of content on tab switch
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Support ?tab=booking deep-link from gallery.html
  (function handleDeepLink() {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "booking") {
      switchTab("booking");
    }
  })();

  /* ═══════════════════════════════════════════════════════════════
     Booking — date picker
  ═══════════════════════════════════════════════════════════════ */
  const ciInput       = document.getElementById("check-in");
  const coInput       = document.getElementById("check-out");
  const guestsInput   = document.getElementById("num-guests");
  const btnCheckAvail = document.getElementById("btn-check-avail");
  const availResults  = document.getElementById("avail-results");
  const nightsSummary = document.getElementById("nights-summary");

  const todayISO = new Date().toISOString().split("T")[0];
  ciInput.min = todayISO;
  coInput.min = todayISO;

  ciInput.addEventListener("change", () => {
    if (ciInput.value) {
      const nextDay = new Date(ciInput.value);
      nextDay.setDate(nextDay.getDate() + 1);
      coInput.min = nextDay.toISOString().split("T")[0];
      if (coInput.value && coInput.value <= ciInput.value) {
        coInput.value = nextDay.toISOString().split("T")[0];
      }
    }
    updateNightsSummary();
    resetAvailability();
  });

  coInput.addEventListener("change", () => {
    updateNightsSummary();
    resetAvailability();
  });

  guestsInput.addEventListener("change", resetAvailability);

  function updateNightsSummary() {
    if (ciInput.value && coInput.value && coInput.value > ciInput.value) {
      const nights = Math.round(
        (new Date(coInput.value) - new Date(ciInput.value)) / 86400000
      );
      nightsSummary.textContent =
        `${nights} night${nights !== 1 ? "s" : ""} · ${formatDate(ciInput.value)} → ${formatDate(coInput.value)}`;
      nightsSummary.style.color = "var(--teal)";
    } else {
      nightsSummary.textContent = "";
    }
  }

  function resetAvailability() {
    availResults.innerHTML = "";
    availResults.classList.add("hidden");
    hideBookingForm();
    hideConfirmation();
  }

  btnCheckAvail.addEventListener("click", async () => {
    const ci = ciInput.value;
    const co = coInput.value;
    _guests = parseInt(guestsInput.value, 10);

    if (!ci || !co) {
      nightsSummary.textContent = "Please select both check-in and check-out dates.";
      nightsSummary.style.color = "var(--error)";
      return;
    }
    if (co <= ci) {
      nightsSummary.textContent = "Check-out must be after check-in.";
      nightsSummary.style.color = "var(--error)";
      return;
    }

    nightsSummary.style.color = "var(--teal)";
    _checkIn  = ci;
    _checkOut = co;

    btnCheckAvail.disabled    = true;
    btnCheckAvail.textContent = "Checking…";

    try {
      const res = await fetch(`${API.AVAILABILITY}?check_in=${ci}&check_out=${co}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to fetch availability");
      }
      const data = await res.json();
      renderRoomCards(data.availability, data.nights);
    } catch (e) {
      nightsSummary.textContent = "Could not load availability: " + e.message;
      nightsSummary.style.color = "var(--error)";
    } finally {
      btnCheckAvail.disabled    = false;
      btnCheckAvail.textContent = "Check Availability";
    }
  });

  /* ── Render room cards ─────────────────────────────────────── */
  function renderRoomCards(availability, nights) {
    availResults.innerHTML = "";

    const roomOrder = ["Standard Room", "Deluxe Room", "Family Suite", "Honeymoon Suite"];

    roomOrder.forEach((roomType) => {
      const info = availability[roomType];
      if (!info) return;

      const locked = info.locked;
      const low    = !locked && info.available === 1;
      const total  = nights * info.price;

      let badgeClass, badgeText;
      if (locked) {
        badgeClass = "badge-locked";
        badgeText  = "🔒 Fully Booked";
      } else if (low) {
        badgeClass = "badge-low";
        badgeText  = "⚡ Last room";
      } else {
        badgeClass = "badge-available";
        badgeText  = `✓ ${info.available} available`;
      }

      let availClass, availText;
      if (locked) {
        availClass = "avail-none";
        availText  = "No rooms available for these dates";
      } else if (low) {
        availClass = "avail-low";
        availText  = `Only 1 of ${info.total} rooms remaining`;
      } else {
        availClass = "avail-ok";
        availText  = `${info.available} of ${info.total} rooms available`;
      }

      const card = document.createElement("div");
      card.className = "room-card" + (locked ? " room-locked" : "");
      card.innerHTML = `
        <div class="room-card-header">
          <span class="room-icon">${info.icon}</span>
          <span class="room-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div>
          <p class="room-name">${roomType}</p>
          <p class="room-desc">${info.description}</p>
        </div>
        <div>
          <p class="room-price">₹${info.price.toLocaleString("en-IN")}<span>/night</span></p>
          ${nights > 1
            ? `<p style="font-size:0.8rem;color:var(--text-muted);margin-top:3px;">
                Est. total: ₹${total.toLocaleString("en-IN")} for ${nights} nights
               </p>`
            : ""}
        </div>
        <p class="room-avail-text ${availClass}">${availText}</p>
        <div class="room-card-footer">
          ${locked
            ? `<button class="btn-select-room btn-select-locked" disabled>Not Available</button>
               <div class="locked-overlay"><div class="locked-stamp">Fully Booked</div></div>`
            : `<button class="btn-select-room btn-select-avail" data-room="${roomType}">Select Room →</button>`
          }
        </div>
      `;

      if (!locked) {
        card.querySelector(".btn-select-room").addEventListener("click", () =>
          selectRoom(roomType, info.price, nights)
        );
      }

      availResults.appendChild(card);
    });

    availResults.classList.remove("hidden");
    availResults.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ── Select room ───────────────────────────────────────────── */
  function selectRoom(roomType, pricePerNight, nights) {
    _selectedRoom = roomType;
    const totalPrice = nights * pricePerNight;

    document.getElementById("bf-room-title").textContent = roomType;
    document.getElementById("bf-room-sub").textContent =
      `${formatDate(_checkIn)} → ${formatDate(_checkOut)}  ·  ${nights} night${nights !== 1 ? "s" : ""}  ·  ${_guests} guest${_guests !== 1 ? "s" : ""}`;

    const summaryBox = document.getElementById("booking-summary-box");
    summaryBox.innerHTML = `
      <div class="summary-row"><span>Room</span><span><strong>${roomType}</strong></span></div>
      <div class="summary-row"><span>Check-in</span><span>${formatDate(_checkIn)}</span></div>
      <div class="summary-row"><span>Check-out</span><span>${formatDate(_checkOut)}</span></div>
      <div class="summary-row"><span>Nights</span><span>${nights}</span></div>
      <div class="summary-row"><span>Guests</span><span>${_guests}</span></div>
      <div class="summary-row"><span>Rate</span><span>₹${pricePerNight.toLocaleString("en-IN")}/night</span></div>
      <div class="summary-row summary-total"><span>Estimated Total</span><span>₹${totalPrice.toLocaleString("en-IN")}</span></div>
    `;

    const wrap = document.getElementById("booking-form-wrap");
    wrap.classList.remove("hidden");
    wrap.scrollIntoView({ behavior: "smooth", block: "start" });

    document.getElementById("booking-form").reset();
    document.getElementById("form-error").classList.add("hidden");
  }

  document.getElementById("btn-change-room").addEventListener("click", () => {
    hideBookingForm();
    availResults.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  function hideBookingForm() {
    document.getElementById("booking-form-wrap").classList.add("hidden");
    _selectedRoom = null;
  }

  function hideConfirmation() {
    document.getElementById("booking-confirm-panel").classList.add("hidden");
  }

  /* ── Submit booking ────────────────────────────────────────── */
  const bookingForm = document.getElementById("booking-form");
  const formError   = document.getElementById("form-error");
  const btnSubmit   = document.getElementById("btn-submit-booking");

  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    formError.classList.add("hidden");

    const name     = document.getElementById("bf-name").value.trim();
    const phone    = document.getElementById("bf-phone").value.trim();
    const email    = document.getElementById("bf-email").value.trim();
    const requests = document.getElementById("bf-requests").value.trim();

    if (!name)                        return showFormError("Please enter your full name.");
    if (!phone || phone.length < 7)   return showFormError("Please enter a valid phone number.");
    if (!_selectedRoom || !_checkIn || !_checkOut)
      return showFormError("Please select a room and dates.");

    btnSubmit.disabled    = true;
    btnSubmit.textContent = "Confirming…";

    try {
      const res = await fetch(API.BOOKINGS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_name:       name,
          phone,
          email,
          room_type:        _selectedRoom,
          check_in:         _checkIn,
          check_out:        _checkOut,
          guests:           _guests,
          special_requests: requests,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Booking failed. Please try again.");

      showConfirmation(data);
    } catch (err) {
      showFormError(err.message);
    } finally {
      btnSubmit.disabled    = false;
      btnSubmit.textContent = "Confirm Booking";
    }
  });

  function showFormError(msg) {
    formError.textContent = msg;
    formError.classList.remove("hidden");
  }

  function showConfirmation(booking) {
    hideBookingForm();

    const panel = document.getElementById("booking-confirm-panel");
    panel.innerHTML = `
      <div class="confirm-icon">🎉</div>
      <h3 class="confirm-title">Booking Confirmed!</h3>
      <div class="confirm-id">${booking.booking_id}</div>
      <p class="confirm-message">${booking.message}</p>
      <div class="confirm-details">
        <div><strong>Guest:</strong> ${booking.guest_name}</div>
        <div><strong>Room:</strong> ${booking.room_type}</div>
        <div><strong>Check-in:</strong> ${formatDate(booking.check_in)}</div>
        <div><strong>Check-out:</strong> ${formatDate(booking.check_out)}</div>
        <div><strong>Guests:</strong> ${booking.guests}</div>
        <div><strong>Status:</strong> <span style="color:var(--success);font-weight:700">Confirmed ✓</span></div>
      </div>
      <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;margin-top:0.5rem;">
        <button class="btn btn-ghost" id="btn-new-booking">Make another booking</button>
        <button class="btn btn-primary" id="btn-go-chat">Chat with assistant</button>
      </div>
    `;

    panel.classList.remove("hidden");
    panel.scrollIntoView({ behavior: "smooth", block: "start" });

    document.getElementById("btn-new-booking").addEventListener("click", () => {
      panel.classList.add("hidden");
      availResults.innerHTML = "";
      availResults.classList.add("hidden");
      nightsSummary.textContent = "";
      ciInput.value    = "";
      coInput.value    = "";
      guestsInput.value = "2";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.getElementById("btn-go-chat").addEventListener("click", () => {
      switchTab("chat");
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     Chat
  ═══════════════════════════════════════════════════════════════ */
  const messagesEl   = document.getElementById("messages");
  const welcomeEl    = document.getElementById("welcome");
  const chatForm     = document.getElementById("chat-form");
  const chatInput    = document.getElementById("user-input");
  const btnSend      = document.getElementById("btn-send");
  const btnClear     = document.getElementById("btn-clear");
  const quickChipsEl = document.getElementById("quick-chips");

  // Quick chips
  quickChipsEl.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const msg = chip.dataset.msg;
      if (msg) sendMessage(msg);
    });
  });

  function hideWelcome() { welcomeEl.classList.add("hidden"); }
  function showWelcome() { welcomeEl.classList.remove("hidden"); }

  function appendUserMessage(text) {
    const tmpl  = document.getElementById("message-user");
    const clone = tmpl.content.cloneNode(true);
    clone.querySelector(".message-text").textContent = text;
    messagesEl.appendChild(clone);
    scrollToBottom();
  }

  function appendBotMessage(text) {
    const tmpl  = document.getElementById("message-bot");
    const clone = tmpl.content.cloneNode(true);
    const textEl = clone.querySelector(".message-text");
    textEl.innerHTML = renderMarkdown(text);
    messagesEl.appendChild(clone);
    scrollToBottom();
  }

  function appendErrorMessage(text) {
    const tmpl  = document.getElementById("message-error");
    const clone = tmpl.content.cloneNode(true);
    clone.querySelector(".message-text").textContent = text;
    messagesEl.appendChild(clone);
    scrollToBottom();
  }

  function showTyping() {
    const tmpl  = document.getElementById("typing-indicator");
    const clone = tmpl.content.cloneNode(true);
    messagesEl.appendChild(clone);
    scrollToBottom();
  }

  function hideTyping() {
    const node = document.getElementById("typing-node");
    if (node) node.remove();
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setBusy(busy) {
    btnSend.disabled  = busy;
    chatInput.disabled = busy;
  }

  async function sendMessage(text) {
    const sessionId = getSessionId();
    hideWelcome();
    quickChipsEl.classList.add("hidden");
    appendUserMessage(text);
    chatInput.value = "";
    chatInput.style.height = "auto";
    setBusy(true);
    showTyping();

    try {
      const res = await fetch(API.CHAT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), session_id: sessionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || res.statusText || "Request failed");
      appendBotMessage(data.reply || "");
    } catch (err) {
      appendErrorMessage("Something went wrong: " + (err.message || String(err)));
    } finally {
      hideTyping();
      setBusy(false);
      chatInput.focus();
    }
  }

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (text) sendMessage(text);
  });

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (text) sendMessage(text);
    }
  });

  chatInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 140) + "px";
  });

  btnClear.addEventListener("click", async () => {
    const sessionId = getSessionId();
    try { await fetch(API.CLEAR(sessionId), { method: "POST" }); } catch (_) {}
    hideTyping();
    messagesEl.querySelectorAll(".message").forEach((n) => n.remove());
    showWelcome();
    quickChipsEl.classList.remove("hidden");
    setBusy(false);
    chatInput.focus();
  });

  /* ═══════════════════════════════════════════════════════════════
     Helpers
  ═══════════════════════════════════════════════════════════════ */
  function formatDate(iso) {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  function renderMarkdown(text) {
    // Escape HTML to prevent XSS
    let safe = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    safe = safe.replace(/\*([^*\n]+?)\*/g, "<em>$1</em>");

    const lines = safe.split("\n");
    let inList = false;
    const output = [];

    lines.forEach((line) => {
      const bullet = line.match(/^[\s]*[-•*]\s+(.+)/);
      if (bullet) {
        if (!inList) { output.push("<ul>"); inList = true; }
        output.push(`<li>${bullet[1]}</li>`);
      } else {
        if (inList) { output.push("</ul>"); inList = false; }
        if (line.trim() === "") {
          output.push("<br>");
        } else {
          output.push(`<p>${line}</p>`);
        }
      }
    });

    if (inList) output.push("</ul>");
    return output.join("");
  }

})();
