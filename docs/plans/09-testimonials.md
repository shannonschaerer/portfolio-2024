# Plan: Testimonials Section

**Branch:** feature/personalisation  
**Date:** 2026-06-29

---

## Overview

Add a Testimonials section to the portfolio that pulls quote data from Strapi and renders it as an accessible horizontal scroll track. Four discrete steps, one at a time, each reviewed before proceeding.

---

## Step 1 — Strapi content type (manual, in your admin UI)

This step cannot be automated — you create the content type directly in the Strapi admin at `localhost:1337/admin`.

**Content Type name:** `Testimonial` (Collection Type, plural API ID: `testimonials`)

**Fields to add, in order:**

| Field name | Field type | Notes |
|---|---|---|
| `Quote` | Long text | English version |
| `QuoteOriginal` | Long text | German original |
| `Translated` | Boolean | Default: false |
| `Author` | Short text | Person's full name |
| `Company` | Short text | Organisation name |
| `Role` | Short text | Their job title |
| `Year` | Short text | e.g. "2023" |
| `Order` | Number | Integer; controls display sequence |

After saving, Strapi generates a REST endpoint at `/api/testimonials`.

---

## Step 2 — TypeScript type + fetch function

**File: `src/lib/types.ts`**

Add a new `Testimonial` type at the bottom of the file:

```ts
export type Testimonial = {
  id: number;
  documentId: string;
  Quote: string | null;
  QuoteOriginal: string | null;
  Translated: boolean | null;
  Author: string | null;
  Company: string | null;
  Role: string | null;
  Year: string | null;
  Order: number | null;
};
```

**File: `src/lib/strapi.ts`**

Add `Testimonial` to the import line, then add the fetch function:

```ts
export async function getTestimonials(): Promise<Testimonial[]> {
  const res = await fetchStrapi<StrapiCollection<Testimonial>>(
    '/api/testimonials?sort=Order:asc'
  );
  return res.data;
}
```

Sort ascending on `Order` so the sequence you define in Strapi controls what the user reads left-to-right.

---

## Step 3 — Testimonials component

Two new files:

- `src/components/Testimonials/Testimonials.tsx`
- `src/components/Testimonials/Testimonials.module.css`

### HTML structure

```
<section id="testimonials" aria-labelledby="testimonials-heading">
  <div class="inner">
    <h2 id="testimonials-heading" class="label">Testimonials</h2>
    <div class="scrollWrapper">
      <ul
        class="track"
        tabindex="0"
        aria-label="Testimonials — scroll to see more"
      >
        {testimonials.map(t => (
          <li key={t.id} class="card" tabindex="0">
            <blockquote>
              <p class="quote">{t.Quote}</p>
              {t.Translated && (
                <p class="translationNote" aria-label="Translation note">
                  Originally in German
                </p>
              )}
              <footer class="attribution">
                <cite class="author">{t.Author}</cite>
                <span class="attribution-detail">{t.Role}, {t.Company}</span>
                <span class="year">{t.Year}</span>
              </footer>
            </blockquote>
          </li>
        ))}
      </ul>
      <div class="fadeHint" aria-hidden="true" />
    </div>
  </div>
</section>
```

### Accessibility decisions

- **`<section>` with `aria-labelledby`** — makes it a named landmark region, so screen reader users can jump to it by landmark navigation.
- **`<ul>` + `<li>`** — correct semantic list; screen readers announce "list of N items".
- **`tabindex="0"` on the `<ul>` (scroll container)** — allows keyboard users to Tab into the list and then use **Arrow Left / Arrow Right** to scroll horizontally. Without this, keyboard-only users have no way to scroll; the overflow content is invisible to them.
- **`tabindex="0"` on each `<li>` (card)** — allows Tab to move through individual cards in sequence. When a card receives focus, the browser scrolls it into view automatically. This gives two modes: arrow-key scrolling (grab the track) or tab-through-cards.
- **`<blockquote>` + `<footer>` + `<cite>`** — correct semantic HTML for attributed quotes. `<cite>` wraps the person's name as the citation source.
- **`aria-hidden="true"` on the fade div** — it's a pure visual hint, not content; hidden from screen readers.

### CSS decisions

