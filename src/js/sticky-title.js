// When the page's own heading scrolls off the top, a small copy of it rises
// into the header line beside "Daniël van der Winden", over a scrim that keeps
// the text under it legible.
//
// The copy lives inside the <header> itself, absolutely positioned within it,
// so its vertical place comes from the header's own layout rather than from a
// measurement. Only the horizontal edges are measured: the heading sits in a
// column that is right-aligned inside a max-width container, so its left edge
// moves with the viewport and has to be re-read whenever the layout changes.
//
// Desktop only: on a phone the header, the title and the toggle cannot share a
// line, and the heading is only a short scroll away. The breakpoint is watched
// rather than read once, because an iPad crosses it on every rotation.
(function () {
  const wide = window.matchMedia("(min-width: 1024px)");

  // The in-content heading, not the name in the header.
  const heading = document.querySelector("#main-content h1");
  const header = document.querySelector("header");
  // Match the header's name rather than restating its type here, so the two
  // sit on one baseline and stay matched if the header ever changes.
  const name = header && header.querySelector("a");
  if (!heading || !header || !name) return;

  const scrim = document.createElement("div");
  scrim.className = "page-scrim";
  scrim.setAttribute("aria-hidden", "true");

  const sticky = document.createElement("div");
  sticky.className = "sticky-title";
  // The heading is already in the document for screen readers and the
  // accessibility tree; this is a visual echo of it.
  sticky.setAttribute("aria-hidden", "true");
  sticky.textContent = heading.textContent.trim();

  // The scrim goes inside #page-content, not on the body: that element carries
  // a view-transition-name and so opens its own stacking context, which keeps
  // the header's z-50 local to it. Appended to the body, the scrim would paint
  // over the whole thing — name and theme toggle included — whatever its
  // z-index. The title goes in the header, above the scrim by the same logic.
  const host = document.getElementById("page-content") || document.body;
  host.append(scrim);
  header.append(sticky);

  // Each template paints its own page colour on #page-background via a utility
  // class, and the dark toggle swaps it at runtime, so the scrim reads the
  // resolved colour rather than hard-coding one per theme.
  const ground = document.getElementById("page-background");

  function paint() {
    if (!ground) return;
    scrim.style.setProperty("--scrim", getComputedStyle(ground).backgroundColor);
  }

  paint();
  new MutationObserver(paint).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  function place() {
    const rect = heading.getBoundingClientRect();
    sticky.style.left = rect.left + "px";
    sticky.style.width = rect.width + "px";

    const from = getComputedStyle(name);
    sticky.style.fontSize = from.fontSize;
    sticky.style.lineHeight = from.lineHeight;
    sticky.style.fontWeight = from.fontWeight;
    sticky.style.letterSpacing = from.letterSpacing;
  }

  let crossed = false;

  function render() {
    const show = crossed && wide.matches;
    scrim.classList.toggle("is-visible", show);
    sticky.classList.toggle("is-visible", show);
  }

  let raf = 0;
  function update() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      raf = 0;
      place();
      render();
    });
  }

  place();

  // Fires as the heading crosses the header line rather than the viewport top,
  // so the swap happens where the eye already is.
  const observer = new IntersectionObserver(
    ([entry]) => {
      // Compared against the margin-adjusted root, not the viewport top. A
      // short heading leaves that root while its own top is still positive —
      // somewhere between 0 and the margin — so testing top < 0 missed the
      // crossing and only caught up once the page had scrolled well past.
      const line = entry.rootBounds ? entry.rootBounds.top : 0;
      crossed = !entry.isIntersecting && entry.boundingClientRect.top < line;
      render();
    },
    { rootMargin: "-72px 0px 0px 0px", threshold: 0 },
  );
  observer.observe(heading);

  // The column's edges move for more reasons than a window resize: a rotation,
  // the webfonts landing, a pinch-zoom on iOS — which changes the visual
  // viewport without firing resize on the window.
  new ResizeObserver(update).observe(heading);
  window.addEventListener("resize", update);
  window.addEventListener("orientationchange", update);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", update);
  }
  if (document.fonts) document.fonts.ready.then(update);

  // Safari 13 and earlier only take the callback form.
  if (wide.addEventListener) {
    wide.addEventListener("change", update);
  } else {
    wide.addListener(update);
  }
})();
