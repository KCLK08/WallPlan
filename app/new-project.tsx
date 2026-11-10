import { router } from 'expo-router';
import { useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Text } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { TopBar } from '@/components/TopBar';
import { useAppTheme } from '@/components/useAppTheme';
import { useTranslation } from '@/components/useTranslation';
import { createProject, ProjectValidationError } from '@/features/projects/actions';

export default function NewProjectScreen() {
  const theme = useAppTheme();
  const t = useTranslation();
  const db = useSQLiteContext();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function onCreate() {
    setSaving(true);
    setError('');
    try {
      const project = await createProject(db, { name, description });
      router.replace(`/project/${project.id}`);
    } catch (caught) {
      setError(caught instanceof ProjectValidationError ? t('nameRequired') : t('saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <TopBar title={t('newProjectTitle')} back />
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
      <TextField
        label={t('description')}
        value={description}
        placeholder={t('descriptionPlaceholder')}
        multiline
        onChangeText={(value) => setDescription(value.slice(0, 400))}
      />
      {error && error !== t('nameRequired') ? (
        <Text style={{ color: theme.colors.danger, ...theme.type.body }}>{error}</Text>
      ) : null}
      <Button label={saving ? t('saving') : t('createProject')} onPress={() => void onCreate()} disabled={saving} />
    </Screen>
  );
}
