import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'icon' | 'button' | 'compact';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
  variant = 'icon'
}) => {
  const { theme, toggleTheme } = useApp();
  const isDark = theme === 'dark';

  if (variant === 'button' || showLabel) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xs border transition-all cursor-pointer text-xs font-bold ${
          isDark
            ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
        } ${className}`}
        title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      >
        {isDark ? (
          <>
            <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="w-4 h-4 text-slate-700 shrink-0" />
            <span>Dark Mode</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      className={`p-1.5 rounded-xs border transition-all cursor-pointer flex items-center justify-center ${
        isDark
          ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 hover:border-slate-400'
      } ${className}`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-300" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700" />
      )}
    </button>
  );
};
