import { useSQLiteContext } from 'expo-sqlite';

import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { TopBar } from '@/components/TopBar';
import { useTranslation } from '@/components/useTranslation';
import { writeSetting } from '@/database/settingsRepository';
import { useSettingsStore } from '@/store/settingsStore';
import type { Language, ThemePreference, UnitSystem } from '@/types/settings';

export default function SettingsScreen() {
  const t = useTranslation();
  const db = useSQLiteContext();
  const language = useSettingsStore((state) => state.language);
  const units = useSettingsStore((state) => state.units);
  const theme = useSettingsStore((state) => state.theme);

  function persist<Key extends 'language' | 'units' | 'theme'>(key: Key, value: Language | UnitSystem | ThemePreference) {
    void writeSetting(db, key, value).catch(() => undefined);
  }

  return (
    <Screen>
      <TopBar title={t('settingsTitle')} back />
      <SegmentedControl
        label={t('language')}
        value={language}
        onChange={(value) => {
          useSettingsStore.getState().setLanguage(value);
          persist('language', value);
        }}
        options={[
          { value: 'de', label: t('german') },
          { value: 'en', label: t('english') },
        ]}
      />
      <SegmentedControl
        label={t('units')}
        value={units}
        onChange={(value) => {
          useSettingsStore.getState().setUnits(value);
          persist('units', value);
        }}
        options={[
          { value: 'mm', label: 'mm' },
          { value: 'cm', label: 'cm' },
          { value: 'm', label: 'm' },
        ]}
      />
      <SegmentedControl
        label={t('appearance')}
        value={theme}
        onChange={(value) => {
          useSettingsStore.getState().setTheme(value);
          persist('theme', value);
        }}
        options={[
          { value: 'system', label: t('themeSystem') },
          { value: 'light', label: t('themeLight') },
          { value: 'dark', label: t('themeDark') },
        ]}
      />
    </Screen>
  );
}
