'use strict';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const TOKEN = process.env.STRAPI_API_TOKEN;
const DRY_RUN = process.argv.includes('--dry-run');

if (!TOKEN) {
  console.error('Error: STRAPI_API_TOKEN is not set.');
  console.error('Run with: node --env-file=.env scripts/fix-dates.js');
  process.exit(1);
}

const MONTHS = {
  january: '01', february: '02', march: '03', april: '04',
  may: '05', june: '06', july: '07', august: '08',
  september: '09', october: '10', november: '11', december: '12',
};

// Matches "August'18" with either a straight (') or curly (') apostrophe
const DATE_RE = /^([A-Za-z]+)['’](\d{2})$/;

function convertDate(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}$/.test(value)) return null; // already correct

  const m = value.match(DATE_RE);
  if (!m) return null; // unrecognised format — leave alone

  const month = MONTHS[m[1].toLowerCase()];
  if (!month) {
    console.warn(`    ⚠  Unknown month name: "${m[1]}" — skipping`);
    return null;
  }

  return `20${m[2]}-${month}`;
}

function logField(name, original, converted) {
  if (converted) {
    console.log(`  ${name}:  "${original}"  →  "${converted}"`);
  } else if (!original) {
    console.log(`  ${name}:  null — skipped`);
  } else if (/^\d{4}-\d{2}$/.test(original)) {
    console.log(`  ${name}:  already "${original}" — skipped`);
  } else {
    console.log(`  ${name}:  unrecognised "${original}" — skipped`);
  }
}

async function fetchExperiences() {
  const res = await fetch(`${STRAPI_URL}/api/experiences?populate=*`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.data;
}

async function putExperience(documentId, data) {
  const res = await fetch(`${STRAPI_URL}/api/experiences/${documentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ data: { ...data, publishedAt: new Date().toISOString() } }),
  });
  if (!res.ok) throw new Error(`PUT failed: ${res.status} — ${await res.text()}`);
  return res.json();
}

async function main() {
  if (DRY_RUN) console.log('(dry run — nothing will be written to Strapi)\n');
  console.log('── Fix experience dates ───────────────────────────────────\n');

  const experiences = await fetchExperiences();
  let updated = 0, skipped = 0, errors = 0;

  for (const exp of experiences) {
    const label = exp.Company || `(documentId: ${exp.documentId})`;
    console.log(label);

    const newStart = convertDate(exp.StartDate);
    const newEnd = convertDate(exp.EndDate);

    logField('StartDate', exp.StartDate, newStart);
    logField('EndDate  ', exp.EndDate, newEnd);

    if (!newStart && !newEnd) {
      console.log('  – no changes\n');
      skipped++;
      continue;
    }

    const payload = {};
    if (newStart) payload.StartDate = newStart;
    if (newEnd) payload.EndDate = newEnd;

    if (DRY_RUN) {
      console.log('  ~ dry run — not written\n');
      updated++;
      continue;
    }

    try {
      await putExperience(exp.documentId, payload);
      console.log('  ✓ updated\n');
      updated++;
    } catch (e) {
      console.error(`  ✗ error: ${e.message}\n`);
      errors++;
    }
  }

  console.log('──────────────────────────────────────────────────────────');
  const verb = DRY_RUN ? 'would update' : 'updated';
  console.log(`Done: ${updated} ${verb}, ${skipped} skipped, ${errors} errors.`);
  if (errors > 0) process.exit(1);
}

main().catch(e => {
  console.error('\nFatal:', e.message);
  process.exit(1);
});
