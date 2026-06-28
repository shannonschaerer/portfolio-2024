import styles from './About.module.css';

type AboutProps = {
  about: string | null;
};

export default function About({ about }: AboutProps) {
  if (!about) return null;

  const paragraphs = about.split('\n\n').filter(Boolean);

  return (
    <section id="about" className={styles.section} aria-labelledby="about-heading">
      <div className={styles.inner}>
        <h2 id="about-heading" className={styles.label}>About</h2>
        <div className={styles.body}>
          {paragraphs.map((para, i) => (
            <p key={i} className={styles.paragraph}>{para}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
