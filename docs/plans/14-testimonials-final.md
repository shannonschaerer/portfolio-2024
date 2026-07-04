# Plan: Testimonials Final — Full-Bleed Sliding Track

**Branch:** feature/personalisation  
**Date:** 2026-07-04  
**Reference:** https://www.w3.org/WAI/ARIA/apg/patterns/carousel/

---

## What's changing and why

Full rewrite of `Testimonials.tsx` and `Testimonials.module.css`. The goal is a sliding testimonial track that bleeds to the full viewport width while keeping the label and "Show more" button anchored to the existing section grid. No card duplication; no arrows; no counter.

---

## 1. Visual behaviour

### On load

- The track spans the full viewport width (`100vw`)
- Cards start at the **left edge of the 3fr column** — the same left edge as the Experience entries below
- Cards extend right until clipped by the browser window's right edge
- The clipped rightmost card is the visual hint that more exist
- No content bleeds past the left edge of the 3fr column on initial load

### After "Show more" clicks

- Each click shifts the entire track left by exactly one card-width + one gap
- Smooth CSS transform transition (0.45 s, ease-in-out)
- Cards bleed past both edges of the browser window as the user advances
- Button is `disabled` for the duration of the transition (prevents double-fire), then re-enabled
- Button is always visible — it never disappears or collapses

### Looping

- After the last "useful" step (defined in section 5), clicking "Show more" resets the track to its initial position with an **instant snap** (no animation). The belt starts over.
- No card duplication — the snap is the loop mechanism.

---

## 2. Layout structure

The section is divided into three stacked rows. Each row that contains positioned content uses the same centred max-width grid to keep the label and button anchored.

```
┌─────────────────────────────────────────────────────────────────┐
│ TESTIMONIALS (1fr)   │ (empty 3fr)                 ← header row │
├──────────────────────────────────────────────────────────────────┤
│         ← full-bleed 100vw track (overflow: clip wrapper) →      │
├─────────────────────────────────────────────────────────────────┤
│ (empty 1fr)           │ Show more (3fr)           ← controls row │
└─────────────────────────────────────────────────────────────────┘
```

The header row and controls row both use:

```css
.row {
  max-width: var(--content-max-w);
  margin-inline: auto;
  padding-inline: var(--content-padding);
  display: grid;
  grid-template-columns: 1fr 3fr;
  gap: var(--space-8);
}
```

This is the same grid used by Every other section's `.inner` div, so the label aligns exactly with the "EXPERIENCE" and "ABOUT" labels, and the button aligns with the entry left edges below.

The full-bleed track row has no grid — it is just `width: 100%` of the section (which itself is full-width), with `overflow: clip` to prevent horizontal page scroll.

### Why `overflow: clip` and not `overflow: hidden`

`overflow: hidden` creates a new scroll container. On some browsers this can cause the track — which extends beyond the page width — to produce a horizontal scrollbar or interfere with `position: sticky`. `overflow: clip` clips visually without creating a scroll container, which is exactly what we need for a full-bleed element inside a standard document flow.

---

## 3. The 3fr column left edge — measuring it in JavaScript

The track's initial position must place card 1 at the 3fr column's left edge. That pixel offset is not knowable in CSS alone (it depends on viewport width, the max-width cap, and the column gap), so we measure it from the DOM at runtime.

The "Show more" button sits at the 3fr column left edge. We use a ref on that button and read `getBoundingClientRect().left` to get the viewport-relative left offset.

```ts
const showMoreRef = useRef<HTMLButtonElement>(null);
const initialOffsetRef = useRef(0);   // stored so advance() can use it later

// In snap():
initialOffsetRef.current = showMoreRef.current.getBoundingClientRect().left;
```

This measurement is taken on mount (after hydration, inside `useEffect`) and again on every resize.

---

## 4. Card sizing — calculated in JavaScript

Card width is calculated so that exactly N full cards plus one partially clipped card fit between the 3fr column left edge and the right edge of the viewport.

