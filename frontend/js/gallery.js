(function () {
  "use strict";

  const items     = Array.from(document.querySelectorAll(".g-item"));
  const lightbox  = document.getElementById("lightbox");
  const lbImg     = document.getElementById("lb-img");
  const lbCaption = document.getElementById("lb-caption");
  let current = 0;

  const data = items.map((el) => ({
    src:     el.querySelector("img").src,
    alt:     el.querySelector("img").alt,
    caption: el.querySelector(".g-caption")?.textContent?.trim() || "",
  }));

  items.forEach((el) => {
    el.addEventListener("click", () => open(parseInt(el.dataset.index, 10)));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(parseInt(el.dataset.index, 10)); }
    });
  });

  function open(idx) {
    current = idx;
    render();
    lightbox.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    document.getElementById("lb-close").focus();
  }

  function close() {
    lightbox.classList.add("hidden");
    document.body.style.overflow = "";
    items[current]?.focus();
  }

  function render() {
    const d  = data[current] || {};
    lbImg.src          = d.src || "";
    lbImg.alt          = d.alt || "";
    lbCaption.textContent = d.caption || "";
  }

  document.getElementById("lb-close").addEventListener("click", close);
  document.getElementById("lb-overlay").addEventListener("click", close);
  document.getElementById("lb-prev").addEventListener("click", () => { current = (current - 1 + data.length) % data.length; render(); });
  document.getElementById("lb-next").addEventListener("click", () => { current = (current + 1) % data.length; render(); });

  document.addEventListener("keydown", (e) => {
    if (lightbox.classList.contains("hidden")) return;
    if (e.key === "Escape")     close();
    if (e.key === "ArrowLeft")  { current = (current - 1 + data.length) % data.length; render(); }
    if (e.key === "ArrowRight") { current = (current + 1) % data.length; render(); }
  });

})();
