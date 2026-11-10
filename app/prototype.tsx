import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TopBar } from '@/components/TopBar';
import { useAppTheme } from '@/components/useAppTheme';
import { useTranslation } from '@/components/useTranslation';
import { PrototypeViewport } from '@/three-dimensional/PrototypeViewport';

export default function PrototypeScreen() {
  const theme = useAppTheme();
  const t = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.canvas, paddingTop: insets.top }}>
      <TopBar title={t('prototypeTitle')} back />
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{t('prototypeSubtitle')}</Text>
      </View>
      <View
        style={{
          flex: 1,
          marginHorizontal: 16,
          marginBottom: insets.bottom + 16,
          borderRadius: 24,
          overflow: 'hidden',
          backgroundColor: theme.colors.stage,
          borderWidth: 1,
          borderColor: theme.colors.line,
        }}
      >
        <PrototypeViewport />
      </View>
    </View>
  );
}
