import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useAppTheme } from '@/components/useAppTheme';
import { useTranslation } from '@/components/useTranslation';

import { BackMark, SettingsMark } from './Marks';

type TopBarProps = {
  title: string;
  back?: boolean;
  settings?: boolean;
};

export function TopBar({ title, back = false, settings = false }: TopBarProps) {
  const theme = useAppTheme();
  const t = useTranslation();

  return (
    <View style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
      {back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('back')}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
              return;
            }
            router.replace('/');
          }}
          style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
        >
          <BackMark color={theme.colors.ink} />
        </Pressable>
      ) : (
        <View style={{ width: 48 }} />
      )}
      <Text
        style={{
          flex: 1,
          textAlign: 'center',
          color: theme.colors.ink,
          fontSize: 18,
          lineHeight: 24,
          fontWeight: '700',
        }}
      >
        {title}
      </Text>
      {settings ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('settings')}
          onPress={() => router.push('/settings')}
          style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
        >
          <SettingsMark color={theme.colors.ink} />
        </Pressable>
      ) : (
        <View style={{ width: 48 }} />
      )}
    </View>
  );
}