### The formula

```
visibleWidth = window.innerWidth − initialOffset
cardWidth = (visibleWidth − floor(N_visible) × gap) / N_visible
```

Where `N_visible` is the number of cards that should be visible (including the partial one):

| Breakpoint | `N_visible` | `gap` |
|---|---|---|
| Mobile ≤ 640px | 1.2 | `var(--space-3)` = 24px |
| Tablet 641–1024px | 1.5 | `var(--space-4)` = 32px |
| Desktop 1025–1440px | 2.5 | `var(--space-6)` = 48px |
| Large desktop > 1440px | 3.5 | `var(--space-6)` = 48px |

### Why this formula

For 2.5 visible cards with gap `g`:

```
card | gap | card | gap | ½ card (clipped at right)
= 2×cw + 2g + 0.5×cw = 2.5×cw + 2g = visibleWidth
→ cw = (visibleWidth − 2g) / 2.5
```

General rule: total = N_visible × cw + floor(N_visible) × g, so cw = (visibleWidth − floor(N_visible) × g) / N_visible.

### Reading the gap in JavaScript

The CSS sets `gap` on `.track` per breakpoint (see section 10). In `snap()`:

```ts
const gap = parseFloat(getComputedStyle(trackRef.current!).gap) || 0;
```

`getComputedStyle().gap` returns the computed pixel value after layout. This means JS and CSS stay in sync automatically — no hardcoding gap values in JS.

### Setting card widths in JavaScript

Cards use `flex: 0 0 auto` and receive their width as an inline `width` style set by `snap()`:

```ts
const slides = Array.from(trackRef.current!.children) as HTMLElement[];
slides.forEach(slide => { slide.style.width = `${cardWidth}px`; });
```

This is done on mount and on every resize.

---

## 5. The loop — maxStep and instant reset (no clones)

### How the loop works

Each time "Show more" is clicked, a `stepCountRef` increments by 1. When `stepCountRef` reaches `maxStep`, the next click resets `stepCountRef` to 0 and snaps the track back to the initial position instantly (no transition).

No card duplication is needed because the loop is not seamless — it snaps. The snap is fast and clear; the user understands the belt has reset.

### Calculating maxStep

`maxStep` is the last step where no empty space appears to the right of the track. Beyond this step, some visible card slots would be empty (no real card exists at that position).

```ts
function getMaxStep(initialOffset: number, step: number): number {
  if (step === 0) return 0;
  const visibleWidth = window.innerWidth - initialOffset;
  const ceilVisible = Math.ceil(visibleWidth / step);
  return Math.max(0, total - ceilVisible);
}
```

**Why `total − ceil(visibleWidth / step)`:** The maximum useful step is the one where the rightmost visible card is the last real card. Beyond that, empty viewport would be visible.

Example: 5 testimonials, 2.5 visible at desktop (initial offset ~300px, viewport 1440px):
- visibleWidth ≈ 1140px, step ≈ 456px (for 2.5 fit)
- ceilVisible = ceil(1140 / 456) = ceil(2.5) = 3
- maxStep = 5 − 3 = 2

At step 2: cards 3, 4, partial 5. All 5 cards have appeared in the visible window. Clicking resets. ✓

`maxStep` is recalculated in `snap()` and stored in `maxStepRef` so `advance()` can read it without re-measuring the DOM on every click.

---

## 6. State and refs

```ts
// React state (drives re-renders)
const [isTransitioning, setIsTransitioning] = useState(false);  // disables button
const [livePolite, setLivePolite]           = useState(true);   // controls aria-live

// Refs (DOM manipulation — no re-renders needed)
const trackRef      = useRef<HTMLDivElement>(null);      // CSS transform target
const showMoreRef   = useRef<HTMLButtonElement>(null);   // measures 3fr left edge
const stepCountRef  = useRef(0);                         // how many steps taken
const initialOffsetRef = useRef(0);                     // 3fr column left offset in px
const maxStepRef    = useRef(0);                         // max steps before reset
```

