(function () {
  "use strict";

  /* ═══════════════════════════════════════════════════════════════
     Gallery Lightbox
  ═══════════════════════════════════════════════════════════════ */
  const galleryItems = Array.from(document.querySelectorAll(".gf-item"));
  const lightbox     = document.getElementById("lightbox");
  const lbImg        = document.getElementById("lb-img");
  const lbCaption    = document.getElementById("lb-caption");
  let lbIndex = 0;

  const galleryData = galleryItems.map((item) => ({
    src:     item.querySelector("img").src,
    alt:     item.querySelector("img").alt,
    caption: item.querySelector(".gf-caption")?.textContent?.trim() || "",
  }));

  // Make each item keyboard-accessible
  galleryItems.forEach((item) => {
    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");
    item.setAttribute("aria-label", "View " + (item.querySelector(".gf-caption")?.textContent?.trim() || "photo"));

    item.addEventListener("click", () => openLightbox(parseInt(item.dataset.index, 10)));
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(parseInt(item.dataset.index, 10));
      }
    });
  });

  function openLightbox(index) {
    lbIndex = index;
    updateLightbox();
    lightbox.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    document.getElementById("lb-close").focus();
  }

  function closeLightbox() {
    lightbox.classList.add("hidden");
    document.body.style.overflow = "";
    // Return focus to the item that opened the lightbox
    const opener = galleryItems[lbIndex];
    if (opener) opener.focus();
  }

  function updateLightbox() {
    const d = galleryData[lbIndex];
    if (!d) return;
    lbImg.src          = d.src;
    lbImg.alt          = d.alt;
    lbCaption.textContent = d.caption;
  }

  function prevPhoto() {
    lbIndex = (lbIndex - 1 + galleryData.length) % galleryData.length;
    updateLightbox();
  }

  function nextPhoto() {
    lbIndex = (lbIndex + 1) % galleryData.length;
    updateLightbox();
  }

  document.getElementById("lb-close").addEventListener("click", closeLightbox);
  document.getElementById("lightbox-overlay").addEventListener("click", closeLightbox);
  document.getElementById("lb-prev").addEventListener("click", prevPhoto);
  document.getElementById("lb-next").addEventListener("click", nextPhoto);

  document.addEventListener("keydown", (e) => {
    if (lightbox.classList.contains("hidden")) return;
    if (e.key === "Escape")      closeLightbox();
    if (e.key === "ArrowLeft")   prevPhoto();
    if (e.key === "ArrowRight")  nextPhoto();
  });

})();
