import type { Experience } from '@/lib/types';
import ExperienceList from './ExperienceList';
import styles from './Experience.module.css';

type ExperienceProps = {
  experiences: Experience[];
};

export default function Experience({ experiences }: ExperienceProps) {
  if (experiences.length === 0) return null;

  return (
    <section id="experience" className={styles.section} aria-labelledby="experience-heading">
      <div className={styles.inner}>
        <h2 id="experience-heading" className={styles.label}>Experience</h2>
        <ExperienceList experiences={experiences} />
      </div>
    </section>
  );
}
