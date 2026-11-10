import { router } from 'expo-router';
import { useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { ProjectCard } from '@/components/ProjectCard';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { TopBar } from '@/components/TopBar';
import { useAppTheme } from '@/components/useAppTheme';
import { useTranslation } from '@/components/useTranslation';
import { removeProject } from '@/features/projects/actions';
import { filterProjects, shouldDeleteProject } from '@/features/projects/projectRules';
import { useProjectsStore } from '@/store/projectsStore';
import type { Project } from '@/types/project';

export default function ProjectsScreen() {
  const theme = useAppTheme();
  const t = useTranslation();
  const db = useSQLiteContext();
  const projects = useProjectsStore((state) => state.projects);
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState<Project | null>(null);
  const [error, setError] = useState('');
  const visible = filterProjects(projects, query);

  async function confirmDelete() {
    if (!pending || !shouldDeleteProject('confirm')) {
      return;
    }
    const id = pending.id;
    setPending(null);
    try {
      await removeProject(db, id);
    } catch {
      setError(t('saveFailed'));
    }
  }

  return (
    <Screen>
      <TopBar title={t('projectsTitle')} back />
      <Button label={t('newProject')} onPress={() => router.push('/new-project')} />
      {projects.length > 0 ? (
        <TextField
          label={t('searchProjects')}
          value={query}
          placeholder={t('searchProjectsPlaceholder')}
          onChangeText={setQuery}
        />
      ) : null}
      {error ? <Text style={{ color: theme.colors.danger, ...theme.type.body }}>{error}</Text> : null}
      {projects.length === 0 ? (
        <View style={{ gap: 12 }}>
          <EmptyState title={t('emptyProjectsTitle')} body={t('emptyProjectsBody')} />
          <Button label={t('firstProject')} onPress={() => router.push('/new-project')} />
        </View>
      ) : visible.length === 0 ? (
        <EmptyState title={t('noSearchResultsTitle')} body={t('noSearchResultsBody')} />
      ) : (
        visible.map((project) => (
          <View key={project.id} style={{ gap: 8 }}>
            <ProjectCard project={project} onOpen={() => router.push(`/project/${project.id}`)} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <View style={{ flexGrow: 1, minWidth: 140 }}>
                <Button
                  label={t('renameProject')}
                  variant="secondary"
                  onPress={() => router.push(`/project/${project.id}/edit?mode=rename`)}
                />
              </View>
              <View style={{ flexGrow: 1, minWidth: 140 }}>
                <Button
                  label={t('editProject')}
                  variant="secondary"
                  onPress={() => router.push(`/project/${project.id}/edit`)}
                />
              </View>
              <View style={{ flexGrow: 1, minWidth: 140 }}>
                <Button label={t('deleteProject')} variant="danger" onPress={() => setPending(project)} />
              </View>
            </View>
          </View>
        ))
      )}
      <ConfirmDialog
        visible={pending !== null}
        title={t('deleteProjectTitle')}
        body={pending ? `${pending.name}. ${t('deleteProjectBody')}` : t('deleteProjectBody')}
        confirmLabel={t('confirmDelete')}
        cancelLabel={t('cancel')}
        onCancel={() => setPending(null)}
        onConfirm={() => void confirmDelete()}
      />
    </Screen>
  );
}
