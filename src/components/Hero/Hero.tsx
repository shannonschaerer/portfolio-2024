import { Profile } from "@/lib/types";
import styles from "./Hero.module.css";

type HeroProps = {
  profile: Profile;
};

export default function Hero({ profile }: HeroProps) {
  return (
    <section id="hero" className={styles.section} aria-labelledby="hero-heading">
      <div className={styles.inner}>
        <div className={styles.text}>
          <p className={styles.role}>{profile.Role}</p>
          <h1 id="hero-heading" className={styles.name}>{profile.Name}</h1>
          <p className={styles.tagline}>{profile.Tagline}</p>
        </div>
        <div className={styles.actions}>
          <a href="#projects" className={styles.btnPrimary}>View Work</a>
          <a href="#contact" className={styles.btnSecondary}>Get in Touch</a>
        </div>
      </div>
    </section>
  );
}
