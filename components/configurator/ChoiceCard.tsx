import { Pressable, Text, View } from 'react-native';

import { useAppTheme } from '@/components/useAppTheme';

type ChoiceCardProps = {
  title: string;
  body?: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
};

export function ChoiceCard({ title, body, selected = false, disabled = false, onPress }: ChoiceCardProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled || !onPress}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: disabled ? 0.55 : pressed ? 0.92 : 1 })}
    >
      <View
        style={{
          backgroundColor: selected ? theme.colors.accentMuted : theme.colors.card,
          borderRadius: theme.radius.card,
          borderWidth: 1,
          borderColor: selected ? theme.colors.accent : theme.colors.line,
          padding: 16,
          gap: 6,
          minHeight: 72,
        }}
      >
        <Text style={{ color: theme.colors.ink, fontSize: 17, lineHeight: 22, fontWeight: '700' }}>{title}</Text>
        {body ? <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{body}</Text> : null}
      </View>
    </Pressable>
  );
}
