import { router } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ProjectCard } from '@/components/ProjectCard';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { useTranslation } from '@/components/useTranslation';
import { useProjectsStore } from '@/store/projectsStore';

export default function ProjectsScreen() {
  const t = useTranslation();
  const projects = useProjectsStore((state) => state.projects);

  return (
    <Screen>
      <TopBar title={t('projectsTitle')} back />
      {projects.length === 0 ? (
        <EmptyState title={t('emptyProjectsTitle')} body={t('emptyProjectsBody')} />
      ) : (
        <View style={{ gap: 12 }}>
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </View>
      )}
      <Button label={t('newProject')} onPress={() => router.push('/new-project')} />
    </Screen>
  );
}
