# Plan: Hero Section

## What we're building

A `Hero` component that sits at the top of the home page. It introduces the person — name, role, a short tagline, and two call-to-action links (View Work, Get in Touch). All content will be placeholder text for now; the component will be wired to real `Profile` data in a later step.

## Why a separate component?

The home page will eventually have several sections (Hero, Projects, Experience, Contact). Keeping each as its own component under `src/components/` makes them independently editable and testable rather than one giant page file.

## Files to create or modify

| Action | File | What changes |
|--------|------|--------------|
| Create | `src/components/Hero/Hero.tsx` | The component markup |
| Create | `src/components/Hero/Hero.module.css` | All styling for the section |
| Modify | `src/app/page.tsx` | Import and render `<Hero />` above the placeholder debug output |

## Layout

Left-aligned. Clean, professional, no theatrics.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Jane Doe                         ← h1, large          │
│  Senior Product Designer          ← role, muted text   │
│                                                         │
│  Crafting thoughtful digital      ← tagline, medium    │
│  experiences from Switzerland.                          │
│                                                         │
│  [View Work]  [Get in Touch]      ← two links          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- Full-width section with generous top/bottom padding (accounting for the fixed nav)
- Constrained inner content to `--content-max-w` with `--content-padding` on the sides
- `id="hero"` on the section — the Nav logo already links to `#hero`
- No image for now (the Profile `Logo` field requires a separate image-handling step)

## Accessibility checklist

- `<h1>` for the name — there should be exactly one per page
- The two CTA links will be `<a>` elements (not `<button>`) since they navigate
- Both links get visible `:focus-visible` rings (already handled globally in `globals.css`)
- Section gets `aria-labelledby` pointing to the `<h1>` so screen readers announce the section correctly

## Out of scope

- Wiring to real Strapi data — follow-up step
- Avatar / profile image — needs its own image-serving plan
- Animation or scroll effects — post-MVP
