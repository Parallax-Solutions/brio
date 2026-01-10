'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

interface PreferencesSyncProps {
  theme?: string;
  accentColor?: string;
}

/**
 * Syncs user preferences from the database to the client.
 * This runs ONLY ONCE on mount to apply the user's saved preferences.
 */
export function PreferencesSync({ theme, accentColor }: PreferencesSyncProps) {
  const { setTheme } = useTheme();
  const hasSynced = useRef(false);

  useEffect(() => {
    // Only sync once on initial mount
    if (hasSynced.current) return;
    hasSynced.current = true;

    // Apply theme from database
    if (theme) {
      const dbTheme = theme.toLowerCase();
      setTheme(dbTheme);
    }

    // Apply accent color from database
    if (accentColor) {
      localStorage.setItem('accent-color', accentColor);
      document.documentElement.setAttribute('data-accent', accentColor);
    }
  }, [theme, accentColor, setTheme]);

  return null;
}
