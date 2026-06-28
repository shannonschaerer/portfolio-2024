import type { Experience } from '@/lib/types';
import styles from './Experience.module.css';

type ExperienceProps = {
  experiences: Experience[];
};

function formatDate(value: string | null): string {
  if (!value) return 'Present';
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' })
    .format(new Date(year, month - 1));
}

export default function Experience({ experiences }: ExperienceProps) {
  if (experiences.length === 0) return null;

  return (
    <section id="experience" className={styles.section} aria-labelledby="experience-heading">
      <div className={styles.inner}>
        <h2 id="experience-heading" className={styles.label}>Experience</h2>
        <div className={styles.entries}>
          {experiences.map((exp) => (
            <article key={exp.documentId} className={styles.entry}>
              <header className={styles.entryHeader}>
                <div className={styles.entryMeta}>
                  {exp.Company && <p className={styles.company}>{exp.Company}</p>}
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
      </div>
    </section>
  );
}
