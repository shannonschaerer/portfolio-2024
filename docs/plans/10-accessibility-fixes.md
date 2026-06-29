# Plan: Accessibility Fixes

Fixes identified in the accessibility audit. Each fix is applied one at a time,
shown for approval before the change is made.

---

## Fix 1 — Add `--color-focus-ring` token and update global focus rule

### Why
The global `:focus-visible` rule currently uses `var(--color-accent)`, which is a
dark gray (#595959 light / #A8A8A8 dark). The accent token is intentionally neutral
for the design direction. The focus ring, however, serves a safety and usability
function — it needs to be visually distinct and unambiguous. Blue is the universal
convention for focus indicators. Keeping it separate from accent means we can tune
each independently.

### Files changed

**`src/styles/tokens.css`** — add two new lines under the color block, one per mode:

```css
/* Light mode additions */
--color-focus-ring: #4A6FA5;

/* Dark mode additions */
--color-focus-ring: #7BA3CC;
```

**`src/app/globals.css`** — update the `:focus-visible` rule:

```css
/* Before */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
  border-radius: var(--radius-sm);
}

/* After */
:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 3px;
  border-radius: var(--radius-sm);
}
```

The skip link in globals.css also overrides `outline-color` in its own
`:focus-visible` rule (`outline-color: var(--color-on-accent)`). That override is
intentional — the skip link has an accent-colored background, so it needs a
contrasting ring. No change needed there.

### Contrast check
- Light: #4A6FA5 on #F8F7F4 — approximately 4.6:1 (passes AA 3:1 for UI components,
  close to passing 4.5:1 for text). Acceptable for a focus indicator.
- Dark: #7BA3CC on #141414 — approximately 5.4:1. Passes AA comfortably.

---

## Fix 2a — Add `aria-controls` to the Experience toggle button

### Why
The W3C APG disclosure pattern requires that a button with `aria-expanded` also
carries `aria-controls="[id]"` pointing to the element it controls. Without it,
a screen reader user knows something is expanding or collapsing but cannot
programmatically navigate to the newly revealed content.

Currently the hidden entries are direct children of `.entries` (the outer `<div>`)
with no wrapper. We need a containing element with a stable `id` to reference.

### Files changed

**`src/components/Experience/ExperienceList.tsx`** — two changes:

1. Wrap the entries that can be hidden in a `<div id="experience-entries">`.
2. Add `aria-controls="experience-entries"` to the button.

```tsx
/* Before — entries rendered directly in the outer div */
<div className={styles.entries}>
  {experiences.map((exp, i) => (
    <article ... hidden={!expanded && i >= INITIAL_COUNT}>
      ...
    </article>
  ))}

  {hasMore && (
    <button
      type="button"
      aria-expanded={expanded}
      aria-label={ariaLabel}
      ...
    >
```

```tsx
/* After */
<div className={styles.entries}>
  <div id="experience-entries">
    {experiences.map((exp, i) => (
      <article ... hidden={!expanded && i >= INITIAL_COUNT}>
        ...
      </article>
    ))}
  </div>

  {hasMore && (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls="experience-entries"
      aria-label={ariaLabel}
      ...
    >
```

Note: `id="experience-entries"` is a fixed string because there is only one
ExperienceList on the page. If we ever rendered multiple instances, we'd need a
generated id. That's not a concern right now.

---

## Fix 2b — Add `<h3>` headings inside each Experience `<article>`

### Why
Screen reader users navigate pages by heading (H key in VoiceOver). Currently they
can jump to "Experience" (h2) but then have no heading landmarks inside the section.
Every job entry is a silent article. Making the company name an `<h3>` gives keyboard
users a way to jump between individual entries without reading through everything.

### Files changed

**`src/components/Experience/ExperienceList.tsx`** — change the company `<p>` to `<h3>`:

```tsx
/* Before */
{exp.Company && <p className={styles.company}>{exp.Company}</p>}

/* After */
{exp.Company && <h3 className={styles.company}>{exp.Company}</h3>}
```

**`src/components/Experience/Experience.module.css`** — the `.company` rule stays
exactly as is. CSS doesn't care whether the element is `<p>` or `<h3>`. The visual
appearance is unchanged — same size, weight, color. Only the semantic role changes.

