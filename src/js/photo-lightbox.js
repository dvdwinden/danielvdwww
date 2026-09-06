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
  // From the width/height attributes rather than naturalWidth, which is 0
  // until the image loads - and the photos further down the page are lazy, so
  // arrowing to one asks about a picture the browser has never fetched.
  function aspectRatio(img) {
    const w = Number(img.getAttribute("width")) || img.naturalWidth;
    const h = Number(img.getAttribute("height")) || img.naturalHeight;
    return w && h ? w / h : 1;
  }

  function targetWidth(img) {
    const density = Math.min(window.devicePixelRatio || 1, 2);
    const padding = Math.min(window.innerWidth, window.innerHeight) * 0.1;
    const availableWidth = window.innerWidth - padding;
    // Leaves room for the caption under the photo.
    const availableHeight = window.innerHeight - padding - 40;

    return Math.ceil(
      Math.min(availableWidth, availableHeight * aspectRatio(img)) * density
    );
  }

  // The smallest rendition that still covers the space, rather than the widest
  // one there is. Returns null when what the grid already loaded is big enough,
  // which on a phone is usually the case - there is then nothing to fetch.
  function bestSource(img) {
    const list = candidates(img);
    if (!list.length) return img.currentSrc || img.src;

    const target = targetWidth(img);
    for (let i = 0; i < list.length; i++) {
      if (list[i].width >= target) return list[i].url;
    }
    return list[list.length - 1].url;
  }

  // What this photo can put on screen right now, with no network. Photos below
  // the fold are lazy, so most of the roll has never been fetched - and an
  // unloaded <img> still reports a src, which is why this asks whether it
  // actually decoded rather than trusting the attribute.
  function loadedSource(img) {
    return img.complete && img.naturalWidth > 0 ? img.currentSrc || img.src : null;
  }

  const warmed = {};

  function prefetch(url) {
    if (!url || warmed[url]) return;
    warmed[url] = true;
    const image = new Image();
    image.src = url;
  }

  // Arrowing is nearly always onwards, so having the neighbours in cache is
  // what makes the next step feel immediate.
  function warmNeighbours() {
    const count = triggers.length;
    [current + 1, current - 1].forEach(function (index) {
      const trigger = triggers[((index % count) + count) % count];
      const img = trigger && trigger.querySelector("img");
      if (img) prefetch(bestSource(img));
    });
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

    const token = ++loadToken;
    const tint = trigger.dataset.tint || "rgb(28, 28, 26)";
    const caption = trigger.dataset.caption || "";
    const alt = img.alt || "";

    // Photo, caption and backdrop always change together. Setting the tint on
    // its own is what made the colour shift before the picture arrived.
    const paint = function (src) {
      dialog.style.setProperty("--photo-tint", tint);
      dialog.style.setProperty("--photo-ink", inkFor(tint));
      imgEl.src = src;
      imgEl.alt = alt;
      captionEl.textContent = caption;
    };

    const ready = loadedSource(img);
    const wanted = bestSource(img);

    if (ready) {
      // Already decoded downstairs in the grid: on screen this frame.
      paint(ready);
      warmNeighbours();
      if (wanted === ready) return;

      const upgrade = new Image();
      const swap = function () {
        // Don't stomp on a photo that has since been arrowed to, or closed.
        if (token !== loadToken || !dialog.open) return;
        imgEl.src = wanted;
      };
      upgrade.src = wanted;
      if (typeof upgrade.decode === "function") upgrade.decode().then(swap, swap);
      else upgrade.onload = swap;
      return;
    }

    // Nothing to show yet. Hold the photo you are already looking at, tint and
    // all, rather than blanking the frame or recolouring around an empty one.
    const pending = new Image();
    const reveal = function () {
      if (token !== loadToken || !dialog.open) return;
      paint(wanted);
      warmNeighbours();
    };
    pending.src = wanted;
    // decode() so the swap lands on a frame that can paint it, not mid-parse.
    if (typeof pending.decode === "function") pending.decode().then(reveal, reveal);
    else pending.onload = reveal;
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
