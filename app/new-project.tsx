import { router } from 'expo-router';
import { useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { TopBar } from '@/components/TopBar';
import { useTranslation } from '@/components/useTranslation';
import { createProject } from '@/features/projects/actions';

export default function NewProjectScreen() {
  const t = useTranslation();
  const db = useSQLiteContext();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function onCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('nameRequired'));
      return;
    }
    setSaving(true);
    try {
      await createProject(db, { name: trimmed, description });
      router.replace('/projects');
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
        error={error}
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
      <Button label={t('createProject')} onPress={() => void onCreate()} disabled={saving} />
    </Screen>
  );
}
