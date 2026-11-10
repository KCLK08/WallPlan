import { useCallback } from 'react';

import { translate, type MessageKey } from '@/constants/i18n';
import { useSettingsStore } from '@/store/settingsStore';

export function useTranslation(): (key: MessageKey) => string {
  const language = useSettingsStore((state) => state.language);
  return useCallback((key: MessageKey) => translate(language, key), [language]);
}
