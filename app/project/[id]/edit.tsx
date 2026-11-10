import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Text } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { TopBar } from '@/components/TopBar';
import { useAppTheme } from '@/components/useAppTheme';
import { useTranslation } from '@/components/useTranslation';
import { ProjectValidationError, saveProject } from '@/features/projects/actions';
import { useProjectsStore } from '@/store/projectsStore';

export default function EditProjectScreen() {
  const theme = useAppTheme();
  const t = useTranslation();
  const db = useSQLiteContext();
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const project = useProjectsStore((state) => state.projects.find((entry) => entry.id === id));
  const renameOnly = mode === 'rename';
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!project) {
    return (
      <Screen>
        <TopBar title={t('editTitle')} back />
        <EmptyState title={t('projectNotFoundTitle')} body={t('projectNotFoundBody')} />
      </Screen>
    );
  }

  async function onSave() {
    if (!project) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = await saveProject(db, project.id, {
        name,
        description: renameOnly ? project.description : description,
      });
      router.replace(`/project/${saved.id}`);
    } catch (caught) {
      setError(caught instanceof ProjectValidationError ? t('nameRequired') : t('saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <TopBar title={renameOnly ? t('renameTitle') : t('editTitle')} back />
      <TextField
        label={t('projectName')}
        value={name}
        placeholder={t('projectNamePlaceholder')}
        error={error === t('nameRequired') ? error : undefined}
        onChangeText={(value) => {
          setName(value.slice(0, 80));
          if (error) {
            setError('');
          }
        }}
      />
      {renameOnly ? null : (
        <TextField
          label={t('description')}
          value={description}
          placeholder={t('descriptionPlaceholder')}
          multiline
          onChangeText={(value) => setDescription(value.slice(0, 400))}
        />
      )}
      {error && error !== t('nameRequired') ? (
        <Text style={{ color: theme.colors.danger, ...theme.type.body }}>{error}</Text>
      ) : null}
      <Button label={saving ? t('saving') : t('save')} onPress={() => void onSave()} disabled={saving} />
    </Screen>
  );
}
