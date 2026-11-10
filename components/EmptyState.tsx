import { Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { useAppTheme } from '@/components/useAppTheme';

type EmptyStateProps = {
  title: string;
  body: string;
};

export function EmptyState({ title, body }: EmptyStateProps) {
  const theme = useAppTheme();

  return (
    <Card>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          backgroundColor: theme.colors.accentMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: theme.colors.accentPressed, fontSize: 20, fontWeight: '700' }}>W</Text>
      </View>
      <Text style={{ color: theme.colors.ink, ...theme.type.title, fontSize: 18, lineHeight: 24 }}>{title}</Text>
      <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{body}</Text>
    </Card>
  );
}
