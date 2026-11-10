import { create } from 'zustand';

import { defaultSettings, type Settings } from '@/types/settings';

type SettingsState = Settings & {
  hydrate: (settings: Settings) => void;
  setLanguage: (language: Settings['language']) => void;
  setUnits: (units: Settings['units']) => void;
  setTheme: (theme: Settings['theme']) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  ...defaultSettings,
  hydrate: (settings) => set(settings),
  setLanguage: (language) => set({ language }),
  setUnits: (units) => set({ units }),
  setTheme: (theme) => set({ theme }),
}));
