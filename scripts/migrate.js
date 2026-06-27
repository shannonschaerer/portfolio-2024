'use strict';

const fs = require('fs');
const path = require('path');

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const TOKEN = process.env.STRAPI_API_TOKEN;

if (!TOKEN) {
  console.error('Error: STRAPI_API_TOKEN is not set.');
  console.error('Run with: node --env-file=.env scripts/migrate.js');
  process.exit(1);
}

const ROOT = path.join(__dirname, '..');

// ─── File helpers ─────────────────────────────────────────────────────────────

function readRef(name) {
  return fs.readFileSync(path.join(ROOT, '_reference', name), 'utf8');
}

// Split a Markdown file into blocks, one per '## ' heading.
// The returned strings have the '## ' prefix stripped.
function splitBlocks(text) {
  return text
    .split(/\n(?=## )/)
    .map(b => b.replace(/^## /, '').trim())
    .filter(Boolean);
}

// ─── Section parser ───────────────────────────────────────────────────────────
//
// Turns a block body into {SectionName: {inline, items}} entries.
// Handles both forms from the reference files:
//   "- Tags: Development, Design"   (inline)
//   "- Tags:\n  - Web Development"  (sub-bullets)

function parseSections(text) {
  const result = {};
  let key = null;

  for (const line of text.split('\n')) {
    if (/^- [A-Za-z]/.test(line)) {
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        key = line.slice(2, colonIdx).trim();
        result[key] = { inline: line.slice(colonIdx + 1).trim(), items: [] };
      } else {
        key = null; // image line "- ![alt](src)" — no labelled section
      }
    } else if (/^\s+-\s/.test(line) && key) {
      result[key].items.push(line.replace(/^\s+-\s*/, '').trim());
    }
  }

  return result;
}

// ─── Field extractors ─────────────────────────────────────────────────────────

function extractBadges(section) {
  if (!section) return [];
  return section.items
    .map(item => {
      const m = item.match(/^(.+?) \[(.+?)\]$/);
      return m ? { Label: m[1].trim(), Color: m[2].trim() } : null;
    })
    .filter(Boolean);
}

// Tags component uses boolean fields, not an enum.
// "Web Development" and "Development" both map to Development: true.
function extractTags(section, isCollab) {
  const tags = { Development: false, Design: false, Other: false, Collaboration: !!isCollab };
  if (!section) return tags;

  const list = section.inline
    ? section.inline.split(',').map(t => t.trim()).filter(Boolean)
    : section.items;

  for (const tag of list) {
    const t = tag.toLowerCase();
    if (t.includes('development')) tags.Development = true;
    if (t.includes('design')) tags.Design = true;
    if (t.includes('other')) tags.Other = true;
  }
  return tags;
}

// Button component is non-repeatable — take the first button only.
function extractButton(section) {
  if (!section || section.items.length === 0) return null;
  const m = section.items[0].match(/^(.+?) \[(https?:\/\/[^\]]+)\]$/);
  return m ? { Label: m[1].trim(), URL: m[2].trim() } : null;
}

// ─── Content parsers ──────────────────────────────────────────────────────────

function parseProject(block, featured) {
  const lines = block.split('\n');

  const rawTitle = lines[0].trim();
  const isCollab = /\[Collab\]/i.test(rawTitle);
  const name = rawTitle.replace(/\s*\[Collab\]/i, '').trim();

  let idx = 1;
  let year = null;
  if (/^\d{4}$/.test(lines[idx]?.trim())) {
    year = `y${lines[idx].trim()}`;
    idx++;
  }

  // Collect description: plain-text lines before the first bullet
  const descLines = [];
  while (idx < lines.length && !lines[idx].trim().startsWith('- ')) {
    const l = lines[idx].trim();
    if (l) descLines.push(l);
    idx++;
  }

  const sections = parseSections(lines.slice(idx).join('\n'));

  return {
    name,
    year,
    description: descLines.length > 0 ? descLines.join(' ') : null,
    tags: extractTags(sections['Tags'], isCollab),
    badges: extractBadges(sections['Badges']),
    button: extractButton(sections['Buttons']),
    featured,
  };
}

function parseExperience(block) {
  const lines = block.split('\n');
  const titleParts = lines[0].trim().split(' | ');
  const company = titleParts[0]?.trim() ?? '';
  const location = titleParts[1]?.trim() ?? '';

  let role = null, startDate = null, endDate = null;
  const roleLine = lines.find(l => /^- \*/.test(l.trim()));
  if (roleLine) {
    const m = roleLine.trim().match(/^- \*(.+?)\* \| (.+)$/);
    if (m) {
      role = m[1].trim();
      const dateParts = m[2].split(' - ');
      startDate = dateParts[0]?.trim() ?? null;
      endDate = dateParts[1]?.trim() ?? null;
    }
  }

  const sections = parseSections(lines.slice(1).join('\n'));

  const responsibilities = (sections['List Items']?.items ?? []).join('\n');

  return { company, location, role, startDate, endDate, responsibilities, badges: extractBadges(sections['Badges']) };
}

function parseProfile(text) {
  const sections = {};
  for (const block of splitBlocks(text)) {
    const lines = block.split('\n');
    sections[lines[0].trim()] = lines.slice(1).join('\n').trim();
  }

  const headerLines = (sections['Header'] ?? '')
    .split('\n')
    .filter(l => l.trim().startsWith('-'))
    .map(l => l.replace(/^-\s*/, '').trim());

  const aboutLines = (sections['About'] ?? '')
    .split('\n')
    .filter(l => l.trim().startsWith('-'))
    .map(l => l.replace(/^-\s*/, '').trim());

  const contact = sections['Contact'] ?? '';

  const logoLabel = (sections['Logo'] ?? '')
    .split('\n')
    .find(l => l.trim().startsWith('-'))
    ?.replace(/^-\s*/, '').trim() ?? null;

  return {
    name: headerLines[0] ?? null,
    role: headerLines[1] ?? null,
    tagline: headerLines[2] ?? null,
    about: aboutLines.join('\n\n'),
    linkedin: contact.match(/LinkedIn:\s*(https?:\/\/\S+)/)?.[1] ?? null,
    github: contact.match(/GitHub:\s*(https?:\/\/\S+)/)?.[1] ?? null,
    email: contact.match(/Email:\s*(\S+)/)?.[1] ?? null,
    logoLabel,
  };
}

// ─── Strapi API ───────────────────────────────────────────────────────────────

const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`,
};

async function strapiPost(endpoint, data) {
  const res = await fetch(`${STRAPI_URL}/api/${endpoint}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ data: { ...data, publishedAt: new Date().toISOString() } }),
  });
  if (!res.ok) throw new Error(`${res.status} — ${await res.text()}`);
  return res.json();
}

