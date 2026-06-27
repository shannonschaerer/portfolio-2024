# Portfolio Refurbish — Claude Code Instructions

## Who I am
I'm Shannon. I have prior coding experience but have been away from active development for a couple of years. I'm intentionally working at the edge of my current competency — this project is both a deliverable and a learning exercise. Plain-language explanations alongside technical steps are essential, not optional.

## How we work together
1. **Always show a plan before writing any code.** Describe what you're going to do, which files you'll create or modify, and why. Wait for my explicit approval before proceeding. Save every plan to docs/plans/ as a markdown file before 
  writing any code. Use the task name as the filename e.g. 
  docs/plans/data-fetching.md
2. **Explain what you're doing in plain language.** Not just what the code does, but why it's structured that way. Treat every non-obvious decision as a teaching moment.
3. **One step at a time.** Don't chain multiple major changes together. Complete one thing, let me review it, then move on.
4. **Ask before installing dependencies.** Tell me what the package does and why we need it before adding it.
5. **Never touch git directly.** I handle all commits and pushes myself.

## The stack
- **Framework:** Next.js (App Router)
- **Components:** Radix UI primitives (unstyled, accessible)
- **Styling:** CSS Modules
- **CMS:** Strapi (local development, hosted on Hetzner VPS in production)
- **Database:** PostgreSQL (local Homebrew instance for development)
- **CI/CD:** GitHub Actions — to be set up later when ready to deploy
- **Hosting:** Hetzner VPS — to be set up later as a separate learning phase
- **Accessibility:** Non-negotiable. Semantic HTML, ARIA attributes, keyboard navigation, and visible focus states on everything.

## Local development setup
```
Next.js     → localhost:3000
Strapi      → localhost:1337
PostgreSQL  → local Homebrew instance
```
Everything runs locally for now. No deployment configuration until the site is ready.

## Content model (Strapi)

### Project
One unified content type for all projects. The `featured` field controls display — featured projects render as large cards at the top, all others appear in the filterable grid below.

- `name` (string, required)
- `year` (string)
- `description` (text, optional)
- `image` (media)
- `featured` (boolean, default false)
- `tags` (enumeration: Development, Design, Other — multi-select)
- `badges` (component: array of { label: string, color: string })
- `buttons` (component: array of { text: string, url: string })

### Profile
- `siteName` (string)
- `headerName` (string)
- `headerRole` (string)
- `tagline` (string)
- `about` (rich text)
- `linkedin` (string)
- `github` (string)
- `email` (string)
- `logo` (string)

## What we're building
A project showcase site for a web developer based in Switzerland. The existing site is a Create React App using Chakra UI, Bootstrap, and Markdown files for content. We are replacing it entirely with the stack above. The existing content (projects, profile, contact info) will be migrated to Strapi.

## Hard rules
- `build/` and `build.zip` must never be committed — they are in `.gitignore`
- `.claude/` must NOT be in `.gitignore` — this is where custom agents live
- No inline styles. All styling goes in CSS Modules.
- No `any` types if we introduce TypeScript later.
- Accessibility audit every component before marking it done.
- The old Chakra/Bootstrap dependencies are being removed entirely — do not reference them.

# Global Rules
- Always show a plan and wait for explicit approval before writing any code
- Never run git commands — I handle all commits myself
- Explain what you're doing in plain language alongside technical steps
- One step at a time — complete one thing, let me review, then move on
- Ask before installing any dependencies

## Current status
Starting from scratch. The old React app is the reference for content and structure only — not for code patterns.
