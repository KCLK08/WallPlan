import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConstructionSwitch } from '@/components/ConstructionSwitch';
import { EmptyState } from '@/components/EmptyState';
import { TopBar } from '@/components/TopBar';
import { useAppTheme } from '@/components/useAppTheme';
import { useTranslation } from '@/components/useTranslation';
import { drawingText } from '@/constants/drawingCopy';
import { useProjectsStore } from '@/store/projectsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { DrawingViewport } from '@/two-dimensional/DrawingViewport';

export default function DrawingScreen() {
  const theme = useAppTheme();
  const t = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const insets = useSafeAreaInsets();
  const { id, constructionId } = useLocalSearchParams<{ id: string; constructionId: string }>();
  const project = useProjectsStore((state) => state.projects.find((entry) => entry.id === id));
  const construction = project?.constructions.find((entry) => entry.id === constructionId);
  const wall = construction?.data ?? null;

  if (!project || !construction || !id || !constructionId) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.canvas, paddingTop: insets.top }}>
        <TopBar title={t('projectsTitle')} back />
        <EmptyState title={t('projectNotFoundTitle')} body={t('projectNotFoundBody')} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.canvas, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <TopBar title={drawingText(language, 'title')} back />
      {wall ? (
        <View style={{ flex: 1, paddingHorizontal: 16, gap: 8 }}>
          <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>{construction.name}</Text>
          <ConstructionSwitch projectId={id} constructionId={constructionId} current="drawing" />
          <DrawingViewport wall={wall} />
        </View>
      ) : (
        <Text style={{ color: theme.colors.danger, ...theme.type.body, paddingHorizontal: 16 }}>{drawingText(language, 'dataMissing')}</Text>
      )}
    </View>
  );
}
