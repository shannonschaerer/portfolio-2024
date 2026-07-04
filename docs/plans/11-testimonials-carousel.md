# Plan: Testimonials Carousel

**Branch:** feature/personalisation  
**Date:** 2026-06-30  
**Reference:** https://www.w3.org/WAI/ARIA/apg/patterns/carousel/

---

## Overview

Replace the horizontal scroll track with a proper looping carousel. One card visible at a time. Manual navigation only (no auto-rotation). Follows the W3C APG carousel pattern strictly. Layout matches Experience exactly: `1fr 3fr` grid, label left, content right.

Two files change: `Testimonials.tsx` and `Testimonials.module.css`. No Strapi changes, no type changes.

---

## Layout

Identical structure to Experience:

```
| TESTIMONIALS   | ─────────────────────────── |   ← h2 left, <hr> right
|                | [Quote in Playfair Display] |   ← one slide at a time
|                | [Author / Company / Year  ] |
|                |                             |
|                |   Show less   Show more     |   ← controls, bottom-right
```

The `1fr 3fr` grid wraps everything. Label in left column, `<hr>` + carousel + controls stacked vertically in the right column. The `<hr>` sits at the top of the right column, visually extending the label row across — matches how Experience entries have a top border on the first item.

---

## W3C APG Carousel Pattern — applied

The APG distinguishes two patterns:
- **Auto-rotating**: requires a play/pause button, aria-live="off" while rotating
- **Basic/manual**: aria-live="polite", no play/pause button required

