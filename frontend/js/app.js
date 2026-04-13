(function () {
  "use strict";

  /* ═══════════════════════════════════════════════════════════════
     API endpoints (uses CONFIG from config.js)
  ═══════════════════════════════════════════════════════════════ */
  const API = {
    CHAT:         CONFIG.API_BASE + "/api/v1/chat",
    CLEAR:        (sid) => `${CONFIG.API_BASE}/api/v1/sessions/${encodeURIComponent(sid)}/clear`,
    AVAILABILITY: CONFIG.API_BASE + "/api/v1/availability",
    BOOKINGS:     CONFIG.API_BASE + "/api/v1/bookings",
  };

  const SESSION_KEY = "ggh-session";

  /* State */
  let _room     = null;
  let _checkIn  = null;
  let _checkOut = null;
  let _guests   = 2;

  /* ── Session ID ───────────────────────────────────────────────── */
  function sessionId() {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = "web-" + Math.random().toString(36).slice(2, 11) + "-" + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  /* ═══════════════════════════════════════════════════════════════
     Navigation scroll effect
  ═══════════════════════════════════════════════════════════════ */
  const nav = document.getElementById("nav");
  const updateNav = () => nav.classList.toggle("scrolled", window.scrollY > 60);
  window.addEventListener("scroll", updateNav, { passive: true });
  updateNav();

  /* Scroll cue */
  const scrollCue = document.getElementById("scroll-cue");
  if (scrollCue) {
    const goToAmenities = () => {
      document.getElementById("amenities")?.scrollIntoView({ behavior: "smooth" });
    };
    scrollCue.addEventListener("click", goToAmenities);
    scrollCue.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goToAmenities(); }
    });
  }

  /* Deep-link: index.html loaded with #booking in URL */
  if (window.location.hash === "#booking") {
    setTimeout(() => {
      document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  }

  /* ═══════════════════════════════════════════════════════════════
     CHAT
  ═══════════════════════════════════════════════════════════════ */
  const messagesEl = document.getElementById("messages");
  const welcomeEl  = document.getElementById("welcome");
  const chatForm   = document.getElementById("chat-form");
  const chatInput  = document.getElementById("user-input");
  const btnSend    = document.getElementById("btn-send");
  const btnClear   = document.getElementById("btn-clear");
  const chipsEl    = document.getElementById("quick-chips");

  /* Quick chips */
  chipsEl?.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      if (chip.dataset.msg) sendMessage(chip.dataset.msg);
    });
  });

  /* Form submit */
  chatForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (text) sendMessage(text);
  });

  /* Enter key (no Shift) */
  chatInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (text) sendMessage(text);
    }
  });

  /* Auto-grow textarea */
  chatInput?.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 130) + "px";
  });

  /* Clear button */
  btnClear?.addEventListener("click", async () => {
    try { await fetch(API.CLEAR(sessionId()), { method: "POST" }); } catch (_) {}
    removeTyping();
    messagesEl.querySelectorAll(".msg").forEach((n) => n.remove());
    showWelcome();
    chipsEl?.classList.remove("hidden");
    setBusy(false);
    chatInput?.focus();
  });

  async function sendMessage(text) {
    hideWelcome();
    chipsEl?.classList.add("hidden");
    appendUser(text);
    chatInput.value = "";
    chatInput.style.height = "auto";
    setBusy(true);
    addTyping();

    try {
      const res = await fetch(API.CHAT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), session_id: sessionId() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || res.statusText || "Request failed");
      appendBot(data.reply || "");
    } catch (err) {
      appendError("Something went wrong: " + (err.message || String(err)));
    } finally {
      removeTyping();
      setBusy(false);
      chatInput?.focus();
    }
  }

  /* Message helpers */
  function appendUser(text) {
    const clone = document.getElementById("tpl-user").content.cloneNode(true);
    clone.querySelector(".msg-text").textContent = text;
    messagesEl.appendChild(clone);
    scrollBottom();
  }

  function appendBot(text) {
    const clone = document.getElementById("tpl-bot").content.cloneNode(true);
    clone.querySelector(".msg-text").innerHTML = renderMd(text);
    messagesEl.appendChild(clone);
    scrollBottom();
  }

  function appendError(text) {
    const clone = document.getElementById("tpl-error").content.cloneNode(true);
    clone.querySelector(".msg-text").textContent = text;
    messagesEl.appendChild(clone);
    scrollBottom();
  }

  function addTyping() {
    const clone = document.getElementById("tpl-typing").content.cloneNode(true);
    messagesEl.appendChild(clone);
    scrollBottom();
  }

  function removeTyping() {
    document.getElementById("typing-node")?.remove();
  }

  function scrollBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setBusy(busy) {
    btnSend.disabled   = busy;
    chatInput.disabled = busy;
  }

  function hideWelcome() { welcomeEl?.classList.add("hidden"); }
  function showWelcome() { welcomeEl?.classList.remove("hidden"); }

  /* ═══════════════════════════════════════════════════════════════
     BOOKING
  ═══════════════════════════════════════════════════════════════ */
  const ciEl      = document.getElementById("check-in");
  const coEl      = document.getElementById("check-out");
  const guestsEl  = document.getElementById("num-guests");
  const btnAvail  = document.getElementById("btn-check-avail");
  const roomsWrap = document.getElementById("rooms-wrap");
  const formWrap  = document.getElementById("form-wrap");
  const confirmEl = document.getElementById("confirm-panel");
  const nightsLbl = document.getElementById("nights-label");

  const todayStr = new Date().toISOString().split("T")[0];
  ciEl.min = todayStr;
  coEl.min = todayStr;

  ciEl.addEventListener("change", () => {
    if (ciEl.value) {
      const next = new Date(ciEl.value);
      next.setDate(next.getDate() + 1);
      coEl.min = next.toISOString().split("T")[0];
      if (coEl.value && coEl.value <= ciEl.value)
        coEl.value = next.toISOString().split("T")[0];
    }
    updateNights(); resetBooking();
  });

  coEl.addEventListener("change", () => { updateNights(); resetBooking(); });
  guestsEl.addEventListener("change", resetBooking);

  function updateNights() {
    if (ciEl.value && coEl.value && coEl.value > ciEl.value) {
      const n = Math.round((new Date(coEl.value) - new Date(ciEl.value)) / 86400000);
      nightsLbl.textContent = `${n} night${n !== 1 ? "s" : ""} · ${fmtDate(ciEl.value)} → ${fmtDate(coEl.value)}`;
      nightsLbl.style.color = "var(--g-500)";
    } else {
      nightsLbl.textContent = "";
    }
  }

  function resetBooking() {
    roomsWrap.innerHTML = "";
    roomsWrap.classList.add("hidden");
    formWrap.classList.add("hidden");
    confirmEl.classList.add("hidden");
    _room = null;
  }

  /* Check availability */
  btnAvail.addEventListener("click", async () => {
    const ci = ciEl.value, co = coEl.value;
    _guests = parseInt(guestsEl.value, 10);

    if (!ci || !co) return showNightsErr("Please select both check-in and check-out dates.");
    if (co <= ci)  return showNightsErr("Check-out must be after check-in.");

    _checkIn = ci; _checkOut = co;
    nightsLbl.style.color = "var(--g-500)";

    btnAvail.disabled    = true;
    btnAvail.textContent = "Checking…";

    try {
      const res  = await fetch(`${API.AVAILABILITY}?check_in=${ci}&check_out=${co}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Failed to fetch availability");
      renderRooms(data.availability, data.nights);
    } catch (e) {
      showNightsErr("Could not load availability: " + e.message);
    } finally {
      btnAvail.disabled    = false;
      btnAvail.textContent = "Check Availability";
    }
  });

  function showNightsErr(msg) {
    nightsLbl.textContent  = msg;
    nightsLbl.style.color  = "var(--error)";
  }

  /* Render room cards */
  function renderRooms(avail, nights) {
    roomsWrap.innerHTML = "";
    const order = ["Standard Room", "Deluxe Room", "Family Suite", "Honeymoon Suite"];

    order.forEach((rt) => {
      const info = avail[rt];
      if (!info) return;

      const locked = info.locked;
      const low    = !locked && info.available === 1;
      const total  = nights * info.price;

      let badgeClass, badgeText;
      if (locked)   { badgeClass = "badge-full"; badgeText = "🔒 Fully Booked"; }
      else if (low) { badgeClass = "badge-low";  badgeText = "⚡ Last room"; }
      else          { badgeClass = "badge-ok";   badgeText = `✓ ${info.available} available`; }

      let availClass, availText;
      if (locked)   { availClass = "avail-none"; availText = "No rooms available"; }
      else if (low) { availClass = "avail-low";  availText = `Only 1 of ${info.total} remaining`; }
      else          { availClass = "avail-ok";   availText = `${info.available} of ${info.total} available`; }

      const card = document.createElement("div");
      card.className = "room-card" + (locked ? " room-locked" : "");
      card.innerHTML = `
        <div class="room-card-top">
          <span class="room-icon">${info.icon}</span>
          <span class="room-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div>
          <p class="room-name">${rt}</p>
          <p class="room-desc">${info.description}</p>
        </div>
        <div>
          <p class="room-price">₹${info.price.toLocaleString("en-IN")}<span>/night</span></p>
          ${nights > 1 ? `<p style="font-size:.8rem;color:var(--text-4);margin-top:3px;">Est. total: ₹${total.toLocaleString("en-IN")} for ${nights} nights</p>` : ""}
        </div>
        <p class="room-avail ${availClass}">${availText}</p>
        <div class="room-footer">
          ${locked
            ? `<button class="btn-select btn-select-locked" disabled>Not Available</button>
               <div class="locked-stamp">Fully Booked</div>`
            : `<button class="btn-select btn-select-avail" data-room="${rt}">Select Room →</button>`}
        </div>
      `;

      if (!locked) {
        card.querySelector(".btn-select").addEventListener("click", () =>
          pickRoom(rt, info.price, nights)
        );
      }

      roomsWrap.appendChild(card);
    });

    roomsWrap.classList.remove("hidden");
    roomsWrap.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* Pick a room → show form */
  function pickRoom(rt, price, nights) {
    _room = rt;

    document.getElementById("bf-room-name").textContent = rt;
    document.getElementById("bf-room-sub").textContent =
      `${fmtDate(_checkIn)} → ${fmtDate(_checkOut)} · ${nights} night${nights !== 1 ? "s" : ""} · ${_guests} guest${_guests !== 1 ? "s" : ""}`;

    const total = nights * price;
    document.getElementById("summary-box").innerHTML = `
      <div class="summary-row"><span>Room</span><span><strong>${rt}</strong></span></div>
      <div class="summary-row"><span>Check-in</span><span>${fmtDate(_checkIn)}</span></div>
      <div class="summary-row"><span>Check-out</span><span>${fmtDate(_checkOut)}</span></div>
      <div class="summary-row"><span>Nights</span><span>${nights}</span></div>
      <div class="summary-row"><span>Guests</span><span>${_guests}</span></div>
      <div class="summary-row"><span>Rate</span><span>₹${price.toLocaleString("en-IN")}/night</span></div>
      <div class="summary-row summary-total"><span>Estimated Total</span><span>₹${total.toLocaleString("en-IN")}</span></div>
    `;

    document.getElementById("booking-form").reset();
    document.getElementById("form-err").classList.add("hidden");
    formWrap.classList.remove("hidden");
    formWrap.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.getElementById("btn-change").addEventListener("click", () => {
    formWrap.classList.add("hidden");
    _room = null;
    roomsWrap.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* Submit booking */
  const bookingForm = document.getElementById("booking-form");
  const formErr     = document.getElementById("form-err");
  const btnSubmit   = document.getElementById("btn-submit");

  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    formErr.classList.add("hidden");

    const name     = document.getElementById("bf-name").value.trim();
    const phone    = document.getElementById("bf-phone").value.trim();
    const email    = document.getElementById("bf-email").value.trim();
    const requests = document.getElementById("bf-requests").value.trim();

    if (!name)                      return showErr("Please enter your full name.");
    if (!phone || phone.length < 7) return showErr("Please enter a valid phone number.");
    if (!_room || !_checkIn || !_checkOut) return showErr("Please select a room and dates.");

    btnSubmit.disabled    = true;
    btnSubmit.textContent = "Confirming…";

    try {
      const res = await fetch(API.BOOKINGS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_name: name, phone, email,
          room_type: _room, check_in: _checkIn, check_out: _checkOut,
          guests: _guests, special_requests: requests,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Booking failed. Please try again.");
      showConfirm(data);
    } catch (err) {
      showErr(err.message);
    } finally {
      btnSubmit.disabled    = false;
      btnSubmit.textContent = "Confirm Booking";
    }
  });

  function showErr(msg) {
    formErr.textContent = msg;
    formErr.classList.remove("hidden");
  }

  function showConfirm(b) {
    formWrap.classList.add("hidden");
    const nights = Math.round((new Date(b.check_out) - new Date(b.check_in)) / 86400000);

    confirmEl.innerHTML = `
      <span class="c-icon">🎉</span>
      <h3 class="c-title">Booking Confirmed!</h3>
      <div class="c-id">${b.booking_id}</div>
      <p class="c-msg">${b.message}</p>
      <div class="confirm-grid">
        <div><strong>Guest:</strong> ${b.guest_name}</div>
        <div><strong>Room:</strong> ${b.room_type}</div>
        <div><strong>Check-in:</strong> ${fmtDate(b.check_in)}</div>
        <div><strong>Check-out:</strong> ${fmtDate(b.check_out)}</div>
        <div><strong>Nights:</strong> ${nights}</div>
        <div><strong>Status:</strong> <span style="color:var(--success);font-weight:700">Confirmed ✓</span></div>
      </div>
      <div style="display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap;">
        <button class="btn btn-ghost" id="btn-new">Make another booking</button>
        <button class="btn btn-primary" id="btn-chat">Chat with assistant</button>
      </div>
    `;
    confirmEl.classList.remove("hidden");
    confirmEl.scrollIntoView({ behavior: "smooth", block: "start" });

    document.getElementById("btn-new").addEventListener("click", () => {
      confirmEl.classList.add("hidden");
      roomsWrap.innerHTML = "";
      roomsWrap.classList.add("hidden");
      nightsLbl.textContent = "";
      ciEl.value = ""; coEl.value = ""; guestsEl.value = "2";
      document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
    });

    document.getElementById("btn-chat").addEventListener("click", () => {
      document.getElementById("home").scrollIntoView({ behavior: "smooth" });
      setTimeout(() => chatInput?.focus(), 600);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     Utility helpers
  ═══════════════════════════════════════════════════════════════ */
  function fmtDate(iso) {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  }

  function renderMd(text) {
    /* Minimal markdown: escape HTML, bold, italic, bullet lists */
    let s = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\*([^*\n]+?)\*/g, "<em>$1</em>");

    const lines  = s.split("\n");
    let inList   = false;
    const output = [];

    lines.forEach((line) => {
      const bullet = line.match(/^[\s]*[-•*]\s+(.+)/);
      if (bullet) {
        if (!inList) { output.push("<ul>"); inList = true; }
        output.push(`<li>${bullet[1]}</li>`);
      } else {
        if (inList) { output.push("</ul>"); inList = false; }
        output.push(line.trim() === "" ? "<br>" : `<p>${line}</p>`);
      }
    });
    if (inList) output.push("</ul>");
    return output.join("");
  }

})();
