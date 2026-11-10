import { Text } from 'react-native';

import { formatTimestamp } from '@/calculations/units';
import { Card } from '@/components/Card';
import { useAppTheme } from '@/components/useAppTheme';
import { useTranslation } from '@/components/useTranslation';
import { useSettingsStore } from '@/store/settingsStore';
import type { Project } from '@/types/project';

export function ProjectCard({ project }: { project: Project }) {
  const theme = useAppTheme();
  const t = useTranslation();
  const language = useSettingsStore((state) => state.language);

  return (
    <Card>
      <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>{project.name}</Text>
      <Text style={{ color: theme.colors.steel, ...theme.type.body }}>
        {project.description || t('noDescription')}
      </Text>
      <Text style={{ color: theme.colors.steel, fontSize: 13, lineHeight: 18 }}>
        {formatTimestamp(project.updatedAt, language)}
      </Text>
    </Card>
  );
}
