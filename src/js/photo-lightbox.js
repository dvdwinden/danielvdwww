// Click a photo on /photos/ to open it full screen, on a backdrop tinted with
// that photo's own colour (computed at build time, see photoTint in
// .eleventy.js). Arrow keys step through the roll; Escape closes, which
// <dialog> handles for us.
// Dimming on hover is pure CSS (see :has() in style.css), not here.

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

  // Guards against a slow load landing after you've arrowed on to another
  // photo, or closed.
  let loadToken = 0;

  // Checked at the moment of the tap rather than cached, so a device that can
  // do both answers to whichever is in use.
  function isTouch() {
    return !!window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  }

  function candidates(img) {
    const srcset = img.getAttribute("srcset");
    if (!srcset) return [];

    return srcset
      .split(",")
      .map(function (candidate) {
        const parts = candidate.trim().split(/\s+/);
        return { url: parts[0], width: parseInt(parts[1] || "0", 10) };
      })
      .filter(function (candidate) {
        return candidate.url && candidate.width;
      })
      .sort(function (a, b) {
        return a.width - b.width;
      });
  }

  // How wide the photo will actually be drawn, in device pixels. The lightbox
  // fits the photo inside the viewport with 5vmin of padding, so a portrait on
  // a wide screen is limited by height, not width - asking for the full
  // viewport width would fetch far more than gets used. Density is capped at
  // 2: a third pixel of detail is not worth another megabyte on a phone.
  function targetWidth(img) {
    const density = Math.min(window.devicePixelRatio || 1, 2);
    const padding = Math.min(window.innerWidth, window.innerHeight) * 0.1;
    const availableWidth = window.innerWidth - padding;
    // Leaves room for the caption under the photo.
    const availableHeight = window.innerHeight - padding - 40;
    const ratio =
      img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;

    return Math.ceil(Math.min(availableWidth, availableHeight * ratio) * density);
  }

  // The smallest rendition that still covers the space, rather than the widest
  // one there is. Returns null when what the grid already loaded is big enough,
  // which on a phone is usually the case - there is then nothing to fetch.
  function upgradeFor(img) {
    const list = candidates(img);
    if (!list.length) return null;

    const showing = img.currentSrc || img.src;
    const target = targetWidth(img);

    let showingWidth = 0;
    let wanted = list[list.length - 1];
    for (let i = 0; i < list.length; i++) {
      if (list[i].url === showing) showingWidth = list[i].width;
    }
    for (let i = 0; i < list.length; i++) {
      if (list[i].width >= target) {
        wanted = list[i];
        break;
      }
    }

    if (showingWidth >= target || wanted.width <= showingWidth) return null;
    return wanted.url;
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

    imgEl.alt = img.alt || "";
    captionEl.textContent = trigger.dataset.caption || "";

    // Show the rendition the grid already has first. It is decoded and in
    // cache, so the photo is on screen the moment you tap, instead of after a
    // download. Then quietly upgrade if a larger one is actually needed.
    const token = ++loadToken;
    imgEl.src = img.currentSrc || img.src;

    const wanted = upgradeFor(img);
    if (!wanted) return;

    const upgrade = new Image();
    const swap = function () {
      // Don't stomp on a photo that has since been arrowed to, or closed.
      if (token !== loadToken || !dialog.open) return;
      imgEl.src = wanted;
    };
    upgrade.src = wanted;
    // decode() so the swap happens on a frame that can paint it, not mid-parse.
    if (typeof upgrade.decode === "function") {
      upgrade.decode().then(swap, swap);
    } else {
      upgrade.onload = swap;
    }
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
    // Take focus onto the dialog itself. Otherwise it lands on the close
    // button, which then lights up the moment any key is pressed - including
    // an arrow key that has nothing to do with closing.
    dialog.focus();
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

  // With a mouse: click beside the photo to step through the roll, click the
  // photo to close. On a touchscreen the photo fills the width - the strips
  // either side are only the padding, far too thin to aim at - so there the
  // photo itself steps forward and the close button is the way out.
  dialog.addEventListener("click", function (event) {
    if (event.target.closest(".lightbox-close")) {
      dialog.close();
      return;
    }

    const zone = event.target.closest(".lightbox-nav");
    if (zone) {
      usedKeyboard = false;
      show(current + (zone.classList.contains("lightbox-prev") ? -1 : 1));
      return;
    }

    if (event.target === imgEl && isTouch()) {
      usedKeyboard = false;
      show(current + 1);
      return;
    }

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
