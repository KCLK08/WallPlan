import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ProjectCard } from '@/components/ProjectCard';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { useAppTheme } from '@/components/useAppTheme';
import { useTranslation } from '@/components/useTranslation';
import { useProjectsStore } from '@/store/projectsStore';

export default function HomeScreen() {
  const theme = useAppTheme();
  const t = useTranslation();
  const { width } = useWindowDimensions();
  const isWide = width >= 840;
  const projects = useProjectsStore((state) => state.projects);
  const recent = projects[0];

  return (
    <Screen>
      <TopBar title={t('appName')} settings />
      <View style={isWide ? { flexDirection: 'row', gap: 20, alignItems: 'flex-start' } : { gap: 16 }}>
        <View style={{ flex: 1, gap: 16, width: '100%' }}>
          <View style={{ gap: 8, paddingHorizontal: 4 }}>
            <Text style={{ color: theme.colors.accentPressed, ...theme.type.label }}>{t('homeEyebrow')}</Text>
            <Text style={{ color: theme.colors.ink, ...theme.type.display }}>{t('appName')}</Text>
            <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{t('homeLead')}</Text>
          </View>
          <Button label={t('newProject')} onPress={() => router.push('/new-project')} />
          <Card onPress={() => router.push('/prototype')}>
            <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>
              {t('prototypeTitle')}
            </Text>
            <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{t('prototypeSubtitle')}</Text>
            <Text style={{ color: theme.colors.accentPressed, fontSize: 15, lineHeight: 20, fontWeight: '700' }}>
              {t('openPrototype')}
            </Text>
          </Card>
        </View>
        <View style={{ flex: 1, gap: 16, width: '100%' }}>
          <Section
            title={t('myProjects')}
            action={projects.length > 0 ? t('seeAll') : undefined}
            onAction={() => router.push('/projects')}
          >
            {projects.length === 0 ? (
              <EmptyState title={t('emptyProjectsTitle')} body={t('emptyProjectsBody')} />
            ) : (
              projects.slice(0, 2).map((project) => <ProjectCard key={project.id} project={project} />)
            )}
          </Section>
          <Section title={t('recent')}>
            {recent ? (
              <ProjectCard project={recent} />
            ) : (
              <EmptyState title={t('emptyRecentTitle')} body={t('emptyRecentBody')} />
            )}
          </Section>
        </View>
      </View>
    </Screen>
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
      <View style={{ minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>{title}</Text>
        {action && onAction ? (
          <Text
            accessibilityRole="button"
            onPress={onAction}
            style={{ color: theme.colors.accentPressed, fontSize: 15, lineHeight: 20, fontWeight: '700' }}
          >
            {action}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}
