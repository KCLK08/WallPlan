import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Text } from 'react-native';

import { ChoiceCard } from '@/components/configurator/ChoiceCard';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { useAppTheme } from '@/components/useAppTheme';
import { useTranslation } from '@/components/useTranslation';
import { constructionText, type ConstructionCopyKey } from '@/constants/constructionCopy';
import type { ConstructionKind } from '@/construction/wallModel';
import { constructionTypeChoices, createWallDraft } from '@/construction/wallRules';
import type { WallDraft } from '@/construction/wallModel';
import { ConstructionValidationError, saveConstruction } from '@/features/constructions/actions';
import { WallWizard } from '@/features/constructions/WallWizard';
import { useSettingsStore } from '@/store/settingsStore';

const typeCopy: Record<ConstructionKind, ConstructionCopyKey> = {
  'metal-stud-partition': 'typeMetal',
  'double-stud-partition': 'typeDouble',
  'independent-lining': 'typeLining',
  'suspended-ceiling': 'typeCeiling',
  'timber-framing': 'typeTimber',
};

export default function NewConstructionScreen() {
  const theme = useAppTheme();
  const t = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [draft, setDraft] = useState<WallDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function onSave() {
    if (!draft) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = await saveConstruction(db, draft);
      router.replace(`/project/${id}/construction/${saved.id}`);
    } catch (caught) {
      setError(caught instanceof ConstructionValidationError ? constructionText(language, 'constructionInvalid') : t('saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <TopBar title={constructionText(language, 'chooseType')} back />
      {draft ? (
        <WallWizard draft={draft} onChange={setDraft} onSave={() => void onSave()} saving={saving} saveError={error} />
      ) : (
        constructionTypeChoices().map((choice) => (
          <ChoiceCard
            key={choice.kind}
            title={constructionText(language, typeCopy[choice.kind])}
            body={
              choice.available
                ? constructionText(language, 'typeMetalBody')
                : choice.kind === 'double-stud-partition'
                  ? `${constructionText(language, 'typeDoubleBody')} ${constructionText(language, 'typeUnavailable')}`
                  : constructionText(language, 'typeUnavailable')
            }
            disabled={!choice.available}
            onPress={
              choice.available && id
                ? () => {
                    const next = createWallDraft(id);
                    setDraft(next);
                  }
                : undefined
            }
          />
        ))
      )}
      {!draft && error ? <Text style={{ color: theme.colors.danger, ...theme.type.body }}>{error}</Text> : null}
    </Screen>
  );
}
