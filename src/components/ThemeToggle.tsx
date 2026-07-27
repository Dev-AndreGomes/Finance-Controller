'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid a hydration mismatch: the server doesn't know the persisted theme.
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-11 h-6" />;

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative w-11 h-6 rounded-full bg-bg border border-line transition-colors shrink-0"
      aria-label="Alternar modo escuro"
    >
      <span
        className={`absolute top-0.5 left-0.5 w-[1.125rem] h-[1.125rem] rounded-full bg-accent flex items-center justify-center transition-transform ${
          isDark ? 'translate-x-5' : 'translate-x-0'
        }`}
      >
        {isDark ? (
          <Moon size={11} className="text-accent-contrast" />
        ) : (
          <Sun size={11} className="text-accent-contrast" />
        )}
      </span>
    </button>
  );
}
