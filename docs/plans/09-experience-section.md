# Plan: Experience Section

**Status:** Awaiting approval

---

## What we're building

An `Experience` component below `About` that renders work history from Strapi. Dates are now stored as `YYYY-MM` (after the fix-dates script runs) and displayed as `"August 2018"` in the UI using `Intl.DateTimeFormat`.

---

## Data

`getExperiences()` already exists in `strapi.ts`. Two small changes needed before building the component:

1. **Add a sort parameter** so entries come back most-recent-first:
   ```
   /api/experiences?populate=*&sort=StartDate:desc
   ```
2. **Update `page.tsx`** to fetch profile and experiences in parallel using `Promise.all`. Right now both fetches would run sequentially (profile first, then experiences). Parallel fetching fires both requests simultaneously — on a slow server this roughly halves the wait:
   ```ts
   const [profile, experiences] = await Promise.all([
     getProfile(),
     getExperiences(),
   ]);
   ```

---

## Layout

Two-column grid on desktop — consistent with the About section. Section label on the left, list of entries on the right.

```
┌──────────────────────────────────────────────────────────────┐
│  Experience     Acme Corp                     2021 – Present │
│                 Senior Designer                              │
│                 London                                       │
│                                                              │
│                 Led end-to-end product design for...         │
│                                                              │
│                 ┌─────────┐  ┌─────────┐                    │
│                 │  Figma  │  │  React  │                    │
│                 └─────────┘  └─────────┘                    │
│                 ───────────────────────────────────────────  │
│                 Previous Corp                     2018–2021  │
│                 ...                                          │
└──────────────────────────────────────────────────────────────┘
```

On mobile: single column, label stacks above entries.

---

## Entry structure

Each experience is an `<article>` element — semantically correct for a self-contained, independently meaningful unit. Screen readers expose `<article>` as a landmark navigable via the Articles rotor.

```
<article>
  <header>
    <div>
      <p>  Company name  (prominent)  </p>
      <p>  Role          (muted)       </p>
      <p>  Location      (small, muted)</p>
    </div>
    <p>  Date range    (muted, right-aligned on desktop) </p>
  </header>
  <div>  Responsibilities paragraphs  </div>
  <ul>   Badges (if any)              </ul>
</article>
```

Entries are separated by a `1px` rule using `var(--color-border)`.

---

## `formatDate()` helper

Lives inside `Experience.tsx`. Takes a `YYYY-MM` string and returns the long-form month and year. Uses `Intl.DateTimeFormat` — no date library needed, no formatting code to maintain.

```ts
function formatDate(value: string | null): string {
  if (!value) return 'Present';
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' })
    .format(new Date(year, month - 1));
}
```

Why `en-GB`? It formats as `"August 2018"` (month year) — no comma, natural reading order. `en-US` would produce the same output for this format option, so either works; `en-GB` is a reasonable default for an internationally-readable portfolio.

Why `month - 1`? JavaScript's `Date` constructor takes months 0-indexed (January = 0). `YYYY-MM` stores them 1-indexed, so we subtract 1.

Date range display:
```
formatDate("2021-03")  →  "March 2021"
formatDate(null)        →  "Present"

// Rendered as:
"March 2021 – Present"
"August 2018 – February 2021"
```

---

## Badges

The `Badge` type has `Label` and `Color` fields. `Color` is a free-text string in Strapi with no guaranteed format. We render all badges in a neutral style — muted text, `var(--color-border)` border, no fill, no border-radius (square corners, matching the editorial button style). The `Color` field is ignored for now.

Each badge is a `<li>` inside a `<ul>` with `list-style: none`. The `<ul>` is visually hidden if the array is empty (handled by a conditional render).

---

## Responsibilities

Plain text from Strapi, split on `\n\n` for paragraphs — same pattern as About. Each paragraph is a `<p>`. If `Responsibilities` is null the block is omitted.

---

## Typography

| Element | Token |
|---|---|
| Section label `<h2>` | `--text-sm`, uppercase, `letter-spacing: 0.08em`, `color: var(--color-text-muted)` — identical to About |
| Company name | `--text-base`, `font-weight: 600`, `color: var(--color-text)` |
| Role | `--text-sm`, `color: var(--color-text-muted)` |
| Location | `--text-sm`, `color: var(--color-text-muted)` |
| Date range | `--text-sm`, `color: var(--color-text-muted)` |
| Responsibilities | `--text-base`, `line-height: 1.7`, `color: var(--color-text)` |
| Badges | `--text-xs`, `color: var(--color-text-muted)` |

---

## Heading hierarchy

```
<h1>  hero name            (Hero)
<h2>  "About"              (About)
<h2>  "Experience"         (Experience — sibling section, same level is correct)
```

---

## Accessibility checklist

- [ ] `<section id="experience">` with `aria-labelledby="experience-heading"`
- [ ] `<h2 id="experience-heading">` as section label
- [ ] Each `<article>` has company + role visible as text (no icon-only identification)
- [ ] Date range is plain readable text
- [ ] Badges are text labels — not color-coded in a way that conveys information
- [ ] Contrast passes WCAG AA in light and dark mode
- [ ] No hardcoded colors — all `var(--color-*)`
- [ ] No `outline: none`

---

## Files to create / modify

| File | Action | Notes |
|---|---|---|
| `src/lib/strapi.ts` | Modify | Add `&sort=StartDate:desc` to `getExperiences()` |
| `src/components/Experience/Experience.tsx` | Create | Component + `formatDate()` helper |
| `src/components/Experience/Experience.module.css` | Create | Layout, typography, badges |
| `src/app/page.tsx` | Modify | `Promise.all`, import, render `<Experience>` |

---

## Step sequence (one file at a time, wait for approval between each)

1. `src/lib/strapi.ts` — add sort param
2. `src/components/Experience/Experience.tsx`
3. `src/components/Experience/Experience.module.css`
4. `src/app/page.tsx` — `Promise.all` + render