**Scroll behaviour:**
- `.track` gets `display: flex`, `overflow-x: auto`, `scroll-snap-type: x mandatory`, `gap`, `padding-block` for shadow room, and `scrollbar-width: none` (hides the OS scrollbar — the fade hint is the affordance instead).
- Each `.card` gets `scroll-snap-align: start` and a fixed `width` (e.g. `clamp(280px, 60vw, 420px)`) with `flex-shrink: 0`. This ensures cards don't compress and the snap behaviour makes scrolling feel deliberate.
- `-webkit-overflow-scrolling: touch` for smooth momentum scrolling on iOS.

**Fade hint:**
- `.fadeHint` is `position: absolute`, anchored to the right of `.scrollWrapper` (which is `position: relative; overflow: hidden`).
- Background: `linear-gradient(to right, transparent, var(--color-bg))` — matches the page background so it blends, regardless of theme. Width roughly `80px`.
- Disappears at 640px breakpoint since mobile users expect swipe and the fade is already obvious.

**Typography:**
- `.quote` — Playfair Display, `var(--text-lg)`, italic, `line-height: 1.6`. No decorative quote marks added via CSS to avoid double-announcing with screen readers; the `<blockquote>` element is the semantic signal.
- `.author` — DM Sans, `var(--text-base)`, weight 600, `font-style: normal` (overrides inherited italic from `<cite>`).
- `.attribution-detail`, `.year` — DM Sans, `var(--text-sm)`, `var(--color-text-muted)`.
- `.translationNote` — DM Sans, `var(--text-xs)`, `var(--color-text-muted)`, light italic, small top margin.

**Card:**
- No border radius (editorial rule).
- `background: var(--color-bg-subtle)` for subtle separation from page background.
- `padding: var(--space-4)`.
- No box shadow — the design is restrained.

**Section label:**
- Matches the "Experience" label: `var(--text-sm)`, uppercase, letter-spaced, `var(--color-text-muted)`.

**Layout:**
- Same two-column grid as Experience: `1fr 3fr`, with label on the left. On mobile collapses to single column.
- The scroll track spans the right column, not the full width.

---

## Step 4 — Wire up in page.tsx

Add `getTestimonials` to the import and the `Promise.all`. Render `<Testimonials>` after `<Experience>`.

```tsx
import { getProfile, getExperiences, getTestimonials } from '@/lib/strapi';
import Testimonials from '@/components/Testimonials/Testimonials';

// Inside Home():
const [profile, experiences, testimonials] = await Promise.all([
  getProfile(),
  getExperiences(),
  getTestimonials(),
]);

// In JSX:
<Experience experiences={experiences} />
<Testimonials testimonials={testimonials} />
```

`Testimonials` returns `null` if the array is empty, so the section simply doesn't appear until you add content in Strapi.

---

## Accessibility checklist (to run after build)

- [ ] Correct semantic HTML: `<section>`, `<ul>`, `<li>`, `<blockquote>`, `<cite>`
- [ ] Heading hierarchy unbroken (h2, following h1 in Hero)
- [ ] Named landmark: `aria-labelledby="testimonials-heading"`
- [ ] Keyboard: Tab reaches the scroll track; arrow keys scroll it; Tab through cards brings each into view
- [ ] Focus ring visible on both scroll track and individual cards
- [ ] `aria-hidden` on decorative fade element
- [ ] "Originally in German" note readable by screen reader (it's real text, not CSS content)
- [ ] Contrast passes in both light and dark mode
- [ ] Fade hint hidden on mobile (no confusion about meaning)
- [ ] Test with VoiceOver: headings and list count announced correctly

---

## Files changed

| File | Action |
|---|---|
| Strapi admin | Manual: create Testimonial content type |
| `src/lib/types.ts` | Add `Testimonial` type |
| `src/lib/strapi.ts` | Add `getTestimonials()` |
| `src/components/Testimonials/Testimonials.tsx` | Create |
| `src/components/Testimonials/Testimonials.module.css` | Create |
| `src/app/page.tsx` | Add fetch + render |

---

## Questions / decisions deferred until approval

1. **Card width** — `clamp(280px, 60vw, 420px)` is my starting point; happy to adjust once we see it in the browser.
2. **Scrollbar visibility** — hiding the OS scrollbar and relying on the fade hint is the current plan. If you want the scrollbar visible as a stronger affordance, we can keep it (just remove `scrollbar-width: none`).
3. **Quote marks** — no decorative `"..."` in CSS, relying on `<blockquote>` semantics. If you want the large typographic quotation mark as a visual element, we can add it via `::before` on `.quote` with `aria-hidden` on a wrapper span.
