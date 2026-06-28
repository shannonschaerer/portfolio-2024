import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import Nav from "@/components/Nav/Nav";
import { siteConfig } from "@/config/site";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: siteConfig.siteName,
  description: siteConfig.siteDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <head>
        {/* Reads localStorage before first paint to avoid a flash of wrong theme on reload */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.dataset.theme='dark';}catch(e){}})();` }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <Nav />
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
