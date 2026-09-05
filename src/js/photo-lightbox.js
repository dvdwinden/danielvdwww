// Click a photo on /photos/ to open it full screen, on a backdrop tinted with
// that photo's own colour (computed at build time, see photoTint in
// .eleventy.js). Arrow keys step through the roll; Escape closes, which
// <dialog> handles for us.
(function () {
  const grid = document.querySelector(".photo-grid");
  const dialog = document.getElementById("photo-lightbox");

  // Without <dialog> support, the photos stay as they are: still images with
  // captions, just not enlargeable.
  if (!grid || !dialog || typeof dialog.showModal !== "function") return;

  const imgEl = dialog.querySelector(".lightbox-image");
  const captionEl = dialog.querySelector(".lightbox-caption");
  const triggers = Array.prototype.slice.call(grid.querySelectorAll(".photo-open"));
  if (!triggers.length) return;

  let current = -1;
  // Whether this trip through the lightbox involved the keyboard, which
  // decides if the photo behind it should be left focused on the way out.
  let usedKeyboard = false;

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

  // Wraps, so the roll is a loop in both directions.
  function show(index) {
    const count = triggers.length;
    current = ((index % count) + count) % count;

    const trigger = triggers[current];
    const img = trigger.querySelector("img");
    if (!img) return;

    const tint = trigger.dataset.tint || "rgb(28, 28, 26)";
    dialog.style.setProperty("--photo-tint", tint);
    dialog.style.setProperty("--photo-ink", inkFor(tint));

    imgEl.src = widestSource(img);
    imgEl.alt = img.alt || "";
    captionEl.textContent = trigger.dataset.caption || "";
  }

  grid.addEventListener("click", function (event) {
    const trigger = event.target.closest(".photo-open");
    if (!trigger) return;

    const index = triggers.indexOf(trigger);
    if (index === -1) return;

    // A click opens it; only an arrow key later makes this a keyboard trip.
    usedKeyboard = false;
    show(index);
    dialog.showModal();
  });

  dialog.addEventListener("keydown", function (event) {
    // Leave Escape to the browser, and don't swallow shortcuts.
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;

    let next = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = current + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = current - 1;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = triggers.length - 1;
    }

    if (next === null) return;

    // Stop the arrows scrolling the grid behind the lightbox.
    event.preventDefault();
    usedKeyboard = true;
    show(next);
  });

  dialog.addEventListener("click", function () {
    dialog.close();
  });

  dialog.addEventListener("close", function () {
    // Drop the source so a large image isn't held in memory.
    imgEl.removeAttribute("src");

    const landedOn = triggers[current];
    current = -1;
    if (!landedOn) return;

    if (usedKeyboard) {
      // Keyboard users need focus to follow them to the photo they ended on,
      // and want to see where it went.
      landedOn.focus();
      return;
    }

    // <dialog> hands focus back to the button that opened it, which paints a
    // focus ring over a photo the reader only ever clicked. Drop it once the
    // browser has finished restoring.
    requestAnimationFrame(function () {
      const active = document.activeElement;
      if (active && active.classList && active.classList.contains("photo-open")) {
        active.blur();
      }
    });
  });
})();
