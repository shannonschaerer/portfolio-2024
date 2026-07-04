# Plan: Testimonials Sliding Track (Conveyor Belt)

**Branch:** feature/personalisation  
**Date:** 2026-07-04  
**Reference:** https://www.w3.org/WAI/ARIA/apg/patterns/carousel/

---

## What's changing and why

The existing single-card carousel is being replaced with a multi-card sliding track. Two files change: `Testimonials.tsx` (full rewrite) and `Testimonials.module.css` (full rewrite). Nothing else changes.

---

## 1. Visual behaviour

### What the user sees at rest

- 2.5 testimonial cards visible side by side inside the 3fr right column
- The half-visible card on the right edge is a passive affordance — "there's more"
- Cards align flush with the left edge of the 3fr column (no leading padding inside the live region)
- A "Show more" button sits below the track, aligned to that same left edge

### What happens on click

- The entire track slides left by exactly one card-width + one gap (GPU-accelerated CSS transform, 0.45s ease-in-out)
- The button is disabled for the duration of the transition, then re-enabled
- When a card exits the left edge, it reappears at the right end of the track (conveyor belt loop — explained in section 3)
- The button is always present and always does the same thing — no "collapse," no counter

---

## 2. Card sizing — the math

At each breakpoint, we need exactly N.x cards to fit the container width:

| Breakpoint | Cards visible | Formula |
|---|---|---|
| Desktop > 900px | 2.5 | `(containerWidth − 2 × gap) / 2.5` |
| Tablet ≤ 900px | 1.5 | `(containerWidth − 1 × gap) / 1.5` |
| Mobile ≤ 640px | 1.2 | `(containerWidth − 1 × gap) / 1.2` |

**Why these formulas:** For N.x visible cards, the total visible width = N.x × cardWidth + floor(N.x) × gap (one gap sits between each consecutive pair of cards, including the pair that straddles the clip boundary). Solving for cardWidth gives the formulas above.

```
Desktop (2.5 visible):
  card | gap | card | gap | ½ card ← clipped by overflow:hidden
  width = 2.5×cw + 2×gap
  → cw = (container − 2×gap) / 2.5

Tablet (1.5 visible):
  card | gap | ½ card ← clipped
  width = 1.5×cw + 1×gap
  → cw = (container − gap) / 1.5

Mobile (1.2 visible):
  card | gap | 0.2 card ← clipped
  width = 1.2×cw + 1×gap
  → cw = (container − gap) / 1.2
```

