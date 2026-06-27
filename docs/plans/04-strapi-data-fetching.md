# Plan: Strapi Data Fetching

## 1. Where the fetch functions live

```
src/lib/
  types.ts      ← TypeScript types for all content + Strapi envelope generics
  strapi.ts     ← low-level fetchStrapi() helper + getProfile(), getProjects(), getExperiences()
```

---

## 2. Build time vs request time in Next.js App Router

Server Components (the default in App Router) can call `fetch()` directly — no `useEffect`,
no client-side loading states.

| Fetch option | Behaviour | Use case |
|---|---|---|
| No options | Cached at build time (static) | Content that never changes |
| `{ cache: 'no-store' }` | Fresh on every request (dynamic) | Frequently changing content |
| `{ next: { revalidate: 3600 } }` | Cached, refreshed every N seconds (ISR) | Portfolio content |

**Decision: ISR with 1-hour revalidate** on all three content types. Fast like static,
picks up Strapi edits without a full redeploy.

---

## 3. Securing the Strapi API token

1. Create `.env.local` at the project root (gitignored by Next.js by default)
2. Add:
```
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_token_here
```
3. Read via `process.env.STRAPI_URL` and `process.env.STRAPI_API_TOKEN`
4. NOT prefixed with `NEXT_PUBLIC_` → stays server-side only, never bundled into client JS

---

## 4. Fetch functions

| Function | Returns | Strapi endpoint |
|---|---|---|
| `getProfile()` | `Profile` | `/api/profile` (single type) |
| `getProjects()` | `Project[]` | `/api/projects` (collection) |
| `getExperiences()` | `Experience[]` | `/api/experiences` (collection) |

---

## 5. Typing the responses

Strapi wraps every response in an envelope:

```json
{
  "data": { "id": 1, "attributes": { "name": "..." } },
  "meta": {}
}
```

Two levels of types:
- **Data shape** (e.g. `Project`) — just the fields you care about
- **Strapi wrapper** (`StrapiSingle<T>` and `StrapiCollection<T>`) — generic envelope types

Each fetch function unwraps the envelope and returns just the data — the rest of the app
never has to think about `data.attributes`.

Use `cms/types/generated/contentTypes.d.ts` as reference when writing types — don't copy
verbatim, write clean simplified types for the fields actually used.

---

## Decisions made
- ISR with 1-hour revalidate (not static, not dynamic)
- Token stored in `.env.local`, never committed
- Clean simplified types in `src/lib/types.ts` (not raw Strapi generated types)
- Strapi envelope unwrapped inside fetch functions, not in components
