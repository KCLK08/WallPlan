import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { useAppTheme } from '@/components/useAppTheme';

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
};

export function Card({ children, onPress }: CardProps) {
  const theme = useAppTheme();
  const body = (
    <View
      style={[
        {
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius.card,
          borderWidth: 1,
          borderColor: theme.colors.line,
          padding: 18,
          gap: 8,
        },
        theme.shadow,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) {
    return body;
  }

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
      {body}
    </Pressable>
  );
}
