# Portfolio Refurbish — Claude Code Instructions

---

## Global Rules (apply to every session, every task)
1. **Always read this file before doing anything else.**
2. **Always show a plan before writing any code.** Save every plan to `docs/plans/` as a markdown file using the task name e.g. `docs/plans/data-fetching.md`. Wait for explicit approval before proceeding.
3. **Explain what you're doing in plain language.** Not just what the code does, but why it's structured that way. Treat every non-obvious decision as a teaching moment.
4. **One step at a time.** Don't chain multiple major changes together. Complete one thing, let Shannon review it, then move on.
5. **Ask before installing dependencies.** Explain what the package does and why we need it before adding it.
6. **Never touch git.** Shannon handles all commits and pushes.
7. **Never run git commands** — not even `git status`.

---

## Who I am
I'm Shannon. I have prior coding experience but have been away from active development for a couple of years. I'm intentionally working at the edge of my current competency — this project is both a deliverable and a learning exercise. Plain-language explanations alongside technical steps are essential, not optional.

---

## The stack
- **Framework:** Next.js (App Router)
- **Components:** Radix UI primitives (unstyled, accessible)
- **Styling:** CSS Modules
- **CMS:** Strapi (local development, hosted on Hetzner VPS in production)
- **Database:** PostgreSQL (local Homebrew instance for development)
- **CI/CD:** GitHub Actions — to be set up later when ready to deploy
- **Hosting:** Hetzner VPS — to be set up later as a separate learning phase
- **Accessibility:** Non-negotiable. Semantic HTML, ARIA attributes, keyboard navigation, and visible focus states on everything.

---

## Local development setup
```
Next.js     → localhost:3000
Strapi      → localhost:1337
PostgreSQL  → local Homebrew instance
```
Everything runs locally for now. No deployment configuration until the site is ready.

---

## Hard rules
- `build/` and `build.zip` must never be committed — they are in `.gitignore`
- `.claude/` must NOT be in `.gitignore` — this is where custom agents live
- No inline styles — all styling goes in CSS Modules
- No `any` TypeScript types
- Accessibility audit every component before marking it done
- No Chakra UI or Bootstrap references — those are gone entirely
- No pure `#000000` or `#FFFFFF` — always use CSS custom property tokens
- No hardcoded colors anywhere — always `var(--color-*)` 
- No `outline: none` — ever
- No fixed pixel font sizes — always `rem`

---

## Current status
Hero section built and connected to Strapi. Design tokens and dark mode are the next step.
The old React app lives in `_reference/` — for content reference only, not code patterns.

---

## Content model (Strapi v5)

### API response format
Strapi v5 returns flat objects — no `data.attributes` wrapper:
```json
{ "data": { "id": 1, "documentId": "abc123", "Name": "...", ... }, "meta": {} }
```
For collections, `data` is an array of flat objects. Field names are PascalCase throughout.

### Project (Collection Type)
One unified type for all projects. `Featured` controls display position.

| Field | Type | Notes |
|---|---|---|
| `Name` | string | required |
| `Description` | text | |
| `Featured` | boolean | true = large card at top |
| `Image` | media | single image |
| `Year` | enumeration | `y2010`–`y2030` |
| `Tags` | component, single | `{ Development, Design, Collaboration, Other: boolean; Collaborators: string }` |
| `Badge` | component, repeatable | `{ Label: string, Color: string }` |
| `Button` | component, single | `{ Label: string, URL: string }` |

### Experience (Collection Type)

| Field | Type |
|---|---|
| `Company` | string |
| `Role` | string |
| `StartDate` | string |
| `EndDate` | string |
| `Location` | string |
| `Responsibilities` | text |
| `Badges` | component, repeatable: `{ Label: string, Color: string }` |

### Profile (Single Type)

| Field | Type |
|---|---|
| `Name` | string |
| `Role` | string |
| `Tagline` | string |
| `About` | text |
| `Email` | email |
| `Github` | component, single: `{ URL: string }` |
| `LinkedIn` | component, single: `{ URL: string }` |
| `Logo` | component, single: `{ Label: string, Logo: media }` |
| `Availability` | component, repeatable: `{ openToWork, freelanceAvailable, notAvailable: boolean }` |

---

## Design System

### Visual direction
Reference: https://www.christina-lu.com/
Quiet, editorial, typographically confident. The work carries the visual interest — the layout stays out of the way. Left-aligned throughout, generous whitespace, restrained color.

### Color tokens
All colors defined as CSS custom properties in `src/styles/tokens.css`.
Light and dark mode both required from the start.

```css
/* Light mode — default */
:root {
  --color-bg:         #F8F7F4;
  --color-bg-subtle:  #F0EEE9;
  --color-text:       #1A1A1A;
  --color-text-muted: #6B6B6B;
  --color-border:     #E2E0DA;
  --color-accent:     #2D5BE3;
}

/* Dark mode */
[data-theme="dark"] {
  --color-bg:         #141414;
  --color-bg-subtle:  #1E1E1E;
  --color-text:       #F0EEE9;
  --color-text-muted: #9A9A9A;
  --color-border:     #2E2E2E;
  --color-accent:     #6B8FF0;
}
```

All combinations must meet WCAG AA contrast (4.5:1 for text, 3:1 for UI components).

### Typography
- **Display/headings:** Playfair Display (Google Fonts, via `next/font/google`)
- **Body:** Inter (Google Fonts, via `next/font/google`)

```css
--text-xs:   0.75rem;    /* 12px — labels, badges */
--text-sm:   0.875rem;   /* 14px — meta, captions */
--text-base: 1rem;       /* 16px — body */
--text-lg:   1.25rem;    /* 20px — lead text */
--text-xl:   1.5rem;     /* 24px — small headings */
--text-2xl:  2rem;       /* 32px — section headings */
--text-3xl:  2.75rem;    /* 44px — hero role/tagline */
--text-4xl:  4rem;       /* 64px — hero name */
```

Hero name: Playfair Display at `--text-4xl`. Everything else: Inter.

### Spacing (base-8 scale)
```css
--space-1:  0.5rem;   /*  8px */
--space-2:  1rem;     /* 16px */
--space-3:  1.5rem;   /* 24px */
--space-4:  2rem;     /* 32px */
--space-6:  3rem;     /* 48px */
--space-8:  4rem;     /* 64px */
--space-12: 6rem;     /* 96px */
--space-16: 8rem;     /* 128px */
```

Section padding: `--space-16` top and bottom minimum.
Content max-width: `1100px`, centered, with `--space-4` side padding.

### Dark mode implementation
- Toggle a `data-theme="dark"` attribute on `<html>` via a button in the nav
- Persist preference in `localStorage`
- Toggle button must be keyboard accessible with a descriptive `aria-label`

### Radix UI compatibility
Style Radix components via data attributes — never override their internals:
```css
[data-state="open"] { ... }
[data-state="closed"] { ... }
[data-highlighted] { ... }
```
Never override Radix focus management. Use `--color-accent` for all focus rings:
```css
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```