import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type AppTheme } from '@/constants/theme';
import { useSettingsStore } from '@/store/settingsStore';

export function useAppTheme(): AppTheme {
  const preference = useSettingsStore((state) => state.theme);
  const system = useColorScheme();
  const mode = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  return useMemo(() => (mode === 'dark' ? darkTheme : lightTheme), [mode]);
}
