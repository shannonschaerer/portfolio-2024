# Plan: About Section

**Status:** Awaiting approval

---

## What we're building

A new `About` component that sits below the Hero on the home page and displays the `profile.About` bio text fetched from Strapi.

---

## Data

No new Strapi fetch required. `getProfile()` is already called in `page.tsx` and the `Profile` type already has `About: string | null`. We'll pass the same `profile` object (or just `profile.About`) to `About` alongside `Hero`.

**Why not a separate fetch?** The profile is a single type in Strapi — one request covers everything. Fetching it a second time for `About` would be redundant and add latency.

---

## Layout decision: two-column editorial

On desktop: a narrow label column on the left (~25% width), bio text in a wider content column on the right (~75%). This matches the quiet, editorial feel of the reference design (christina-lu.com) and is a common typographic convention for editorial/portfolio sites.

On mobile: the two columns stack vertically — label above, text below.

```
┌────────────────────────────────────────────────┐
│  About          Lorem ipsum dolor sit amet,    │
│                 consectetur adipiscing elit.   │
│                                                │
│                 Sed do eiusmod tempor.         │
└────────────────────────────────────────────────┘
```

---

## Heading hierarchy

The Hero `<h1>` is the profile name. The About section needs a navigable landmark for keyboard and screen-reader users. We'll use a real `<h2>` styled to look like the small uppercase label — no hidden heading tricks needed, just careful styling.

```
<section aria-labelledby="about-heading">
  <h2 id="about-heading">About</h2>   ← styled as small uppercase label
  <div>...paragraphs...</div>
</section>
```

---

## Multi-paragraph handling

Strapi's text field stores plain text with `\n` newlines. The `About` field likely contains multiple paragraphs separated by `\n\n`. We'll split on double newlines and render each chunk as its own `<p>` element — no `dangerouslySetInnerHTML` needed.

```tsx
profile.About?.split('\n\n').map((para, i) => <p key={i}>{para}</p>)
```

Single newlines within a paragraph are collapsed (standard HTML behavior), which is fine for prose.

---

## Typography

| Element | Token |
|---|---|
| Section label (`<h2>`) | `--text-sm`, uppercase, `letter-spacing: 0.08em`, `color: var(--color-text-muted)` |
| Bio paragraphs | `--text-lg` (20px), `line-height: 1.7`, `color: var(--color-text)` |
| Max-width on text | `60ch` — prevents very long lines on wide screens |

The larger `--text-lg` for body copy here (vs `--text-base` for normal UI text) is intentional — this is primary content, not a UI element.

---

## Accessibility checklist (before marking done)

- [ ] `<section>` has `aria-labelledby` pointing to the `<h2>` id
- [ ] Heading hierarchy is correct (`<h2>` follows `<h1>` in Hero)
- [ ] Text/background contrast meets WCAG AA in both light and dark mode
- [ ] Renders correctly with screen reader (VoiceOver on Mac)
- [ ] No `outline: none`
- [ ] No hardcoded colors — all `var(--color-*)`

---

## Files to create / modify

| File | Action |
|---|---|
| `src/components/About/About.tsx` | Create |
| `src/components/About/About.module.css` | Create |
| `src/app/page.tsx` | Modify — import and render `<About>` below `<Hero>` |

No changes to `src/lib/strapi.ts` or `src/lib/types.ts`.

---

## What we're NOT doing (and why)

- **No avatar/photo** — that's a later enhancement, not part of this section's scope
- **No CTA buttons** — the Hero already has those; repeating them here adds noise
- **No rich text rendering** — the Strapi field is plain text, not markdown or rich text
- **No new dependencies** — everything needed is already in the project

---

## Step sequence (once approved)

1. Create `About.tsx` with the two-column layout and paragraph splitting
2. Create `About.module.css` with layout, typography, and responsive styles
3. Update `page.tsx` to render `<About>` below `<Hero>`
4. Accessibility check
