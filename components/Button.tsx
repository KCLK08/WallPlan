import { Pressable, Text } from 'react-native';

import { useAppTheme } from '@/components/useAppTheme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  const theme = useAppTheme();
  const background =
    variant === 'primary' ? theme.colors.accent : variant === 'ghost' ? 'transparent' : theme.colors.card;
  const color = variant === 'primary' ? theme.colors.onAccent : variant === 'danger' ? theme.colors.danger : theme.colors.ink;
  const borderColor = variant === 'danger' ? theme.colors.danger : variant === 'primary' ? 'transparent' : theme.colors.line;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 56,
        borderRadius: theme.radius.control,
        backgroundColor: pressed && variant === 'primary' ? theme.colors.accentPressed : background,
        borderWidth: variant === 'ghost' ? 0 : 1,
        borderColor,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        opacity: disabled ? 0.45 : 1,
      })}
    >
      <Text style={{ color, fontSize: 17, lineHeight: 22, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}
