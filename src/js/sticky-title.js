// When the page's own heading scrolls off the top, a small copy of it rises
// into the header line beside "Daniël van der Winden", over a scrim that keeps
// the text under it legible.
//
// Fixed rather than position: sticky, because the heading lives in a column
// that is right-aligned inside a max-width container — its left edge moves with
// the viewport, so it is measured from the heading itself and re-measured on
// resize.
//
// Desktop only: on a phone the header, the title and the toggle cannot share a
// line, and the heading is only a short scroll away.
(function () {
  const wide = window.matchMedia("(min-width: 1024px)");
  if (!wide.matches) return;

  // The in-content heading, not the name in the header.
  const heading = document.querySelector("#main-content h1");
  if (!heading) return;

  const scrim = document.createElement("div");
  scrim.className = "page-scrim";
  scrim.setAttribute("aria-hidden", "true");

  const sticky = document.createElement("div");
  sticky.className = "sticky-title";
  // The heading is already in the document for screen readers and the
  // accessibility tree; this is a visual echo of it.
  sticky.setAttribute("aria-hidden", "true");
  sticky.textContent = heading.textContent.trim();

  document.body.append(scrim, sticky);

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
  }

  place();

  // Fires as the heading crosses the header line rather than the viewport top,
  // so the swap happens where the eye already is.
  const observer = new IntersectionObserver(
    ([entry]) => {
      const gone = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      scrim.classList.toggle("is-visible", gone);
      sticky.classList.toggle("is-visible", gone);
    },
    { rootMargin: "-72px 0px 0px 0px", threshold: 0 },
  );
  observer.observe(heading);

  let raf = 0;
  window.addEventListener("resize", () => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(place);
  });
})();
