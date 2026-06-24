import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Premium Preset Color Swatches (Hex)
export const COLOR_PRESETS = [
  { name: 'Hyper Indigo', hex: '#6366f1' },
  { name: 'Emerald Glow', hex: '#10b981' },
  { name: 'Sunset Rose', hex: '#f43f5e' },
  { name: 'Ocean Breeze', hex: '#0ea5e9' },
  { name: 'Cyberpunk Amber', hex: '#f59e0b' },
];

// Helper to convert hex to HSL
export function hexToHSL(hex: string): { h: number; s: number; l: number } | null {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  if (hex.length !== 6) return null;

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial settings from localstorage or use defaults
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('themeMode') as ThemeMode) || 'system';
  });
  
  const [primaryColor, setPrimaryColorState] = useState<string>(() => {
    return localStorage.getItem('primaryColor') || '#6366f1';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  // Change theme handler
  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('themeMode', mode);
  };

  // Change primary color handler
  const setPrimaryColor = (color: string) => {
    setPrimaryColorState(color);
    localStorage.setItem('primaryColor', color);
  };

  // Effect to handle theme updates (light/dark/system)
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      let activeTheme: 'light' | 'dark' = 'dark';
      
      if (themeMode === 'system') {
        activeTheme = mediaQuery.matches ? 'dark' : 'light';
      } else {
        activeTheme = themeMode;
      }
      
      root.setAttribute('data-theme', activeTheme);
      setResolvedTheme(activeTheme);
    };

    updateTheme();

    if (themeMode === 'system') {
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  }, [themeMode]);

  // Effect to update primary color custom properties
  useEffect(() => {
    const hsl = hexToHSL(primaryColor);
    if (hsl) {
      const root = document.documentElement;
      root.style.setProperty('--primary-hue', hsl.h.toString());
      root.style.setProperty('--primary-saturation', `${hsl.s}%`);
      root.style.setProperty('--primary-lightness', `${hsl.l}%`);
    }
  }, [primaryColor]);

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, primaryColor, setPrimaryColor, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
