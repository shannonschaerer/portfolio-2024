# Plan: Featured Projects Section

## Goal
Build the Featured Projects section — data fetching, markup, and styles — matching the
existing 1fr 3fr grid layout used by Experience and About. This session covers featured
projects only; non-featured projects come later.

---

## Files to create

### `src/components/Projects/Projects.tsx`
Server component — no `"use client"` needed because there's no interactivity in this step.

Props: `projects: Project[]` (the full project list, already filtered to `Featured === true`
before being passed in, so this component does not filter internally — filtering happens
in `page.tsx`).

#### Markup structure

```
<section id="projects" aria-labelledby="projects-heading">
  <div class="inner">          ← 1fr 3fr grid
    <h2 id="projects-heading"> ← "PROJECTS" label, same style as Experience label
    <div class="list">         ← stacks vertically in the 3fr column
      <article aria-label="[project name]">
        [image]                ← conditional, only if Image is not null
        <header>
          <span year />        ← Year, muted — e.g. "2024"
          <h3 name />          ← project Name, prominent
        </header>
        [description]          ← conditional
        [badges list]          ← conditional, ul with aria-label="Tags"
        [button]               ← conditional, editorial link style
      </article>
      <hr />                   ← between entries, not after the last one
      ...
    </div>
  </div>
</section>
```

The `<hr>` is placed *between* entries (not after the last), which means we render it
before each entry except the first — `{i > 0 && <hr />}` inside the map.

#### Image handling
- `project.Image` is `StrapiImage | null`. If null → render nothing, no conditional
  wrapper left behind.
- Strapi returns a relative URL (`/uploads/file.jpg`). Prefix with `STRAPI_URL` from
  `process.env.STRAPI_URL` to form the full URL.
- Use `next/image` with explicit `width` and `height` from the Strapi media object.
  If `width` or `height` is null (shouldn't happen in practice but the type allows it),
  fall back to `fill` layout with a fixed-height wrapper.
- `alt`: use `image.alternativeText` if it's a non-empty string; otherwise use
  `"Digital mockup of the [project.Name] website"`.

#### Year display
The `Year` field is a Strapi enumeration value like `"y2024"`. Strip the leading `"y"`
with a small helper: `year.replace(/^y/, '')` → `"2024"`. If `Year` is null, omit
the year span.

#### Button
Only render if `Button.Label` and `Button.URL` are both present. Use `<a href>` styled
as an editorial outlined button — same CSS as Hero's `.btnSecondary` (transparent bg,
`1px solid var(--color-text)`, hover inverts).

#### Heading hierarchy
- `<h2>` for the section label ("PROJECTS")
- `<h3>` for each project name
This continues the heading hierarchy already established: `<h1>` in Hero, `<h2>` in
Experience. Projects follows Experience in the DOM so `<h2>` is correct.

---

### `src/components/Projects/Projects.module.css`
Mirrors the Experience module structure. Key classes:

| Class | Purpose |
|---|---|
| `.section` | `padding-block: var(--space-16)` |
| `.inner` | max-width, margin-inline: auto, 1fr 3fr grid, `gap: var(--space-8)` |
| `.label` | Same as Experience: sm, uppercase, muted, letter-spacing |
| `.list` | `display: flex; flex-direction: column` — stacks articles |
| `.divider` | Applied to `<hr>` — `border: none; border-top: 1px solid var(--color-border); margin: 0` |
| `.entry` | `display: flex; flex-direction: column; gap: var(--space-3); padding-block: var(--space-6)` |
| `.image` | `width: 100%; height: auto; display: block` |
| `.entryHeader` | `display: flex; align-items: baseline; gap: var(--space-2)` |
| `.year` | `font-size: var(--text-sm); color: var(--color-text-muted)` |
| `.name` | `font-size: var(--text-xl); color: var(--color-text); font-weight: 500` |
| `.description` | `font-size: var(--text-base); line-height: 1.7; color: var(--color-text)` |
| `.badges` | Same as Experience: flex-wrap, gap, no list-style |
| `.badge` | Same as Experience: xs, muted, bordered, no border-radius |
| `.btn` | Editorial link — matches Hero `.btnSecondary` |

Responsive breakpoint at `max-width: 640px`: collapse to single column, remove label
padding-top offset.

---

## Files to modify

### `src/app/page.tsx`
Add `getProjects` to the import and to `Promise.all`:

```ts
const [profile, experiences, testimonials, projects] = await Promise.all([
  getProfile(),
  getExperiences(),
  getTestimonials().catch(() => []),
  getProjects().catch(() => []),
]);

// Filter for featured only
const featuredProjects = projects.filter((p) => p.Featured === true);
```

Pass `featuredProjects` to the `<Projects>` component. Render it after `<Experience>`,
before `<Testimonials>`.

`getProjects` is wrapped in `.catch(() => [])` so a Strapi outage on projects does not
break the whole page — same defensive pattern used for testimonials.

### `next.config.ts`
Add `remotePatterns` to allow `next/image` to fetch images from the Strapi host.
In development this is `localhost:1337`. The hostname is extracted from the
`STRAPI_URL` env var at config load time so it works in both dev and production without
hardcoding a hostname:

```ts
import type { NextConfig } from 'next';

const strapiUrl = new URL(process.env.STRAPI_URL ?? 'http://localhost:1337');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: strapiUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: strapiUrl.hostname,
        port: strapiUrl.port,
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
```

---

## Accessibility checklist (will be verified before marking done)
- [ ] `<section>` has `aria-labelledby` pointing to the `<h2>`
- [ ] Each `<article>` has `aria-label` = project name
- [ ] `<h2>` for section, `<h3>` for each project — no heading skips
- [ ] `<hr>` between entries is presentational; it carries no ARIA label (correct)
- [ ] Button is an `<a>` (it navigates), not a `<button>` (which triggers actions)
- [ ] `alt` is never empty on a rendered `<img>`
- [ ] Badges list has `aria-label="Tags"` on the `<ul>`
- [ ] Focus ring on the button link via global `:focus-visible` rule
- [ ] No inline styles, no hardcoded colors, no fixed pixel sizes
- [ ] Color contrast verified in both light and dark mode

---

## Order of steps (awaiting approval before starting)
1. `next.config.ts` — add `remotePatterns`
2. `Projects.tsx` + `Projects.module.css` — create component
3. `page.tsx` — wire up data and render the section
