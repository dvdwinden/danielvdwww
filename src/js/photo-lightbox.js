// Click a photo on /photos/ to open it full screen, on a backdrop tinted with
// that photo's own dominant colour (computed at build time, see photoTint in
// .eleventy.js). Closes on click anywhere, on the close button, or on Escape,
// which <dialog> handles for us.
(function () {
  const grid = document.querySelector(".photo-grid");
  const dialog = document.getElementById("photo-lightbox");

  // Without <dialog> support, the photos stay as they are: still images with
  // captions, just not enlargeable.
  if (!grid || !dialog || typeof dialog.showModal !== "function") return;

  const imgEl = dialog.querySelector(".lightbox-image");
  const captionEl = dialog.querySelector(".lightbox-caption");

  // eleventy-img writes srcset ascending, but pick the widest explicitly
  // rather than relying on the order.
  function widestSource(img) {
    const srcset = img.getAttribute("srcset");
    const fallback = img.currentSrc || img.src;
    if (!srcset) return fallback;

    let best = null;
    let bestWidth = -1;
    srcset.split(",").forEach(function (candidate) {
      const parts = candidate.trim().split(/\s+/);
      const width = parseInt(parts[1] || "0", 10);
      if (parts[0] && width > bestWidth) {
        bestWidth = width;
        best = parts[0];
      }
    });
    return best || fallback;
  }

  // The tint can come out light or dark depending on the photo, so pick the
  // caption and close-button colour to sit on top of it.
  function inkFor(tint) {
    const rgb = tint.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!rgb) return "#f5f2ea";
    const luminance =
      (0.299 * Number(rgb[1]) + 0.587 * Number(rgb[2]) + 0.114 * Number(rgb[3])) / 255;
    return luminance > 0.55 ? "#1c1c1a" : "#f5f2ea";
  }

  grid.addEventListener("click", function (event) {
    const trigger = event.target.closest(".photo-open");
    if (!trigger) return;

    const img = trigger.querySelector("img");
    if (!img) return;

    const tint = trigger.dataset.tint || "rgb(28, 28, 26)";
    dialog.style.setProperty("--photo-tint", tint);
    dialog.style.setProperty("--photo-ink", inkFor(tint));

    imgEl.src = widestSource(img);
    imgEl.alt = img.alt || "";
    captionEl.textContent = trigger.dataset.caption || "";

    dialog.showModal();
  });

  dialog.addEventListener("click", function () {
    dialog.close();
  });

  // Drop the source on close so a large image isn't held in memory.
  dialog.addEventListener("close", function () {
    imgEl.removeAttribute("src");
  });
})();
