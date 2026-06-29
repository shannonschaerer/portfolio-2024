import { siteConfig } from "@/config/site";
import ThemeToggle from "@/components/ThemeToggle/ThemeToggle";
import styles from "./Nav.module.css";

export default function Nav() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Main navigation">
        <a href="#hero" className={styles.logo}>
          <span aria-hidden="true">{siteConfig.logoText}</span>
          <span className="sr-only">{siteConfig.siteName} — home</span>
        </a>
        <ul className={styles.links} role="list">
          {siteConfig.navLinks.map(({ label, href }) => (
            <li key={href}>
              <a href={href} className={styles.link}>
                {label}
              </a>
            </li>
          ))}
        </ul>
        <ThemeToggle />
      </nav>
    </header>
  );
}
