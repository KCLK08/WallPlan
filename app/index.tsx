import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ProjectCard } from '@/components/ProjectCard';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { useAppTheme } from '@/components/useAppTheme';
import { useTranslation } from '@/components/useTranslation';
import { formatTimestamp } from '@/calculations/units';
import { useProjectsStore } from '@/store/projectsStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { Project } from '@/types/project';

export default function HomeScreen() {
  const theme = useAppTheme();
  const t = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const { width } = useWindowDimensions();
  const isWide = width >= 840;
  const projects = useProjectsStore((state) => state.projects);
  const recent = projects.slice(0, 3);

  return (
    <Screen>
      <TopBar title={t('appName')} settings />
      <View style={isWide ? { flexDirection: 'row', gap: 20, alignItems: 'flex-start' } : { gap: 16 }}>
        <View style={{ flex: isWide ? 1 : undefined, gap: 16, width: '100%' }}>
          <View style={{ gap: 8, paddingHorizontal: 4 }}>
            <Text style={{ color: theme.colors.accentPressed, ...theme.type.label }}>{t('homeGreeting')}</Text>
            <Text style={{ color: theme.colors.ink, ...theme.type.display }}>{t('appName')}</Text>
            <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{t('homeLead')}</Text>
          </View>
          <Button label={t('newProject')} onPress={() => router.push('/new-project')} />
        </View>
        <View style={{ flex: isWide ? 1 : undefined, gap: 16, width: '100%' }}>
          <Section title={t('recent')}>
            {recent.length === 0 ? (
              <EmptyState title={t('emptyRecentTitle')} body={t('emptyRecentBody')} />
            ) : (
              recent.map((project) => (
                <ProjectCard key={project.id} project={project} onOpen={() => router.push(`/project/${project.id}`)} />
              ))
            )}
          </Section>
          <Section title={t('myProjects')} action={t('allProjects')} onAction={() => router.push('/projects')}>
            {projects.length === 0 ? (
              <View style={{ gap: 12 }}>
                <EmptyState title={t('emptyProjectsTitle')} body={t('emptyProjectsBody')} />
                <Button label={t('firstProject')} onPress={() => router.push('/new-project')} />
              </View>
            ) : (
              projects.slice(0, 3).map((project) => (
                <CompactProject key={project.id} project={project} date={formatTimestamp(project.updatedAt, language)} />
              ))
            )}
          </Section>
          <Section title={t('moreTools')}>
            <Card onPress={() => router.push('/catalog')}>
              <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>{t('catalogTitle')}</Text>
              <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{t('catalogLead')}</Text>
            </Card>
            <Card onPress={() => router.push('/prototype')}>
              <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>{t('prototypeTitle')}</Text>
              <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{t('prototypeSubtitle')}</Text>
            </Card>
          </Section>
        </View>
      </View>
    </Screen>
  );
}

function CompactProject({ project, date }: { project: Project; date: string }) {
  const theme = useAppTheme();
  const t = useTranslation();

  return (
    <Card onPress={() => router.push(`/project/${project.id}`)}>
      <Text style={{ color: theme.colors.ink, fontSize: 17, lineHeight: 22, fontWeight: '700' }}>{project.name}</Text>
      <Text style={{ color: theme.colors.steel, ...theme.type.body }} numberOfLines={2}>
        {project.description || t('noDescription')}
      </Text>
      <Text style={{ color: theme.colors.steel, fontSize: 13, lineHeight: 18 }}>
        {t('updatedOn')} {date}
      </Text>
    </Card>
  );
}

function Section({
  title,
  action,
  onAction,
  children,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  const theme = useAppTheme();

  return (
    <View style={{ gap: 12 }}>
      <View style={{ minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>{title}</Text>
        {action && onAction ? (
          <Pressable accessibilityRole="button" onPress={onAction} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text style={{ color: theme.colors.accentPressed, fontSize: 15, lineHeight: 20, fontWeight: '700' }}>{action}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}