async function strapiPut(endpoint, data) {
  const res = await fetch(`${STRAPI_URL}/api/${endpoint}`, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify({ data: { ...data, publishedAt: new Date().toISOString() } }),
  });
  if (!res.ok) throw new Error(`${res.status} — ${await res.text()}`);
  return res.json();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function migrate() {
  let passed = 0;
  let failed = 0;

  async function run(label, fn) {
    try {
      await fn();
      console.log(`  ✓  ${label}`);
      passed++;
    } catch (e) {
      console.error(`  ✗  ${label}: ${e.message}`);
      failed++;
    }
  }

  // ── Featured projects ──────────────────────────────────────────────────────
  console.log('\n── Featured projects ──────────────────────────────────────');
  for (const block of splitBlocks(readRef('Projects.md'))) {
    const p = parseProject(block, true);
    await run(p.name, () =>
      strapiPost('projects', {
        Name: p.name,
        Year: p.year,
        Description: p.description,
        Featured: true,
        Tags: p.tags,
        Badge: p.badges,
        Button: p.button,
      })
    );
  }

  // ── Other projects ─────────────────────────────────────────────────────────
  console.log('\n── Other projects ─────────────────────────────────────────');
  for (const block of splitBlocks(readRef('OtherProjects.md'))) {
    const p = parseProject(block, false);
    await run(p.name, () =>
      strapiPost('projects', {
        Name: p.name,
        Year: p.year,
        Description: p.description,
        Featured: false,
        Tags: p.tags,
        Badge: p.badges,
        Button: p.button,
      })
    );
  }

  // ── Experiences ────────────────────────────────────────────────────────────
  console.log('\n── Experiences ────────────────────────────────────────────');
  for (const block of splitBlocks(readRef('Experience.md'))) {
    const e = parseExperience(block);
    await run(e.company, () =>
      strapiPost('experiences', {
        Company: e.company,
        Location: e.location,
        Role: e.role,
        StartDate: e.startDate,
        EndDate: e.endDate,
        Responsibilities: e.responsibilities,
        Badges: e.badges,
      })
    );
  }

  // ── Profile ────────────────────────────────────────────────────────────────
  console.log('\n── Profile ────────────────────────────────────────────────');
  const prof = parseProfile(readRef('Profile.md'));
  await run('Profile', () =>
    strapiPut('profile', {
      Name: prof.name,
      Role: prof.role,
      Tagline: prof.tagline,
      About: prof.about,
      LinkedIn: prof.linkedin ? { URL: prof.linkedin } : undefined,
      Github: prof.github ? { URL: prof.github } : undefined,
      Email: prof.email,
      Logo: prof.logoLabel ? { Label: prof.logoLabel } : undefined,
    })
  );

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n──────────────────────────────────────────────────────────');
  console.log(`Done: ${passed} succeeded, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

migrate().catch(e => {
  console.error('\nFatal:', e.message);
  process.exit(1);
});