**CSS implementation:** `container-type: inline-size` on `.liveRegion` allows using `100cqi` (= 100% of the live region's inline size) inside child elements — the same technique from the previous carousel:

```css
.liveRegion {
  container-type: inline-size;
  overflow: hidden;        /* clips the track left and right */
  --card-gap: var(--space-3);
  --card-w: calc((100cqi - 2 * var(--card-gap)) / 2.5);
}

@media (max-width: 900px) {
  .liveRegion { --card-w: calc((100cqi - var(--card-gap)) / 1.5); }
}

@media (max-width: 640px) {
  .liveRegion { --card-w: calc((100cqi - var(--card-gap)) / 1.2); }
}
```

Each slide gets `flex: 0 0 var(--card-w)`. CSS inherits `--card-w` from the ancestor `.liveRegion`. ✓

The gap between cards is `gap: var(--card-gap)` on the flex track — not margins — so it doesn't collapse and is easy to measure in JS.

---

## 3. The conveyor belt loop — how it works without glitching

### The problem

A flat list of N cards runs out of cards to the right after N steps. We can't keep moving the track left indefinitely without eventually showing empty space.

### The solution: double the track, jump on transitionend

The DOM renders all cards **twice**: `[real_0, real_1, …, real_N-1, clone_0, clone_1, …, clone_N-1]`.

- Real slides have full ARIA (described in section 4)
- Clone slides have `aria-hidden="true"` — they're decorative copies, invisible to screen readers

The track scrolls left until it reaches the start of the clone section (offset = N steps). At that moment, `transitionend` fires and we **instantly jump** to offset 0 — with no animation. This is undetectable because:

1. At offset N, `clone_0` is at the left edge of the live region
2. At offset 0, `real_0` is at the left edge of the live region
3. They are visually identical — same content, same position

After the jump, the next click starts from offset 0 again. The belt is infinite.

### Why this works for 2.5 visible cards

At offset N, the visible window shows: `clone_0`, `clone_1`, and `0.5 × clone_2`. After the jump to offset 0, the visible window shows `real_0`, `real_1`, and `0.5 × real_2`. Identical visual. ✓

For this to work without showing empty space during the final transition (N-1 → N), the track must have enough items beyond index N. With 2.5 cards visible, we need `N + 2` items in the track to be non-empty. The track has `2N` items, so we need `N ≥ 3`.

**Edge case guard:** If `testimonials.length < 3`, the component renders only the static grid (no carousel). A conveyor belt with 1–2 cards and 2.5 visible doesn't make much sense anyway.

### Step measurement (pixels, not percentages)

The transform uses pixel values: `translateX(-stepRef.current * step)` where `step = cardWidth + gap`. Rather than recalculating from CSS variables (which would require parsing rem units), we measure directly from the DOM:

```ts
function getStep(): number {
  const slides = trackRef.current?.children;
  if (!slides || slides.length < 2) return 0;
  // offsetLeft difference between consecutive slides = cardWidth + gap exactly
  return (slides[1] as HTMLElement).offsetLeft - (slides[0] as HTMLElement).offsetLeft;
}
```

This is robust: it doesn't care how the card width was computed (CSS variables, container queries, etc.) — it just reads the rendered pixel positions. Called on mount and on resize.

---

## 4. ARIA — W3C APG carousel pattern

This is a **manual, non-auto-rotating** carousel. Multiple cards visible simultaneously.

| Element | ARIA |
|---|---|
| Carousel wrapper `<div>` | `aria-roledescription="carousel"`, `aria-label="Testimonials"` |
| Live region `<div>` | `id="testimonials-track"`, `aria-live="polite"` (or `"off"` during transition), `aria-atomic="false"` |
| Each **real** slide | `role="group"`, `aria-roledescription="slide"`, `aria-label="N of total"` |
| Each **clone** slide | `aria-hidden="true"` — removed from accessibility tree entirely |
| "Show more" button | `type="button"`, `aria-label="Show next testimonial"`, `aria-controls="testimonials-track"`, `disabled={isTransitioning}` |

**Why no `aria-hidden` on non-current real slides:** With multiple slides visible simultaneously, every real slide is potentially within the sighted user's view. Hiding non-visible ones dynamically would require tracking pixel positions — complex, fragile, and unnecessary. Screen readers can navigate through all N real slides by their `aria-label` ("1 of 5", "2 of 5", etc.).

**Why `aria-live="off"` during transition:** Announces the incoming content only after the slide settles, not while it's in motion. Matches the APG guidance on preventing mid-animation announcements.

**`aria-controls`:** Links the button to the live region it controls, as recommended by the APG for carousel navigation buttons.

---

## 5. State and refs

```ts
// React state (drives re-renders)
const [isTransitioning, setIsTransitioning] = useState(false);  // disables button
const [livePolite, setLivePolite] = useState(true);             // controls aria-live

// Refs (drive DOM directly — no re-renders needed for animation timing)
const trackRef      = useRef<HTMLDivElement>(null);  // CSS transform target
const liveRegionRef = useRef<HTMLDivElement>(null);  // for getStep() measurement
const stepCountRef  = useRef(0);                     // how many steps have been taken (0-based)
```

`stepCountRef` is a ref, not state, because the transform is written directly to the DOM. Writing it to state would cause a re-render between "set transform" and "transitionend", which would break the timing of the instant jump.

No `currentIndex` state — with multiple visible cards and infinite looping, a single "current" index isn't meaningful. The counter display is gone entirely.

---

## 6. Navigation logic

```ts
const total = testimonials.length;

function advance() {
  if (isTransitioning) return;
  setIsTransitioning(true);
  setLivePolite(false);

  const newCount = stepCountRef.current + 1;
  stepCountRef.current = newCount;

  const step = getStep();
  const track = trackRef.current!;
  track.style.transition = 'transform 0.45s ease-in-out';
  track.style.transform = `translateX(${-newCount * step}px)`;
}

function handleTransitionEnd(e: React.TransitionEvent<HTMLDivElement>) {
  if (e.propertyName !== 'transform') return;

  if (stepCountRef.current >= total) {
    // Jump to the equivalent position in the real slides section
    const remainder = stepCountRef.current % total;
    stepCountRef.current = remainder;
    const step = getStep();
    const track = trackRef.current!;
    track.style.transition = 'none';
    track.style.transform = `translateX(${-remainder * step}px)`;
  }

  setIsTransitioning(false);
  setLivePolite(true);
}
```

**Why `stepCountRef.current % total` instead of just `0`:** If for some reason `stepCountRef` exceeds `total` by more than 1 (e.g. after a resize mid-transition), the modulo handles any value correctly, not just the exact boundary.

---

## 7. Resize handling

On window resize, card widths change (container queries recalculate). The track must be repositioned to the correct pixel offset for the current `stepCountRef.current` value.

```ts
useEffect(() => {
  function snap() {
    const track = trackRef.current;
    if (!track) return;
    const step = getStep();
    if (step === 0) return;
    track.style.transition = 'none';
    track.style.transform = `translateX(${-stepCountRef.current * step}px)`;
    track.style.visibility = 'visible';
  }

  snap();
  window.addEventListener('resize', snap);
  return () => window.removeEventListener('resize', snap);
}, []);  // runs once; snap() reads refs, so no deps needed
```

`visibility: hidden` in CSS prevents the flash before this first snap runs (same pattern as the previous carousel).

---

## 8. prefers-reduced-motion — CSS only, dual markup

Both the carousel and the static grid exist in the DOM at all times. CSS switches which is visible. `display: none` removes elements from both rendering and the accessibility tree.

```css
.staticGrid { display: none; }  /* default */

@media (prefers-reduced-motion: reduce) {
  .carousel     { display: none; }
  .controls     { display: none; }  /* "Show more" button */
  .staticGrid   { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); }
}

@media (prefers-reduced-motion: reduce) and (max-width: 900px) {
  .staticGrid { grid-template-columns: repeat(2, 1fr); }
}

@media (prefers-reduced-motion: reduce) and (max-width: 640px) {
  .staticGrid { grid-template-columns: 1fr; }
}
```

The static grid renders only the real testimonials (not clones). `SlideContent` is shared between both — no duplication of business logic.

---

## 9. Full DOM structure

```tsx
<section id="testimonials" aria-labelledby="testimonials-heading">
  <div className={styles.inner}>                    {/* 1fr 3fr grid */}

    <h2 id="testimonials-heading" className={styles.label}>Testimonials</h2>

    <div className={styles.rightCol}>

      {/* ── Carousel (hidden in prefers-reduced-motion) ── */}
      <div
        className={styles.carousel}
        aria-roledescription="carousel"
        aria-label="Testimonials"
        onMouseEnter={() => setLivePolite(true)}
        onFocus={() => setLivePolite(true)}
      >
        <div
          id="testimonials-track"
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
            {/* Real slides — accessible to screen readers */}
            {testimonials.map((t, i) => (
              <div key={t.id} className={styles.slide}
                   role="group" aria-roledescription="slide"
                   aria-label={`${i + 1} of ${total}`}>
                <SlideContent testimonial={t} />
              </div>
            ))}

            {/* Clone slides — decorative only */}
            {testimonials.map((t) => (
              <div key={`clone-${t.id}`} className={styles.slide}
                   role="group" aria-roledescription="slide"
                   aria-label="" aria-hidden="true">
                <SlideContent testimonial={t} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Static grid (reduced-motion only) ── */}
      <ul className={styles.staticGrid}>
        {testimonials.map((t) => (
          <li key={t.id} className={styles.staticCard}>
            <SlideContent testimonial={t} />
          </li>
        ))}
      </ul>

      {/* ── Controls (hidden in prefers-reduced-motion) ── */}
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.showMoreButton}
          aria-label="Show next testimonial"
          aria-controls="testimonials-track"
          disabled={isTransitioning}
          onClick={advance}
        >
          Show more
        </button>
      </div>

    </div>
  </div>
</section>
```

---

## 10. CSS key rules

```css
/* Grid — identical to Experience and About */
.inner {
  display: grid;
  grid-template-columns: 1fr 3fr;
  gap: var(--space-8);
  align-items: start;
}

/* Track clips overflowing cards on both edges */
.liveRegion {
  container-type: inline-size;
  overflow: hidden;
  --card-gap: var(--space-3);
  --card-w: calc((100cqi - 2 * var(--card-gap)) / 2.5);
}

@media (max-width: 900px) {
  .liveRegion { --card-w: calc((100cqi - var(--card-gap)) / 1.5); }
}

@media (max-width: 640px) {
  .liveRegion { --card-w: calc((100cqi - var(--card-gap)) / 1.2); }
}

.track {
  display: flex;
  gap: var(--card-gap);
  will-change: transform;
  visibility: hidden;   /* revealed by useEffect after initial snap */
}

.slide {
  flex: 0 0 var(--card-w);
  min-width: 0;
  background: var(--color-bg-subtle);
  padding: var(--space-4);
}

/* Button — aligned left (no special positioning needed — it's the first child of rightCol) */
.showMoreButton {
  /* same visual style as Experience's toggle button */
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

.showMoreButton:hover {
  background-color: var(--color-text);
  color: var(--color-bg);
}

.showMoreButton:disabled {
  opacity: 0.4;
  cursor: default;
  pointer-events: none;
}

/* Responsive */
@media (max-width: 640px) {
  .inner { grid-template-columns: 1fr; gap: var(--space-3); }
  .label { padding-top: 0; }
}
```

---

## 11. Responsive behaviour

| Width | Grid | Visible cards | Button |
|---|---|---|---|
| > 900px | 1fr 3fr | 2.5 | visible |
| 641–900px | 1fr 3fr | 1.5 | visible |
| ≤ 640px | 1fr (stacked) | 1.2 | visible |
| prefers-reduced-motion | static grid (3/2/1 col) | all | hidden |

---

## 12. Edge cases

- **0 testimonials:** `return null` — nothing renders
- **1–2 testimonials:** falls back to the static grid (carousel requires ≥ 3 for the double-array loop to work without empty space at the wrap point)
- **Resize mid-session:** `snap()` recalculates pixel step from DOM, repositions track at current logical offset
- **Rapid click:** button is `disabled` during the 0.45s transition — not possible to double-fire

---

## Files changed

| File | Action |
|---|---|
| `src/components/Testimonials/Testimonials.tsx` | Full rewrite |
| `src/components/Testimonials/Testimonials.module.css` | Full rewrite |

No changes to `types.ts`, `strapi.ts`, `page.tsx`, or any other file.
