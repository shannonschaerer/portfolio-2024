# Plan: Experience "Show more / Show less" Toggle

**Status:** Awaiting approval

---

## What we're building

A show/hide toggle on the Experience section: 4 entries visible by default, a button below reveals the rest. Because this requires `useState`, the entry list must become a Client Component — but only the interactive part, not the whole section.

---

## Architecture: push the Client boundary as deep as possible

The `<section>` wrapper and `<h2>` label in `Experience.tsx` don't need any JavaScript. In Next.js App Router, a good rule is to keep Server Components as far up the tree as possible and only mark the minimum subtree as `"use client"`.

```
Experience.tsx          — Server Component (stays as-is)
  └── ExperienceList.tsx  — NEW Client Component ("use client")
```

`Experience.tsx` delegates the list to `ExperienceList`, passing the full `experiences` array as a prop. `ExperienceList` owns the toggle state and renders the entries and button.

**Why not just add `"use client"` to `Experience.tsx` itself?**
It would work, but it unnecessarily ships the section's static wrapper markup as interactive JavaScript. Splitting keeps the Server/Client boundary clean.

---

## What moves where

| Responsibility | Currently in | Moving to |
|---|---|---|
| `<section>`, `<h2>` | `Experience.tsx` | Stays in `Experience.tsx` |
| `formatDate()` helper | `Experience.tsx` | Moves to `ExperienceList.tsx` (only the list needs it) |
| Entry rendering (`<article>`) | `Experience.tsx` | Moves to `ExperienceList.tsx` |
| Toggle state + button | — | New, in `ExperienceList.tsx` |

---

## Toggle behaviour

- Default: first 4 entries visible, remainder hidden
- Button click: all entries visible, button label updates
- Button click again: collapse back to 4, button label updates
- If there are 4 or fewer entries total: no button renders at all

Collapsed count is always `Math.max(0, experiences.length - 4)`.

---

## Accessibility

### `hidden` attribute — not CSS

Hidden entries use the HTML `hidden` attribute, not `display: none` via CSS. The difference matters:

- `hidden` removes the element from the accessibility tree entirely — screen readers skip it, keyboard focus can't reach it
- CSS `display: none` is visually equivalent but some screen readers can still navigate to the element depending on how it's hidden

In JSX: `hidden={!expanded && i >= 4}` — React adds the `hidden` attribute when the expression is `true`, removes it when `false`.

### `aria-expanded` on the button

```tsx
<button
  type="button"
  aria-expanded={expanded}
  onClick={() => setExpanded(e => !e)}
>
```

`aria-expanded={false}` tells screen readers the controlled region is collapsed. `aria-expanded={true}` tells them it's expanded. This is the correct pattern for a disclosure widget.

### Button label — visible text vs. accessible name

Visible text is terse:
```
Collapsed:  "Show more"
Expanded:   "Show less"
```

`aria-label` carries the full context for screen readers:
```
Collapsed:  "Show 8 more experience entries"
Expanded:   "Show fewer experience entries"
```

Singular handled in `aria-label`: `"Show 1 more experience entry"` (not "entries").

Splitting visible and accessible label this way keeps the visual UI clean while giving screen reader users the count and domain context they need — they can't glance at the surrounding heading to know what "Show more" refers to.

---

## Button styling

Matches the secondary button style from the Hero — the editorial aesthetic already established:

```css
border: 1px solid var(--color-text);
background-color: transparent;
color: var(--color-text);
border-radius: 0;               /* square corners — no radius */
padding: var(--space-1) var(--space-3);
font-size: var(--text-base);
font-weight: 500;
```

Hover: background fills to `var(--color-text)`, text flips to `var(--color-bg)` — same inversion used by the Hero's secondary button.

The button style is added to `Experience.module.css` rather than a new file, since it's part of the same component family and `ExperienceList.tsx` will import from that same module.

---

## Files to create / modify

| File | Action |
|---|---|
| `src/components/Experience/ExperienceList.tsx` | Create — Client Component with state, entries, button |
| `src/components/Experience/Experience.tsx` | Modify — remove entry rendering, import ExperienceList |
| `src/components/Experience/Experience.module.css` | Modify — add `.toggleButton` and `.toggleButton:hover` |

No changes to `page.tsx`, `strapi.ts`, or `types.ts`.

---

## Step sequence (one file at a time, wait for approval between each)

1. `Experience.module.css` — add toggle button styles
2. `ExperienceList.tsx` — create Client Component
3. `Experience.tsx` — trim to section wrapper, import ExperienceList
