import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Theme type definition
type Theme = 'theme-light' | 'dark' | 'system';

// Helper function to get theme from URL hash
const getThemeFromURL = (): Theme | null => {
  if (typeof window === 'undefined') return null;
  
  const hash = window.location.hash;
  const themeMatch = hash.match(/theme=([^&]+)/);
  
  if (themeMatch) {
    const theme = themeMatch[1] as Theme;
    // Clean up the hash after reading
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    return theme;
  }
  
  return null;
};

// Theme atom with localStorage persistence and URL restore
export const themeAtom = atomWithStorage<Theme>('theme', (() => {
  const urlTheme = getThemeFromURL();
  return urlTheme || 'system';
})());

// Derived atom for computed dark mode state
export const isDarkAtom = atom((get) => {
  const theme = get(themeAtom);
  
  if (theme === 'dark') return true;
  if (theme === 'theme-light') return false;
  
  // For 'system' theme, check media query
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  
  return false;
});

// Write-only atom for theme actions with side effects
export const setThemeAtom = atom(
  null,
  (get, set, newTheme: Theme) => {
    set(themeAtom, newTheme);
    
    // Apply theme to document element
    if (typeof document !== 'undefined') {
      const isDark = newTheme === 'dark' || 
        (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      document.documentElement.classList.toggle('dark', isDark);
    }
  }
);