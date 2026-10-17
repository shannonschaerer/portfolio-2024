import { Fragment } from 'react';
import Image from 'next/image';
import type { Project } from '@/lib/types';
import styles from './Projects.module.css';

type ProjectsProps = {
  projects: Project[];
};

const STRAPI_URL = process.env.STRAPI_URL ?? 'http://localhost:1337';

function getImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${STRAPI_URL}${url}`;
}

function getAltText(project: Project): string {
  if (project.Image?.alternativeText) return project.Image.alternativeText;
  return `Digital mockup of the ${project.Name} website`;
}

function formatYear(year: string | null): string | null {
  if (!year) return null;
  return year.replace(/^y/, '');
}

export default function Projects({ projects }: ProjectsProps) {
  if (projects.length === 0) return null;

  return (
    <section id="projects" className={styles.section} aria-labelledby="projects-heading">
      <div className={styles.inner}>
        <h2 id="projects-heading" className={styles.label}>Projects</h2>

        <div className={styles.list}>
          {projects.map((project, i) => {
            const year = formatYear(project.Year);
            const hasImage = project.Image !== null;
            const hasDescription = Boolean(project.Description);
            const hasBadges = project.Badge.length > 0;
            const hasButton = Boolean(project.Button?.Label && project.Button?.URL);
           
            return (
              <Fragment key={project.documentId}>
                {i > 0 && <hr className={styles.divider} aria-hidden="true" />}
                <article
                  className={styles.entry}
                  aria-label={project.Name}
                >
                  {hasImage && (
                    <div className={styles.imageWrapper}>
                      {/* TODO: remove unoptimized when next.config.ts */}
                      {/* remotePatterns is fixed for production deployment */}
                      <Image
                        src={getImageUrl(project.Image!.url)}
                        alt={getAltText(project)}
                        width={project.Image!.width ?? 1200}
                        height={project.Image!.height ?? 800}
                        className={styles.image}
                        unoptimized
                      />
                    </div>
                  )}

                  <header className={styles.entryHeader}>
                    {year && <span className={styles.year}>{year}</span>}
                    <h3 className={styles.name}>{project.Name}</h3>
                  </header>

                  {hasDescription && (
                    <p className={styles.description}>{project.Description}</p>
                  )}

                  {hasBadges && (
                    <ul className={styles.badges} aria-label="Tags">
                      {project.Badge.map((badge) =>
                        badge.Label ? (
                          <li key={badge.id} className={styles.badge}>{badge.Label}</li>
                        ) : null
                      )}
                    </ul>
                  )}

                  {hasButton && (
                    <a
                      href={project.Button!.URL!}
                      className={styles.btn}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {project.Button!.Label}
                    </a>
                  )}
                </article>
              </Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}
