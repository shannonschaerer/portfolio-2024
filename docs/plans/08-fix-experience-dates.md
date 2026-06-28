# Plan: Fix Experience Date Formats

**Status:** Awaiting approval

---

## Problem

Experience entries in Strapi have `StartDate` and `EndDate` values in the format `"August'18"` and `"June'23"` — carried over from the reference markdown files by the migration script. The Experience section plan requires sortable dates in `YYYY-MM` format.

---

## Approach

A one-off Node.js script: `scripts/fix-dates.js`. It reads every experience entry from Strapi, converts any date in the old format to `YYYY-MM`, then PUTs the corrected values back. Entries with null dates, already-correct dates, or unrecognised formats are left untouched.

---

## How to run

Consistent with the existing `scripts/migrate.js` pattern — Node 20's built-in `--env-file` flag loads `.env`, no extra dependencies needed:

```bash
# Preview only — nothing is written to Strapi
node --env-file=.env scripts/fix-dates.js --dry-run

# Apply the changes
node --env-file=.env scripts/fix-dates.js
```

The `--dry-run` flag is the safety valve. Run it first, read the output, then run without the flag to commit.

---

## Date parsing logic

Input pattern: `MonthName'YY` — e.g. `August'18`, `June'23`.

The apostrophe may be a straight single quote `'` (U+0027) or a curly right quote `'` (U+2019), depending on how the reference markdown was authored. The parser handles both.

```
"August'18"  →  2018-08
"June'23"    →  2023-06
```

Step by step:
1. Try to match against `/^([A-Za-z]+)['’](\d{2})$/`
2. If no match → leave the value unchanged (already `YYYY-MM`, null, "Present", etc.)
3. Map the month name to a zero-padded number (`August` → `08`)
4. Expand the 2-digit year by prepending `20` (`18` → `2018`)
5. Combine: `${year}-${month}` → `"2018-08"`

If the month name isn't in the map (typo, unexpected format) → log a warning and skip that field rather than crashing or writing garbage.

---

## Strapi API calls

**Fetch all experiences:**
```
GET /api/experiences?populate=*
```
Returns an array of flat objects with `documentId`, `StartDate`, `EndDate`.

**Update a single entry:**
```
PUT /api/experiences/:documentId
Body: { data: { StartDate: "2018-08", EndDate: "2023-06" } }
```

Uses `documentId` (the string ID Strapi v5 uses for content addressing), not the numeric `id`. Only sends the two date fields in the PUT body — does not touch Company, Role, or any other field.

The `publishedAt` timestamp is included in the PUT body to keep the entry published, matching the pattern in `scripts/migrate.js`.

---

## Output (console)

```
── Fix experience dates ───────────────────────────────────

Acme Corp
  StartDate:  "August'18"  →  "2018-08"
  EndDate:    "June'23"    →  "2023-06"
  ✓ updated

Previous Corp
  StartDate:  already "2020-03" — skipped
  EndDate:    null — skipped
  – no changes

──────────────────────────────────────────────────────────
Done: 1 updated, 1 skipped, 0 errors.
```

In `--dry-run` mode, the same output appears but `✓ updated` is replaced with `~ dry run — not written`.

---

## What the script does NOT do

- Does not touch any field other than `StartDate` and `EndDate`
- Does not delete or re-create entries
- Does not modify `scripts/migrate.js` or the reference files
- Does not run automatically — it's a one-off utility

---

## Files to create

| File | Action |
|---|---|
| `scripts/fix-dates.js` | Create |

No changes to `src/`, `strapi.ts`, or `types.ts`.

---

## Step sequence (once approved)

1. Create `scripts/fix-dates.js`
2. Run with `--dry-run` — Shannon reviews the proposed changes
3. If output looks correct, run without `--dry-run` to apply
