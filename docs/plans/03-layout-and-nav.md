# Plan: Root Layout + Navigation Shell

## Background
The App Router's layout system works like a picture frame: whatever goes in `layout.tsx`
appears on every page, and `{children}` is where each page's unique content slots in.
The old site was a single-page app — all sections on one page, with scroll-to-section
navigation. We keep that same structure.

---

## Files

| File | Status | What changes |
|---|---|---|
| `src/app/layout.tsx` | Modify | Add `<Nav>`, update metadata, add skip link |
| `src/app/globals.css` | Modify | CSS reset + custom properties |
| `src/components/Nav/Nav.tsx` | Create | The nav component |
| `src/components/Nav/Nav.module.css` | Create | Nav styles |
| `src/config/site.ts` | Create | All hardcoded placeholder values |

No new dependencies needed for this step.

---

## Layout structure

```
layout.tsx
└── <html>
    └── <body>
        ├── <a href="#main">Skip to main content</a>  ← hidden until focused
        ├── <Nav />
        └── <main id="main">
                {children}
            </main>
```

---

## Nav structure

```html
<header>
  <nav aria-label="Main navigation">
    <a href="#hero">SS</a>   ← logo, scrolls to top
    <ul>
      <li><a href="#about">About</a></li>
      <li><a href="#experience">Experience</a></li>
      <li><a href="#projects">Projects</a></li>
      <li><a href="#contact">Contact</a></li>
    </ul>
  </nav>
</header>
```

Real `<a>` elements pointing to anchor IDs — not buttons, not JavaScript scroll handlers.

---

## Accessibility plan

1. **Skip link** — first focusable element, visually hidden until focused (WCAG requirement)
2. **Semantic elements** — `<header>`, `<nav>`, `<ul>/<li>`, `<a>`
3. **`aria-label` on `<nav>`** — distinguishes from other nav elements
4. **Visible focus states** — `:focus-visible` in globals.css, no `outline: none`

---

## What this step does NOT include
- Fetching site name from Strapi (hardcoded placeholder)
- Mobile hamburger menu (Phase 2, needs Radix)
- Any page content
- Footer

---

## Decisions made
- Logo: hardcoded "SS" text for now, proper SVG later
- Nav links: hardcoded in `src/config/site.ts`, not inside the component
- All hardcoded values in one file (`site.ts`) mapped to their future Strapi fields
- Mobile menu deferred to Radix UI phase
