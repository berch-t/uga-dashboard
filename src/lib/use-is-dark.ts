"use client";

import { useEffect, useState } from "react";

/**
 * Suit l'état du thème (classe `dark` sur <html>) en temps réel, pour adapter
 * les composants qui ne peuvent pas s'appuyer uniquement sur les variantes
 * Tailwind `dark:` (ex. coloration syntaxique pilotée par JS).
 */
export function useIsDark(): boolean {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return dark;
}
