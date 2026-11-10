import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Text } from 'react-native';

import { formatTimestamp } from '@/calculations/units';
import { calculateMaterials } from '@/calculations/material/materialCalculator';
import { MaterialList } from '@/components/materials/MaterialList';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { useAppTheme } from '@/components/useAppTheme';
import { useTranslation } from '@/components/useTranslation';
import { materialText } from '@/constants/materialCopy';
import { useProjectsStore } from '@/store/projectsStore';
import { useSettingsStore } from '@/store/settingsStore';

export default function MaterialListScreen() {
  const theme = useAppTheme();
  const t = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const { id, constructionId } = useLocalSearchParams<{ id: string; constructionId: string }>();
  const project = useProjectsStore((state) => state.projects.find((entry) => entry.id === id));
  const construction = project?.constructions.find((entry) => entry.id === constructionId);
  const wall = construction?.data ?? null;
  const updatedAt = construction?.updatedAt ?? null;
  const calculation = useMemo(
    () => (wall ? calculateMaterials(wall, { sourceUpdatedAt: updatedAt }) : null),
    [wall, updatedAt],
  );

  if (!project || !construction) {
    return (
      <Screen>
        <TopBar title={t('projectsTitle')} back />
        <EmptyState title={t('projectNotFoundTitle')} body={t('projectNotFoundBody')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title={materialText(language, 'title')} back />
      <Text style={{ color: theme.colors.ink, ...theme.type.title }}>{construction.name}</Text>
      <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{materialText(language, 'intro')}</Text>
      {calculation ? (
        <>
          <Text style={{ color: theme.colors.steel, ...theme.type.body }}>
            {materialText(language, 'version')} {calculation.calculationVersion}
          </Text>
          <Text style={{ color: theme.colors.steel, ...theme.type.body }}>
            {materialText(language, 'generated')} {formatTimestamp(calculation.generatedAt, language)}
          </Text>
          {calculation.sourceUpdatedAt ? (
            <Text style={{ color: theme.colors.steel, ...theme.type.body }}>
              {materialText(language, 'sourceUpdated')} {formatTimestamp(calculation.sourceUpdatedAt, language)}
            </Text>
          ) : null}
          <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{materialText(language, 'noWaste')}</Text>
          <MaterialList calculation={calculation} language={language} />
        </>
      ) : (
        <Text style={{ color: theme.colors.danger, ...theme.type.body }}>{materialText(language, 'dataMissing')}</Text>
      )}
    </Screen>
  );
}
