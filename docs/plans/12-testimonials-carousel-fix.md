# Plan: Testimonials Carousel Fix

**Branch:** feature/personalisation  
**Date:** 2026-07-04  
**Reference:** https://www.w3.org/WAI/ARIA/apg/patterns/carousel/

---

## What's changing and why

The current implementation is still the old scroll-track. This plan replaces it entirely with a proper carousel. Two files change: `Testimonials.tsx` (full rewrite) and `Testimonials.module.css` (full rewrite).

---

## 1. Layout — 1fr 3fr grid, matching Experience and About

The `<section>` gets a single `.inner` div with the same grid used by every other section:

```css
.inner {
  max-width: var(--content-max-w);
  margin-inline: auto;
  padding-inline: var(--content-padding);
  display: grid;
  grid-template-columns: 1fr 3fr;
  gap: var(--space-8);
  align-items: start;
}
```

Left column: `<h2>` label.  
Right column: a `.rightCol` div containing the carousel, the static grid fallback, and the controls — stacked vertically.

Cards sit inside the 3fr column on initial render. The carousel's `overflow: hidden` clips the sliding track, so nothing bleeds before or after navigation. The right column's left edge aligns exactly with Experience entries.

---

## 2. CSS transform carousel — how the looping works

### Why pixel values, not percentages

`translateX(-100%)` on the `.track` element refers to the track's own width — which is `(n + 2) × slideWidth` (n real slides plus 2 clones). That's wildly wrong for navigation. Instead, the transform is always computed in pixels: `translateX(${-offset × slideWidth}px)`, where `slideWidth` = the live region's `offsetWidth` at runtime.

### DOM structure

```
liveRegion (overflow: hidden) — one slide width visible at a time
└── track (display: flex, transform shifts it left/right)
    ├── clone_last   (DOM index 0,   aria-hidden)
    ├── slide_0      (DOM index 1)
    ├── slide_1      (DOM index 2)
    ├── …
    ├── slide_n-1    (DOM index n)
    └── clone_first  (DOM index n+1, aria-hidden)
```

Initial position: `translateX(-1 × slideWidth)` → showing `slide_0`.

### Navigation

```
goNext():  offset → offset + 1
goPrev():  offset → offset - 1
```

On `transitionend` (scoped to `propertyName === 'transform'` only):
```
If offset === n + 1 (landed on clone_first):
  set transition: none → jump to DOM index 1 (slide_0)

If offset === 0 (landed on clone_last):
  set transition: none → jump to DOM index n (slide_n-1)
```

The instant jump is imperceptible because the clone and the real slide render identically. After the jump, `transition` is restored on the next animation frame.

### Refs used

```ts
const trackRef       = useRef<HTMLDivElement>(null);   // direct transform control
const liveRegionRef  = useRef<HTMLDivElement>(null);   // measure offsetWidth
const domOffsetRef   = useRef(1);                      // current DOM position (no re-render)
```

### Resize handling

A `resize` listener (attached in `useEffect`, cleaned up on unmount) re-runs the initial position snap without animation. This keeps the carousel correctly positioned if the column width changes.

### SSR / hydration

The track is `visibility: hidden` via CSS until `useEffect` fires after hydration. `useEffect` sets the initial position, then sets `visibility: visible`. No flash of wrongly-positioned slides.

---

## 3. prefers-reduced-motion — CSS only, dual markup

Both the carousel and the static grid exist in the DOM simultaneously. CSS media queries control which is visible. `display: none` removes elements from both visual rendering AND the accessibility tree — no `aria-hidden` needed on the hidden block.

```css
/* Default (no reduced-motion preference): carousel on, grid off */
.staticGrid { display: none; }
.controls   { display: flex; }

/* Reduced-motion: carousel off, grid on */
@media (prefers-reduced-motion: reduce) {
  .carousel   { display: none; }
  .controls   { display: none; }
  .staticGrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); }
}

@media (prefers-reduced-motion: reduce) and (max-width: 900px) {
  .staticGrid { grid-template-columns: repeat(2, 1fr); }
}

@media (prefers-reduced-motion: reduce) and (max-width: 640px) {
  .staticGrid { grid-template-columns: 1fr; }
}
```

The static grid reuses the same card content helper (`<SlideContent>`), so there is no duplication of business logic. Card styling (`background: var(--color-bg-subtle)`, padding, typography) is shared via the same CSS classes.

---

## 4. ARIA — W3C APG carousel pattern

This is a **manual (non-auto-rotating)** carousel. No play/pause button required.

| Element | ARIA |
|---|---|
| Carousel wrapper `<div>` | `aria-roledescription="carousel"` `aria-label="Testimonials"` |
| Live region `<div>` | `aria-live="polite"` → `"off"` during transition, `aria-atomic="false"` |
| Each real slide `<div>` | `role="group"` `aria-roledescription="slide"` `aria-label="N of total"` |
| Non-current real slides | `aria-hidden={true}` |
| clone_last, clone_first | `aria-hidden="true"` (always) |
| Prev button | `aria-label="Previous testimonial"` |
| Next button | `aria-label="Next testimonial"` |
| Counter `<span>` | `aria-hidden="true"` (screen readers get this from slide labels) |

