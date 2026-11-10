import { Text, TextInput, View } from 'react-native';

import { useAppTheme } from '@/components/useAppTheme';

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  error?: string;
};

export function TextField({ label, value, onChangeText, placeholder, multiline = false, error }: TextFieldProps) {
  const theme = useAppTheme();

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: theme.colors.steel, ...theme.type.label }}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.steel}
        multiline={multiline}
        style={{
          minHeight: multiline ? 120 : 56,
          borderRadius: theme.radius.control,
          backgroundColor: theme.colors.card,
          borderWidth: 1,
          borderColor: error ? theme.colors.danger : theme.colors.line,
          paddingHorizontal: 16,
          paddingVertical: 14,
          color: theme.colors.ink,
          fontSize: 16,
          lineHeight: 22,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
      {error ? <Text style={{ color: theme.colors.danger, fontSize: 14, lineHeight: 20 }}>{error}</Text> : null}
    </View>
  );
}
