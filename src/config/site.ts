/**
 * Placeholder values for all site-wide content.
 * Every field here maps to a Strapi field and will be replaced
 * with a fetch from the CMS once data fetching is wired up.
 */

export type NavLink = {
  label: string;
  href: string;
};

export const siteConfig = {
  // Profile → siteName
  siteName: "Shannon Schaerer",

  // Profile → headerRole / tagline (used in <meta description>)
  siteDescription: "Web developer based in Switzerland.",

  // Profile → logo
  logoText: "SS",

  navLinks: [
    { label: "About",      href: "#about"      },
    { label: "Experience", href: "#experience" },
    { label: "Projects",   href: "#projects"   },
    { label: "Contact",    href: "#contact"    },
  ] satisfies NavLink[],
} as const;