No `currentIndex` state — multiple cards are visible at once and the concept of a single "current" doesn't apply.

---

## 7. Navigation logic

```ts
function advance() {
  if (isTransitioning) return;

  const isAtMax = stepCountRef.current >= maxStepRef.current;

  if (isAtMax) {
    // Instant snap back to initial position
    stepCountRef.current = 0;
    trackRef.current!.style.transition = 'none';
    trackRef.current!.style.transform = `translateX(${initialOffsetRef.current}px)`;
    // No isTransitioning — instant, no transitionEnd to wait for
    return;
  }

  // Normal forward advance
  setIsTransitioning(true);
  setLivePolite(false);

  const step = getStep();   // reads offsetLeft diff from DOM
  const nextStep = stepCountRef.current + 1;
  stepCountRef.current = nextStep;

  trackRef.current!.style.transition = 'transform 0.45s ease-in-out';
  trackRef.current!.style.transform =
    `translateX(${initialOffsetRef.current - nextStep * step}px)`;
}

function handleTransitionEnd(e: React.TransitionEvent<HTMLDivElement>) {
  if (e.propertyName !== 'transform') return;
  setIsTransitioning(false);
  setLivePolite(true);
}
```

`getStep()` reads the pixel distance between the first two card left edges from the DOM, which equals one card-width + one gap:

```ts
function getStep(): number {
  const children = trackRef.current?.children;
  if (!children || children.length < 2) return 0;
  return (children[1] as HTMLElement).offsetLeft
       - (children[0] as HTMLElement).offsetLeft;
}
```

---

## 8. Resize handling — the `snap()` function

On mount and on every resize, `snap()` recalculates everything from the DOM and repositions the track:

```ts
useEffect(() => {
  function snap() {
    const track = trackRef.current;
    const button = showMoreRef.current;
    if (!track || !button) return;

    // 1. Measure the 3fr column left edge
    const initialOffset = button.getBoundingClientRect().left;
    initialOffsetRef.current = initialOffset;

    // 2. Calculate card width and set it on each slide
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const visibleWidth = window.innerWidth - initialOffset;
    const cv = getCardsVisible();                            // breakpoint-aware
    const cardWidth = (visibleWidth - Math.floor(cv) * gap) / cv;
    const slides = Array.from(track.children) as HTMLElement[];
    slides.forEach(slide => { slide.style.width = `${cardWidth}px`; });

    // 3. Calculate step and maxStep (must happen after widths are set)
    const step = cardWidth + gap;
    maxStepRef.current = getMaxStep(initialOffset, step);

    // 4. Clamp stepCount if resize made maxStep smaller
    if (stepCountRef.current > maxStepRef.current) {
      stepCountRef.current = maxStepRef.current;
    }

    // 5. Snap to current logical position
    track.style.transition = 'none';
    track.style.transform =
      `translateX(${initialOffset - stepCountRef.current * step}px)`;
    track.style.visibility = 'visible';
  }

  snap();
  window.addEventListener('resize', snap);
  return () => window.removeEventListener('resize', snap);
}, []);   // runs once — snap() only reads refs and DOM, no React deps
```

`getCardsVisible()` uses `window.matchMedia`:

```ts
function getCardsVisible(): number {
  if (window.matchMedia('(min-width: 1441px)').matches) return 3.5;
  if (window.matchMedia('(min-width: 1025px)').matches) return 2.5;
  if (window.matchMedia('(min-width: 641px)').matches)  return 1.5;
  return 1.2;
}
```

---

## 9. Full DOM structure

