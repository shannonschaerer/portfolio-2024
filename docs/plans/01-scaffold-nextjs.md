# Plan: Scaffold the Next.js Project

## Context
The current directory is the old Create React App project. We're not migrating any of its
code — only its content (projects, profile info). The goal is to end this step with a clean
Next.js shell, the old code preserved for reference, and nothing broken.

---

## Step 1 — Prepare the directory

Before running anything, clear out the CRA-specific files so they don't conflict with what
Next.js will create.

| What | Why |
|---|---|
| `node_modules/` | Old CRA dependencies — Next.js will create its own |
| `package.json` | Old CRA config — Next.js will replace it |
| `package-lock.json` | Same |
| `public/` | Old CRA public folder — Next.js creates its own |
| `build/` and `build.zip` | Already gitignored, just taking up space |

Rename `src/` → `_reference/` so the old components are still readable as content
reference, but the name makes it obvious it's not live code.

Keep: `.git/`, `.gitattributes`, `.gitignore`, `CLAUDE.md`, `README.md`, `example/`, `.idea/`

---

## Step 2 — Run the scaffold command

```bash
npx create-next-app@latest .
```

The `.` means "scaffold into the current directory."

| Prompt | Answer | Reason |
|---|---|---|
| TypeScript? | Yes | Catches type errors early, avoids painful migration later |
| ESLint? | Yes | Catches errors as you write |
| Tailwind CSS? | No | Using CSS Modules |
| src/ directory? | Yes | Keeps app code separated from config files at root |
| App Router? | Yes | Modern Next.js approach (specified in CLAUDE.md) |
| Import alias (@/*)? | Yes (default) | Cleaner imports |

---

## Step 3 — Clean up what Next.js generates

| File | Action |
|---|---|
| `src/app/page.module.css` | Delete — demo styles for placeholder homepage |
| `public/next.svg`, `public/vercel.svg` | Delete — branding placeholders |
| `src/app/page.js` (or .tsx) | Keep but gut — just an empty page shell |
| `src/app/globals.css` | Keep but gut — replace with our own baseline |

---

## Step 4 — Create our own empty folders

- `src/components/` — reusable UI components
- `src/lib/` — functions for fetching data from Strapi
- `src/styles/` — shared CSS custom properties

---

## Step 5 — Update .gitignore

- Keep `build/` and `build.zip` excluded
- Do NOT exclude `.claude/`
- Add `.next/` (Next.js build output)

---

## Final folder structure

```
portfolio-2024/
├── .git/
├── .gitattributes
├── .gitignore
├── .idea/
├── CLAUDE.md
├── README.md
├── _reference/              ← renamed from src/, old CRA code for reference
│   ├── components/
│   ├── App.js
│   └── ...
├── public/                  ← Next.js public dir
├── src/
│   ├── app/
│   │   ├── layout.tsx       ← root layout
│   │   ├── page.tsx         ← homepage (empty shell)
│   │   └── globals.css      ← base styles
│   ├── components/          ← empty
│   ├── lib/                 ← empty
│   └── styles/              ← empty
├── .eslintrc.json
├── next.config.mjs
├── package.json
└── package-lock.json
```

---

## Decisions made
- TypeScript: Yes
- `.claude/` must NOT be in `.gitignore`
- Vercel section removed from `.gitignore` — not using Vercel
