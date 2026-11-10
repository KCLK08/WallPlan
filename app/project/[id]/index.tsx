import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Text, View } from 'react-native';

import { formatTimestamp } from '@/calculations/units';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { useAppTheme } from '@/components/useAppTheme';
import { useTranslation } from '@/components/useTranslation';
import { removeProject } from '@/features/projects/actions';
import { shouldDeleteProject } from '@/features/projects/projectRules';
import { useProjectsStore } from '@/store/projectsStore';
import { useSettingsStore } from '@/store/settingsStore';

export default function ProjectScreen() {
  const theme = useAppTheme();
  const t = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const project = useProjectsStore((state) => state.projects.find((entry) => entry.id === id));
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  if (!project) {
    return (
      <Screen>
        <TopBar title={t('projectsTitle')} back />
        <EmptyState title={t('projectNotFoundTitle')} body={t('projectNotFoundBody')} />
      </Screen>
    );
  }

  async function confirmDelete() {
    if (!project || !shouldDeleteProject('confirm')) {
      return;
    }
    setConfirming(false);
    try {
      await removeProject(db, project.id);
      router.replace('/projects');
    } catch {
      setError(t('saveFailed'));
    }
  }

  return (
    <Screen>
      <TopBar title={project.name} back />
      <View style={{ gap: 6 }}>
        <Text style={{ color: theme.colors.ink, ...theme.type.title }}>{project.name}</Text>
        <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{project.description || t('noDescription')}</Text>
      </View>
      <View style={{ gap: 4 }}>
        <Text style={{ color: theme.colors.steel, ...theme.type.body }}>
          {t('createdOn')} {formatTimestamp(project.createdAt, language)}
        </Text>
        <Text style={{ color: theme.colors.steel, ...theme.type.body }}>
          {t('updatedOn')} {formatTimestamp(project.updatedAt, language)}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <View style={{ flexGrow: 1, minWidth: 160 }}>
          <Button label={t('editProject')} variant="secondary" onPress={() => router.push(`/project/${project.id}/edit`)} />
        </View>
        <View style={{ flexGrow: 1, minWidth: 160 }}>
          <Button
            label={t('renameProject')}
            variant="secondary"
            onPress={() => router.push(`/project/${project.id}/edit?mode=rename`)}
          />
        </View>
      </View>
      {project.constructions.length === 0 ? (
        <EmptyState title={t('noConstructionsTitle')} body={t('noConstructionsBody')} />
      ) : (
        project.constructions.map((construction) => (
          <Text key={construction.id} style={{ color: theme.colors.ink, ...theme.type.body }}>
            {construction.name || construction.type}
          </Text>
        ))
      )}
      <Button label={t('addConstruction')} disabled onPress={() => undefined} />
      <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{t('addConstructionLater')}</Text>
      {error ? <Text style={{ color: theme.colors.danger, ...theme.type.body }}>{error}</Text> : null}
      <Button label={t('deleteProject')} variant="danger" onPress={() => setConfirming(true)} />
      <ConfirmDialog
        visible={confirming}
        title={t('deleteProjectTitle')}
        body={`${project.name}. ${t('deleteProjectBody')}`}
        confirmLabel={t('confirmDelete')}
        cancelLabel={t('cancel')}
        onCancel={() => setConfirming(false)}
        onConfirm={() => void confirmDelete()}
      />
    </Screen>
  );
}