**Pause on hover/focus:** `onMouseEnter` and `onFocus` on the carousel wrapper restore `aria-live="polite"`. During a slide transition, `aria-live` is set to `"off"` so the screen reader doesn't announce mid-animation. After `transitionend`, it switches back to `"polite"` so the new slide content is announced.

**Buttons disabled during transition:** `disabled={isTransitioning}` prevents double-fire from keyboard users.

---

## 5. Navigation buttons

```tsx
<button type="button" aria-label="Previous testimonial" disabled={isTransitioning} onClick={goPrev}>
  ←
</button>
<button type="button" aria-label="Next testimonial" disabled={isTransitioning} onClick={goNext}>
  →
</button>
```

Visual text is the arrow character. Screen reader text is the `aria-label` (which overrides the button text for assistive technology).

The controls row also includes a counter left of the buttons:

```tsx
<span className={styles.counter} aria-hidden="true">
  {currentIndex + 1} / {total}
</span>
```

---

## 6. Full HTML structure

```tsx
<section id="testimonials" className={styles.section} aria-labelledby="testimonials-heading">
  <div className={styles.inner}>

    <h2 id="testimonials-heading" className={styles.label}>Testimonials</h2>

    <div className={styles.rightCol}>

      {/* ── Carousel ────────────────────────────────────── */}
      <div
        className={styles.carousel}
        aria-roledescription="carousel"
        aria-label="Testimonials"
        onMouseEnter={() => setLivePolite(true)}
        onFocus={() => setLivePolite(true)}
      >
        <div
          ref={liveRegionRef}
          className={styles.liveRegion}
          aria-live={livePolite ? 'polite' : 'off'}
          aria-atomic="false"
        >
          <div
            ref={trackRef}
            className={styles.track}
            onTransitionEnd={handleTransitionEnd}
          >
            {/* clone_last */}
            <div className={styles.slide} role="group" aria-roledescription="slide"
                 aria-label={`${total} of ${total}`} aria-hidden="true">
              <SlideContent testimonial={testimonials[total - 1]} />
            </div>

            {/* real slides */}
            {testimonials.map((t, i) => (
              <div key={t.id} className={styles.slide} role="group" aria-roledescription="slide"
                   aria-label={`${i + 1} of ${total}`}
                   aria-hidden={i !== currentIndex ? true : undefined}>
                <SlideContent testimonial={t} />
              </div>
            ))}

            {/* clone_first */}
            <div className={styles.slide} role="group" aria-roledescription="slide"
                 aria-label={`1 of ${total}`} aria-hidden="true">
              <SlideContent testimonial={testimonials[0]} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Static grid (reduced-motion only) ───────────── */}
      <ul className={styles.staticGrid}>
        {testimonials.map((t) => (
          <li key={t.id} className={styles.staticCard}>
            <SlideContent testimonial={t} />
          </li>
        ))}
      </ul>

      {/* ── Controls ────────────────────────────────────── */}
      <div className={styles.controls}>
        <span className={styles.counter} aria-hidden="true">
          {currentIndex + 1} / {total}
        </span>
        <button type="button" className={styles.navButton}
                aria-label="Previous testimonial" disabled={isTransitioning}
                onClick={goPrev}>←</button>
        <button type="button" className={styles.navButton}
                aria-label="Next testimonial" disabled={isTransitioning}
                onClick={goNext}>→</button>
      </div>

    </div>
  </div>
</section>
```

`<SlideContent>` is a non-exported helper component inside the file that renders the `<blockquote>`, quote text, translation note, and attribution.

---

## 7. CSS key rules

```css
.track {
  display: flex;
  will-change: transform;
  visibility: hidden;   /* hidden until useEffect sets initial position */
  /* transform and transition controlled entirely via JS */
}

.liveRegion {
  overflow: hidden;     /* clips the track on both sides */
}

.slide {
  flex: 0 0 100%;       /* 100% of liveRegion width (flex-basis resolves against containing block) */
  min-width: 0;
}

.navButton:disabled {
  opacity: 0.4;
  cursor: default;
  pointer-events: none;
}

.controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.counter {
  margin-right: auto;   /* pushes counter left, buttons right */
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
```

Card typography (`.quote`, `.attribution`, etc.) is unchanged from the existing implementation.

---

## 8. Responsive

```css
@media (max-width: 640px) {
  .inner {
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }
  .label { padding-top: 0; }
}
```

This is identical to About and Experience. The carousel itself adapts automatically — `flex: 0 0 100%` on each slide always fills whatever the column width is, even on mobile.

---

## 9. Edge cases

- **0 testimonials:** early `return null` — nothing renders.
- **1 testimonial:** track is `[clone_last, slide_0, clone_first]`. Navigating in either direction loops back to slide_0 immediately. Works correctly; the same card slides in.
- **2+ testimonials:** works normally.
- **Window resize:** `useEffect` resize listener re-snaps to current position without animation.

---

## Files changed

| File | Action |
|---|---|
| `src/components/Testimonials/Testimonials.tsx` | Full rewrite |
| `src/components/Testimonials/Testimonials.module.css` | Full rewrite |

No changes to `types.ts`, `strapi.ts`, `page.tsx`, or any other file.
