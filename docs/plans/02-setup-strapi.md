# Plan: Set Up Strapi CMS

## Context
Strapi is a headless CMS — it gives you an admin UI to manage content (projects, profile
info), and exposes that content via an API that Next.js fetches from.

---

## Step 1 — Where it lives

Strapi lives as a subfolder inside the existing repo:

```
portfolio-2024/
├── cms/          ← Strapi goes here
├── src/          ← Next.js app
└── ...
```

---

## Step 2 — Scaffold command

```bash
npx create-strapi@latest cms --no-run
```

`--no-run` sets up the files but doesn't immediately start the server.

| Prompt | Answer | Reason |
|---|---|---|
| Login / create account | Skip | Don't need Strapi Cloud |
| Use TypeScript? | Yes | Consistent with the rest of the project |
| Installation type | Custom | So we can pick PostgreSQL |
| Database | PostgreSQL | As specified in CLAUDE.md |

---

## Step 3 — Database configuration

- Host: `localhost`
- Port: `5432`
- Database name: `portfolio_dev`
- Username: `shannonschaerer`
- Password: set via `ALTER USER`

---

## Step 4 — What gets created

```
cms/
├── config/
│   └── database.ts
├── src/
│   ├── api/
│   └── admin/
├── public/
├── .env                ← gitignored
├── package.json
└── tsconfig.json
```

---

## Step 5 — Content types (separate step)

Project and Profile content types created after scaffold confirmed working.

---

## Step 6 — Update .gitignore

Add `cms/.env` and `cms/node_modules` to root `.gitignore`.

---

## Decisions made
- Database: PostgreSQL (not MySQL)
- Strapi runs at `localhost:1337`
- No example structure/data
- i18n plugin already present, English set as default locale