This carousel is **manual** (no auto-rotation). "Pause on hover/focus" is implemented as: `aria-live` is set to `"off"` during slide transitions (so the screen reader doesn't announce mid-animation) and back to `"polite"` once the slide has settled. On hover or focus, we ensure `aria-live="polite"` is active so the current slide's content is announced.

### Required ARIA attributes

| Element | Role / Attribute | Value |
|---|---|---|
| Carousel container `<div>` | `aria-roledescription` | `"carousel"` |
| Carousel container `<div>` | `aria-label` | `"Testimonials"` |
| Live region `<div>` | `aria-live` | `"polite"` (or `"off"` during transition) |
| Live region `<div>` | `aria-atomic` | `"false"` |
| Each slide `<div>` | `role` | `"group"` |
| Each slide `<div>` | `aria-roledescription` | `"slide"` |
| Each slide `<div>` | `aria-label` | `"1 of 5"`, `"2 of 5"`, etc. |
| Non-current slides | `aria-hidden` | `"true"` |
| Prev button | `aria-label` | `"Previous testimonial"` |
| Next button | `aria-label` | `"Next testimonial"` |

The `<section>` element is already a landmark (`aria-labelledby="testimonials-heading"`). The carousel container is nested inside and gets `aria-roledescription="carousel"` — this is the correct APG nesting.

---

## Infinite loop mechanism

**Technique: cloned sentinel slides**

The DOM renders: `[clone_last, slide_0, slide_1, …, slide_n-1, clone_first]`

- `clone_last` — a visual copy of the last real slide, prepended
- `clone_first` — a visual copy of the first real slide, appended
- Both clones have `aria-hidden="true"` and are never focusable

The track slides left/right via `transform: translateX(...)`. When the transition lands on a clone, `transitionend` fires and we instantly jump (no transition) to the corresponding real slide:

```
Going forward past last slide:
  animate → clone_first → transitionend → jump (no animation) → slide_0

Going backward past first slide:
  animate → clone_last → transitionend → jump (no animation) → slide_n-1
```

Because the jump happens without animation and after the browser has already painted the clone in the same position as the real slide, the user sees no visual glitch.

### Why not CSS scroll snap?

Scroll snap works for a scrollable overflow container but doesn't give us control over `transitionend` for the clone-jump logic. The transform approach gives precise timing control needed for seamless looping.

---

## State and refs

React state is kept minimal. The track's `transform` is driven via a ref to avoid render-cycle timing issues with the `transition: none` → instant jump → `transition: restore` sequence.

```ts
// React state (drives re-renders)
const [currentIndex, setCurrentIndex] = useState(0);    // 0 to n-1, for "N of total" display
const [isTransitioning, setIsTransitioning] = useState(false); // disables buttons during slide
const [liveRegionActive, setLiveRegionActive] = useState(true); // controls aria-live

// Refs (drive DOM directly, no re-renders needed)
const trackRef = useRef<HTMLDivElement>(null);
const domOffsetRef = useRef(1); // starts at slide_0 (DOM index 1 because clone_last is at 0)
```

The `setTransform(offset, animated)` helper writes directly to `trackRef.current.style`:

```ts
function setTransform(offset: number, animated: boolean) {
  if (!trackRef.current) return;
  trackRef.current.style.transition = animated ? 'transform 0.45s ease-in-out' : 'none';
  trackRef.current.style.transform = `translateX(calc(-${offset} * 100%))`;
}
```

---

## Navigation logic

```ts
const total = testimonials.length; // e.g. 5

function goNext() {
  if (isTransitioning) return;
  setIsTransitioning(true);
  setLiveRegionActive(false);       // silence screen reader during slide
  const newOffset = domOffsetRef.current + 1;
  domOffsetRef.current = newOffset;
  setTransform(newOffset, true);
  setCurrentIndex(i => (i + 1) % total);
}

function goPrev() {
  if (isTransitioning) return;
  setIsTransitioning(true);
  setLiveRegionActive(false);
  const newOffset = domOffsetRef.current - 1;
  domOffsetRef.current = newOffset;
  setTransform(newOffset, true);
  setCurrentIndex(i => (i - 1 + total) % total);
}

function handleTransitionEnd() {
  if (domOffsetRef.current === total + 1) {     // landed on clone_first
    domOffsetRef.current = 1;
    setTransform(1, false);                     // instant jump to slide_0
  } else if (domOffsetRef.current === 0) {      // landed on clone_last
    domOffsetRef.current = total;
    setTransform(total, false);                 // instant jump to slide_n-1
  }
  setIsTransitioning(false);
  setLiveRegionActive(true);                    // re-enable screen reader announcement
}
```

`transitionend` is attached to the track div as `onTransitionEnd`.

---

## Pause on hover/focus

```tsx
<div
  className={styles.carouselWrapper}
  aria-roledescription="carousel"
  aria-label="Testimonials"
  onMouseEnter={() => setLiveRegionActive(true)}
  onMouseLeave={() => setLiveRegionActive(true)}
  onFocus={() => setLiveRegionActive(true)}
  onBlur={() => setLiveRegionActive(false)}
>
```

Since this is a manual carousel, "pause" means ensuring `aria-live="polite"` is active when the user interacts (hover/focus) so the screen reader announces the current slide. We never suppress announcements while the user is actively engaged — only during the brief animation window.

---

## HTML structure

```tsx
<section id="testimonials" aria-labelledby="testimonials-heading">
  <div className={styles.inner}>                          {/* 1fr 3fr grid */}

    <h2 id="testimonials-heading" className={styles.label}>Testimonials</h2>

    <div className={styles.rightCol}>
      <hr className={styles.divider} />

      <div
        className={styles.carouselWrapper}
        aria-roledescription="carousel"
        aria-label="Testimonials"
        onMouseEnter/onMouseLeave/onFocus/onBlur  {/* pause handlers */}
      >
        {/* Live region — announces current slide to screen readers */}
        <div
          className={styles.liveRegion}
          aria-live={liveRegionActive ? 'polite' : 'off'}
          aria-atomic="false"
        >
          {/* Slide track — direct DOM control via ref */}
          <div
            ref={trackRef}
            className={styles.track}
            onTransitionEnd={handleTransitionEnd}
          >
            {/* clone_last — aria-hidden, not focusable */}
            <div
              className={styles.slide}
              role="group"
              aria-roledescription="slide"
              aria-label={`${total} of ${total}`}
              aria-hidden="true"
            >
              <SlideContent testimonial={testimonials[total - 1]} />
            </div>

            {/* real slides */}
            {testimonials.map((t, i) => (
              <div
                key={t.id}
                className={styles.slide}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${total}`}
                aria-hidden={i !== currentIndex ? 'true' : undefined}
              >
                <SlideContent testimonial={t} />
              </div>
            ))}

            {/* clone_first — aria-hidden, not focusable */}
            <div
              className={styles.slide}
              role="group"
              aria-roledescription="slide"
              aria-label="1 of {total}"
              aria-hidden="true"
            >
              <SlideContent testimonial={testimonials[0]} />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <span className={styles.counter} aria-hidden="true">
          {currentIndex + 1} / {total}
        </span>
        <button
          type="button"
          className={styles.navButton}
          aria-label="Previous testimonial"
          disabled={isTransitioning}
          onClick={goPrev}
        >
          Show less
        </button>
        <button
          type="button"
          className={styles.navButton}
          aria-label="Next testimonial"
          disabled={isTransitioning}
          onClick={goNext}
        >
          Show more
        </button>
      </div>
    </div>

  </div>
