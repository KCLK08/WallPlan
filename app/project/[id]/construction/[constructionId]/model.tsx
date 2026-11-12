import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConstructionSwitch } from '@/components/ConstructionSwitch';
import { EmptyState } from '@/components/EmptyState';
import { TopBar } from '@/components/TopBar';
import { useAppTheme } from '@/components/useAppTheme';
import { useTranslation } from '@/components/useTranslation';
import { modelText } from '@/constants/modelCopy';
import { SavedWallViewport } from '@/three-dimensional/SavedWallViewport';
import { useProjectsStore } from '@/store/projectsStore';
import { useSettingsStore } from '@/store/settingsStore';

export default function WallModelScreen() {
  const theme = useAppTheme();
  const t = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const insets = useSafeAreaInsets();
  const { id, constructionId } = useLocalSearchParams<{ id: string; constructionId: string }>();
  const project = useProjectsStore((state) => state.projects.find((entry) => entry.id === id));
  const construction = project?.constructions.find((entry) => entry.id === constructionId);
  const wall = construction?.data ?? null;
  const view = useMemo(() => wall, [wall]);

  if (!project || !construction) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.canvas, paddingTop: insets.top }}>
        <TopBar title={t('projectsTitle')} back />
        <EmptyState title={t('projectNotFoundTitle')} body={t('projectNotFoundBody')} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.canvas, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <TopBar title={modelText(language, 'title')} back />
      {view ? (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>{construction.name}</Text>
          <ConstructionSwitch projectId={id} constructionId={constructionId} current="model" />
          <SavedWallViewport wall={view} />
        </View>
      ) : (
        <Text style={{ color: theme.colors.danger, ...theme.type.body, paddingHorizontal: 16 }}>{modelText(language, 'dataMissing')}</Text>
      )}
    </View>
  );
}
