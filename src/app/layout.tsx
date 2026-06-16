import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Pilotage de la production scientifique — Université Grenoble Alpes",
  description:
    "Tableau de bord décisionnel de la production scientifique du site Grenoble Alpes : réconciliation HAL × OpenAlex et analyses scientométriques (h-index, détection de rafales de Kleinberg, réseau de collaboration Louvain, loi de Lotka).",
  authors: [{ name: "Thomas Berchet" }],
};

// Set the theme class before paint to avoid a flash of the wrong colour scheme.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