```tsx
<section id="testimonials" aria-labelledby="testimonials-heading">

  {/* ── Row 1: Label ─────────────────────────────────────── */}
  <div className={styles.headerRow}>
    <h2 id="testimonials-heading" className={styles.label}>
      Testimonials
    </h2>
    <div aria-hidden="true" />   {/* keeps 3fr column alive in the grid */}
  </div>

  {/* ── Row 2: Full-bleed carousel ───────────────────────── */}
  <div className={styles.trackWrapper}>   {/* overflow: clip */}
    <div
      className={styles.carousel}
      aria-roledescription="carousel"
      aria-label="Testimonials"
      onMouseEnter={() => setLivePolite(true)}
      onFocus={() => setLivePolite(true)}
    >
      <div
        id="testimonials-live"
        className={styles.liveRegion}
        aria-live={livePolite ? 'polite' : 'off'}
        aria-atomic="false"
      >
        <div
          ref={trackRef}
          className={styles.track}
          onTransitionEnd={handleTransitionEnd}
        >
          {testimonials.map((t, i) => (
            <div
              key={t.id}
              className={styles.slide}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${total}`}
            >
              <SlideContent testimonial={t} />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>

  {/* ── Row 3: Controls ──────────────────────────────────── */}
  <div className={styles.controlsRow}>
    <div aria-hidden="true" />   {/* 1fr spacer */}
    <button
      ref={showMoreRef}
      type="button"
      className={styles.showMoreButton}
      aria-label="Show next testimonial"
      aria-controls="testimonials-live"
      disabled={isTransitioning}
      onClick={advance}
    >
      Show more
    </button>
  </div>

  {/* ── Static grid (prefers-reduced-motion only) ────────── */}
  <div className={styles.staticWrapper}>
    <div aria-hidden="true" />   {/* 1fr spacer */}
    <ul className={styles.staticGrid}>
      {testimonials.map((t) => (
        <li key={t.id} className={styles.staticCard}>
          <SlideContent testimonial={t} />
        </li>
      ))}
    </ul>
  </div>

</section>
```

---

## 10. ARIA — W3C APG carousel pattern

This is a **manual, non-auto-rotating** carousel with multiple simultaneous visible cards.

| Element | ARIA |
|---|---|
| `.carousel` div | `aria-roledescription="carousel"`, `aria-label="Testimonials"` |
| `.liveRegion` div | `id="testimonials-live"`, `aria-live="polite"/"off"`, `aria-atomic="false"` |
| Each real slide | `role="group"`, `aria-roledescription="slide"`, `aria-label="N of total"` |
| "Show more" button | `aria-label="Show next testimonial"`, `aria-controls="testimonials-live"` |

No `aria-hidden` on any real slides — all N testimonials remain accessible to screen readers. The track position is a visual-only concern; screen readers navigate the slides by heading/group structure.

`aria-live="off"` during transition prevents mid-animation announcements. Restored to `"polite"` in `handleTransitionEnd`.

---

## 11. prefers-reduced-motion

Both carousel and static grid exist in the DOM. CSS switches which is visible. `display: none` removes elements from the accessibility tree — no extra `aria-hidden` needed.

```css
.staticWrapper { display: none; }   /* default */

@media (prefers-reduced-motion: reduce) {
  .trackWrapper  { display: none; }
  .controlsRow   { display: none; }
  .staticWrapper { display: block; }   /* activates, grid set on .staticGrid */
  .staticGrid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);   /* desktop: 2 col */
    gap: var(--space-4);
  }
}

@media (prefers-reduced-motion: reduce) and (max-width: 1024px) {
  .staticGrid { grid-template-columns: 1fr; }   /* tablet + mobile: 1 col */
}
```

`.staticWrapper` uses the same row grid (1fr spacer + 3fr content) so the cards align with Experience entries. `.headerRow` remains visible in all cases — the label always shows.

---

## 12. CSS key rules

```css
/* ── Section shell ─────────────────────────────────────── */
.section {
  padding-block: var(--space-16);
}

/* ── Shared row grid (label row + controls row) ─────────── */
.headerRow,
.controlsRow,
.staticWrapper {
  max-width: var(--content-max-w);
  margin-inline: auto;
  padding-inline: var(--content-padding);
  display: grid;
  grid-template-columns: 1fr 3fr;
  gap: var(--space-8);
  align-items: start;
}

