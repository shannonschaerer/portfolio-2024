"use client";

import { useState } from 'react';
import type { Experience } from '@/lib/types';
import styles from './Experience.module.css';

const INITIAL_COUNT = 4;

function formatDate(value: string | null): string {
  if (!value) return 'Present';
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' })
    .format(new Date(year, month - 1));
}

type ExperienceListProps = {
  experiences: Experience[];
};

export default function ExperienceList({ experiences }: ExperienceListProps) {
  const [expanded, setExpanded] = useState(false);

  const hiddenCount = Math.max(0, experiences.length - INITIAL_COUNT);
  const hasMore = hiddenCount > 0;

  const ariaLabel = expanded
    ? 'Show fewer experience entries'
    : `Show ${hiddenCount} more experience ${hiddenCount === 1 ? 'entry' : 'entries'}`;

  return (
    <div className={styles.entries}>
      <div id="experience-entries">
      {experiences.map((exp, i) => (
        <article
          key={exp.documentId}
          className={styles.entry}
          hidden={!expanded && i >= INITIAL_COUNT}
          aria-label={`${exp.Company ?? 'Unknown company'} — ${exp.Role ?? 'Unknown role'}`}
        >
          <header className={styles.entryHeader}>
            <div className={styles.entryMeta}>
              {exp.Company && <h3 className={styles.company}>{exp.Company}</h3>}
              {exp.Role && <p className={styles.role}>{exp.Role}</p>}
              {exp.Location && <p className={styles.location}>{exp.Location}</p>}
            </div>
            <p className={styles.dates}>
              {formatDate(exp.StartDate)} – {formatDate(exp.EndDate)}
            </p>
          </header>

          {exp.Responsibilities && (
            <div className={styles.responsibilities}>
              {exp.Responsibilities.split('\n\n').filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}

          {exp.Badges.length > 0 && (
            <ul className={styles.badges} aria-label="Skills">
              {exp.Badges.map((badge) =>
                badge.Label ? (
                  <li key={badge.id} className={styles.badge}>{badge.Label}</li>
                ) : null
              )}
            </ul>
          )}
        </article>
      ))}
      </div>

      {hasMore && (
        <button
          type="button"
          className={styles.toggleButton}
          aria-expanded={expanded}
          aria-controls="experience-entries"
          aria-label={ariaLabel}
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}
