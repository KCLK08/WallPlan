import { Pressable, Text, View } from 'react-native';

import { useAppTheme } from '@/components/useAppTheme';

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  label: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ label, value, options, onChange }: SegmentedControlProps<T>) {
  const theme = useAppTheme();

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: theme.colors.steel, ...theme.type.label }}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={{
                flex: 1,
                minHeight: 52,
                borderRadius: theme.radius.control,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 8,
                backgroundColor: selected ? theme.colors.accent : theme.colors.card,
                borderWidth: 1,
                borderColor: selected ? theme.colors.accent : theme.colors.line,
              }}
            >
              <Text
                style={{
                  color: selected ? theme.colors.onAccent : theme.colors.ink,
                  fontSize: 15,
                  lineHeight: 20,
                  fontWeight: '700',
                  textAlign: 'center',
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