.label {
  font-size: var(--text-sm);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  padding-top: 0.3em;
}

/* ── Track row ──────────────────────────────────────────── */
.trackWrapper {
  overflow: clip;          /* full-bleed clip without scroll container */
  margin-block: var(--space-6);   /* space above and below track */
}

.track {
  display: flex;
  gap: var(--space-6);     /* desktop gap */
  will-change: transform;
  visibility: hidden;      /* revealed by useEffect after initial snap */
}

@media (max-width: 1024px) {
  .track { gap: var(--space-4); }   /* tablet */
}

@media (max-width: 640px) {
  .track { gap: var(--space-3); }   /* mobile */
}

.slide {
  flex: 0 0 auto;          /* width set per-slide by JS */
  min-width: 0;
  background: var(--color-bg-subtle);
  padding: var(--space-4);
}

/* ── Button ─────────────────────────────────────────────── */
.showMoreButton {
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

/* ── Static grid card ───────────────────────────────────── */
.staticGrid {
  list-style: none;
  padding: 0;
  margin: 0;
}

.staticCard {
  background: var(--color-bg-subtle);
  padding: var(--space-4);
}
```

Slide content typography (`.blockquote`, `.quote`, `.attribution`, etc.) is unchanged from the previous implementation — same classes, same values.

---

## 13. Responsive grid collapse

At ≤ 640px, the 1fr 3fr grid collapses to single-column just like Experience and About. This means the label stacks above the track and the button, rather than sitting side by side.

```css
@media (max-width: 640px) {
  .headerRow,
  .controlsRow,
  .staticWrapper {
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }

  .label {
    padding-top: 0;
  }
}
```

On mobile, the `initialOffset` measurement still works correctly — `showMoreRef.getBoundingClientRect().left` reads whatever left offset the button has at the current viewport width, whether the grid is two-column or one-column. The card sizing formula adapts automatically via `getCardsVisible()` returning `1.2` for mobile.

---

## 14. Edge cases

- **0 testimonials:** `return null` — section renders nothing
- **1 testimonial:** `maxStep = max(0, 1 − ceil(cardsVisible))` = 0 — button still shows but only resets in place. Acceptable; no crash.
- **2 testimonials (small N):** Works, though `maxStep` may be 0 for large viewports (nothing to advance to).
- **Resize during visible state:** `snap()` re-measures, re-sets card widths, re-calculates `maxStep`, and re-positions track. `stepCountRef` is clamped if it exceeds new `maxStep`.
- **Rapid clicking:** button is `disabled` during the 0.45 s transition — not possible to queue multiple advances.
- **Instant reset while `isTransitioning` is true:** impossible — the reset only fires from `advance()`, which checks `isTransitioning` first.

---

## ⚠️ 15. Flags

### Large desktop (> 1440px) requires at least 4 testimonials

At large desktop, 3.5 cards are visible (3 full + partial 4th). If Strapi has fewer than 4 testimonials, the partial slot on the right will be empty on load — the visual affordance "there's more" won't exist. `maxStep` will also be 0 or 1, making the conveyor belt nearly static.

**Action required:** ensure at least 4 testimonials are published in Strapi before this section goes live at large desktop widths.

### `maxStep` can be 0 for small testimonial sets at large viewports

With 3 testimonials and large desktop (3.5 visible), `maxStep = 3 − 4 = −1 → max(0, −1) = 0`. The button still renders and still shows, but clicking it only resets in place (instant snap to step 0 with no visible change, since we're already at step 0). The button never does anything visible.

This is a graceful degradation — no crash, no hidden state — but worth knowing. Adding more testimonials to Strapi is the fix.

---

## Files changed

| File | Action |
|---|---|
| `src/components/Testimonials/Testimonials.tsx` | Full rewrite |
| `src/components/Testimonials/Testimonials.module.css` | Full rewrite |

No changes to `types.ts`, `strapi.ts`, `page.tsx`, or any other file.
