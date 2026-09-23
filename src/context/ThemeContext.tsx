import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/theme';

type ColorSchemeType = 'light' | 'dark';

interface ThemeContextType {
  colorScheme: ColorSchemeType;
  colors: typeof Colors.light;
  isDark: boolean;
  toggleTheme: () => void;
  setScheme: (scheme: ColorSchemeType) => void;
}

const THEME_STORAGE_KEY = '@love_bites_theme_mode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorSchemeType>(systemScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (saved === 'dark' || saved === 'light') {
          setColorScheme(saved);
        }
      })
      .catch(() => {});
  }, []);

  const setScheme = (scheme: ColorSchemeType) => {
    setColorScheme(scheme);
    AsyncStorage.setItem(THEME_STORAGE_KEY, scheme).catch(() => {});
  };

  const toggleTheme = () => {
    const nextScheme = colorScheme === 'dark' ? 'light' : 'dark';
    setScheme(nextScheme);
  };

  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  return (
    <ThemeContext.Provider value={{ colorScheme, colors, isDark, toggleTheme, setScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