Heading hierarchy after this change:
```
h1 — profile name (Hero)
  h2 — About
  h2 — Experience
    h3 — [Company name] (each entry)
```

---

## Fix 2c — Add `aria-label` to each Experience `<article>`

### Why
`<article>` creates a landmark in the accessibility tree. VoiceOver announces
"article" when focus enters one, with no context about which company or role it
represents. An `aria-label` gives each article a meaningful name so the user
knows where they've landed without having to read the content first.

### Files changed

**`src/components/Experience/ExperienceList.tsx`** — add `aria-label` to each article:

```tsx
/* Before */
<article
  key={exp.documentId}
  className={styles.entry}
  hidden={!expanded && i >= INITIAL_COUNT}
>

/* After */
<article
  key={exp.documentId}
  className={styles.entry}
  hidden={!expanded && i >= INITIAL_COUNT}
  aria-label={`${exp.Company ?? 'Unknown company'} — ${exp.Role ?? 'Unknown role'}`}
>
```

The nullish fallbacks (`?? 'Unknown company'`) are needed because Company and Role
are optional fields in the type. In practice they should always be present, but
TypeScript requires us to handle the case where they aren't.

---

## Fix 3a — Add visually hidden full name to Nav logo link

### Why
`logoText` is "SS" (initials). A screen reader reads the letters individually —
"S, S" — with no useful context about who that is. Adding a visually hidden `<span>`
with the full name gives screen reader users the same information sighted users
infer from context.

### Files changed

**`src/components/Nav/Nav.tsx`** — update the logo link:

```tsx
/* Before */
<a href="#hero" className={styles.logo}>
  {siteConfig.logoText}
</a>

/* After */
<a href="#hero" className={styles.logo}>
  <span aria-hidden="true">{siteConfig.logoText}</span>
  <span className="sr-only">{siteConfig.siteName} — home</span>
</a>
```

- `aria-hidden="true"` on the initials span suppresses "S, S" from screen readers.
- The `sr-only` span uses `siteConfig.siteName` (already imported in Nav), which
  carries the correct spelling including the umlaut — "Shannon Schaerer".
- "— home" clarifies the link's destination.
- The `sr-only` class is already defined in `globals.css` — no new CSS needed.

---

## Fix 3b — `aria-current` for active nav link (plan only — separate approval)

### What this involves

This requires JavaScript to track which section is currently in the viewport,
then set `aria-current="true"` on the matching nav link. The standard approach
is `IntersectionObserver`.

### Proposed approach

1. Convert `Nav` from a server component to a client component (`"use client"`).
2. Create an `IntersectionObserver` that watches `#hero`, `#about`, `#experience`,
   `#projects`, `#contact`.
3. Track `activeSection` in state. When a section enters the viewport above the
   midpoint, set that section's id as active.
4. Add `aria-current={href === `#${activeSection}` ? 'true' : undefined}` to
   each nav `<a>`.

### Trade-off to flag

Making `Nav` a client component means it's no longer server-rendered. For a static
nav, this is a meaningful downgrade — server components are simpler, faster, and
don't need JS to render. An alternative is to pass the active section down as a
prop from a parent client component, but that's more complex.

**This fix needs a separate approval before implementation.** The pattern is
well-defined, but the client-component trade-off is a design decision worth
discussing first.

---

## Fix 4 — Update CLAUDE.md to reflect current reality

### Changes

1. **Typography section:** Change "Inter" → "DM Sans" in the body font specification.
2. **Color tokens block:** Update `--color-accent` light to `#595959`, dark to `#A8A8A8`
   to match what's actually in tokens.css.
3. **Color tokens block:** Add `--color-focus-ring` entries for both modes.

---

## Order of implementation

1. Fix 1 (focus ring token) — affects globals only, low risk
2. Fix 2a (aria-controls) — Experience, no visual change
3. Fix 2b (h3 heading) — Experience, no visual change
4. Fix 2c (article aria-label) — Experience, no visual change
5. Fix 3a (nav logo sr-only) — Nav, no visual change
6. Fix 3b (aria-current) — pause for separate discussion
7. Fix 4 (CLAUDE.md update) — documentation only

Each fix is shown in full before being applied. No batching.