</section>
```

`<SlideContent>` is an internal helper component (not exported) that renders the `<blockquote>`, quote text, translation note, and attribution — same markup as before.

---

## Keyboard behaviour

From the APG for manual carousels:
- **Tab / Shift+Tab** — moves through the page's tab sequence; the two nav buttons are the only tab stops inside the carousel
- **Enter or Space** — activates focused button
- **No arrow key requirement** — the APG only requires arrow keys for tabbed carousel variants; this is a basic group carousel

The buttons are disabled (`disabled` attribute) while `isTransitioning` is `true`, preventing keyboard users from triggering rapid double-advances.

---

## CSS approach

```css
.rightCol {
  display: flex;
  flex-direction: column;
  gap: 0;   /* spacing controlled per element */
}

.divider {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 0;
  margin-bottom: var(--space-6);
}

.carouselWrapper {
  /* Contains the overflow:hidden clip */
}

.liveRegion {
  overflow: hidden;   /* clips the sliding track */
}

.track {
  display: flex;      /* slides sit side by side */
  /* transform and transition set via JS */
}

.slide {
  flex: 0 0 100%;     /* each slide = 100% of liveRegion width */
  min-width: 0;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.counter {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin-right: auto;  /* pushes counter left, buttons right */
}

.navButton {
  /* matches Experience .toggleButton exactly */
  padding: var(--space-1) var(--space-3);
  background-color: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-text);
  border-radius: 0;
  font-size: var(--text-base);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.navButton:hover {
  background-color: var(--color-text);
  color: var(--color-bg);
}

.navButton:disabled {
  opacity: 0.4;
  cursor: default;
  pointer-events: none;
}
```

The card content styling (`.quote`, `.attribution`, `.author`, `.translationNote`) is unchanged from the current implementation.

---

## Counter display

A small `"1 / 5"` counter sits left of the buttons in the controls row. It's `aria-hidden="true"` because screen readers already get this information from each slide's `aria-label="N of total"`. The counter is a pure visual affordance for sighted users.

---

## Responsive

At `≤ 640px`, the grid collapses to single column (same as Experience and About):

```css
@media (max-width: 640px) {
  .inner {
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }
  .label { padding-top: 0; }
}
```

Controls stay right-aligned on mobile (the counter + two buttons fit fine at 375px).

---

## Accessibility checklist

- [ ] `aria-roledescription="carousel"` on wrapper
- [ ] `aria-live="polite"` on live region (switches to `"off"` during transitions)
- [ ] `aria-atomic="false"` on live region
- [ ] Each slide: `role="group"`, `aria-roledescription="slide"`, `aria-label="N of total"`
- [ ] Non-current slides: `aria-hidden="true"`
- [ ] Clone slides: `aria-hidden="true"` always
- [ ] Nav buttons: descriptive `aria-label` overrides visual text
- [ ] Buttons disabled during transition (keyboard can't double-fire)
- [ ] Focus ring visible on both buttons
- [ ] `<hr>` is a decorative separator — no ARIA needed
- [ ] Counter is `aria-hidden="true"` (info already in slide labels)
- [ ] Heading hierarchy correct: `<h2>` inside `<section>`

---

## Files changed

| File | Action |
|---|---|
| `src/components/Testimonials/Testimonials.tsx` | Full rewrite |
| `src/components/Testimonials/Testimonials.module.css` | Full rewrite |

No changes to `types.ts`, `strapi.ts`, `page.tsx`, or any other file.

---

## Open question

The visible button text is "Show more" (next) and "Show less" (prev). These are unconventional carousel labels — the APG suggests "Next slide" / "Previous slide" — but the screen reader `aria-label` will say "Next testimonial" / "Previous testimonial", so accessibility is covered. The visual labels match the editorial voice of the site.

If you'd prefer different visible text (e.g. "Next" / "Prev", or arrow glyphs rendered as text), say the word and I'll adjust before building.
