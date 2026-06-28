# Plan: Design Tokens & Dark Mode

## What this covers

0. Install `@radix-ui/react-icons`
1. Create `src/styles/tokens.css` — single source of truth for all design tokens
2. Update `globals.css` — remove old token block, update references to new names
3. Update `layout.tsx` — swap Geist fonts for Playfair Display + Inter, import tokens, add theme-init script
4. Create `ThemeToggle` Client Component — handles localStorage persistence and DOM update
5. Update `Nav.tsx` — render `<ThemeToggle />` alongside the links
6. Update `Nav.module.css` and `Hero.module.css` — migrate to new token names

---

## Why this order

Tokens first, then fonts, then the toggle. The toggle depends on the `[data-theme="dark"]` selector in `tokens.css` — if you wire the toggle before defining dark mode colors, switching to dark just shows unstyled content. Getting tokens right first means the dark mode snap is instant and correct from the first test.

---

## Step 0 — Install `@radix-ui/react-icons`

```bash
npm install @radix-ui/react-icons
```

**What it is:** The official companion icon library from the Radix team. A collection of clean, minimal SVG icons distributed as React components. Completely separate from Radix UI primitives (those are `@radix-ui/react-*` component packages). Tree-shakeable — the bundle only includes icons you actually import.

**Why now:** `SunIcon` and `MoonIcon` are exactly what we need for the toggle. Adding it now also means consistent icons are available for the rest of the build (social links, arrows, etc.).

---

## Step 1 — Create `src/styles/tokens.css`

All CSS custom properties live here and nowhere else. `globals.css` will `@import` this file so every other stylesheet picks up the tokens.

**Colors — light (`:root`) and dark (`[data-theme="dark"]`)**
**Typography** — renamed from `--font-size-*` to `--text-*`
**Spacing** — changed from base-4 (0.25rem steps) to base-8 (0.5rem steps)
**Layout, shape** — same names, adjusted values

New token `--color-on-accent`: text colour when sitting on an accent-coloured background. In light mode: near-white (`#F8F7F4`); in dark mode: near-black (`#141414`). This replaces the hardcoded `#ffffff` in `globals.css` and `Hero.module.css`.

---

## Step 2 — Update `globals.css`

- Add `@import '../styles/tokens.css';` at the top
- Remove the existing `:root { }` block entirely (it moves to `tokens.css`)
- Rename token references: `--font-size-sm` → `--text-sm`, `--font-size-base` → `--text-base`
- Fix `skip-link`: `color: #ffffff` → `color: var(--color-on-accent)`
- Update `body` `font-family` to reference `--font-body` (set in layout.tsx)

Everything else (reset, focus ring, `.sr-only`) stays as-is.

---

## Step 3 — Update `layout.tsx`

**Swap fonts.** Remove `Geist` and `Geist_Mono`. Add `Playfair_Display` and `Inter`:

```tsx
import { Playfair_Display, Inter } from "next/font/google";

const playfair = Playfair_Display({ variable: "--font-display", subsets: ["latin"] });
const inter = Inter({ variable: "--font-body", subsets: ["latin"] });
```

Apply both variables on `<html className={`${playfair.variable} ${inter.variable}`}>`.

Now `var(--font-display)` (Playfair Display) and `var(--font-body)` (Inter) are available everywhere.

**Add theme-init script** in `<head>` to prevent flash of wrong theme on reload:

```tsx
<script dangerouslySetInnerHTML={{ __html: `
  (function() {
    try {
      var t = localStorage.getItem('theme');
      if (t === 'dark') document.documentElement.dataset.theme = 'dark';
    } catch(e) {}
  })();
`}} />
```

**Why this script?** Without it, a user who previously chose dark mode sees the page flash light for a fraction of a second before JS runs and corrects it. This script runs synchronously before any content renders — by the time the first pixel is painted, `data-theme="dark"` is already on `<html>`. The `try/catch` handles browsers with localStorage disabled (e.g. some private browsing modes). `dangerouslySetInnerHTML` is safe here because the string is entirely static — no user input is involved.

---

## Step 4 — Create `ThemeToggle` Client Component

**Files:** `src/components/ThemeToggle/ThemeToggle.tsx` + `ThemeToggle.module.css`

Must be `"use client"` — uses `localStorage`, `document`, and `useState`. Server Components can't access browser APIs.

Logic:
- On mount (`useEffect`): read `localStorage.getItem('theme')`, set state. Default `'light'`.
- Toggle: flip state, write to `localStorage`, set `document.documentElement.dataset.theme`.
- Render: `<button>` with `SunIcon` (light mode) or `MoonIcon` (dark mode) from `@radix-ui/react-icons`.
- `aria-label` updates dynamically: `"Switch to dark mode"` / `"Switch to light mode"`.

---

## Step 5 — Update `Nav.tsx`

`Nav.tsx` stays a Server Component — Server Components can render Client Components as children (a core Next.js pattern). Just add `<ThemeToggle />` to the right of the nav links inside the existing flex row.

---

## Step 6 — Update `Nav.module.css` and `Hero.module.css`

Token name migration (mechanical find-and-replace):

| Old | New |
|---|---|
| `--font-size-xs` | `--text-xs` |
| `--font-size-sm` | `--text-sm` |
| `--font-size-base` | `--text-base` |
| `--font-size-lg` | `--text-lg` |
| `--font-size-xl` | `--text-xl` |
| `--font-size-2xl` | `--text-2xl` |
| `--font-size-3xl` | `--text-3xl` |
| `--font-size-4xl` | `--text-4xl` |
| `--space-24` (Hero only) | `--space-16` |

`Hero.module.css` also: `color: #ffffff` on `.btnPrimary` → `color: var(--color-on-accent)`.

The visual result should be nearly identical. Base-8 spacing is slightly more generous than the old base-4 scale, which aligns with the editorial, generous-whitespace direction.

---

## Hardcoded color violations fixed in this plan

| File | Selector | Old | New |
|---|---|---|---|
| `globals.css` | `.skip-link` | `color: #ffffff` | `color: var(--color-on-accent)` |
| `Hero.module.css` | `.btnPrimary` | `color: #ffffff` | `color: var(--color-on-accent)` |

---

## Files changed

| File | Action |
|---|---|
| `src/styles/tokens.css` | Create |
| `src/app/globals.css` | Update |
| `src/app/layout.tsx` | Update |
| `src/components/ThemeToggle/ThemeToggle.tsx` | Create |
| `src/components/ThemeToggle/ThemeToggle.module.css` | Create |
| `src/components/Nav/Nav.tsx` | Update |
| `src/components/Nav/Nav.module.css` | Update |
| `src/components/Hero/Hero.module.css` | Update |

New dependency: `@radix-ui/react-icons`
