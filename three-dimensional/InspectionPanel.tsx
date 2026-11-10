import { Pressable, ScrollView, Text, View } from 'react-native';

import { useAppTheme } from '@/components/useAppTheme';
import { inspectionText } from '@/constants/inspectionCopy';
import type { Language } from '@/types/settings';

import type { FactGroup, InspectionRecord } from './inspection/inspectionTypes';

const groups: FactGroup[] = ['general', 'geometry', 'construction'];

type InspectionPanelProps = {
  record: InspectionRecord;
  language: Language;
  wide: boolean;
  canIsolate: boolean;
  onClear: () => void;
  onIsolate: () => void;
  onReveal: () => void;
};

export function InspectionPanel({ record, language, wide, canIsolate, onClear, onIsolate, onReveal }: InspectionPanelProps) {
  const theme = useAppTheme();
  const title = language === 'de' ? record.titleDe : record.titleEn;
  return (
    <View
      style={{
        width: wide ? 340 : undefined,
        maxHeight: wide ? undefined : 230,
        flex: wide ? undefined : undefined,
        borderRadius: theme.radius.card,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.line,
        padding: 12,
        gap: 8,
      }}
    >
      <Text style={{ color: theme.colors.ink, ...theme.type.title, fontSize: 18, lineHeight: 24 }}>{title}</Text>
      <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 10 }}>
        {groups.map((group) => {
          const facts = record.facts.filter((entry) => entry.group === group);
          if (facts.length === 0) {
            return null;
          }
          return (
            <View key={group} style={{ gap: 4 }}>
              <Text style={{ color: theme.colors.steel, ...theme.type.label }}>{inspectionText(language, group)}</Text>
              {facts.map((entry) => (
                <View key={`${group}-${entry.labelDe}`} style={{ gap: 1 }}>
                  <Text style={{ color: theme.colors.steel, fontSize: 13, lineHeight: 18 }}>
                    {language === 'de' ? entry.labelDe : entry.labelEn}
                  </Text>
                  <Text style={{ color: theme.colors.ink, fontSize: 15, lineHeight: 20 }}>
                    {language === 'de' ? entry.valueDe : entry.valueEn}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}
        <Text style={{ color: theme.colors.steel, fontSize: 13, lineHeight: 18 }}>{inspectionText(language, 'readonly')}</Text>
      </ScrollView>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <PanelButton label={inspectionText(language, 'clear')} onPress={onClear} />
        {canIsolate ? <PanelButton label={inspectionText(language, 'isolate')} onPress={onIsolate} /> : null}
        {canIsolate ? <PanelButton label={inspectionText(language, 'reveal')} onPress={onReveal} /> : null}
      </View>
    </View>
  );
}

function PanelButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        minHeight: 44,
        borderRadius: theme.radius.control,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.canvas,
        borderWidth: 1,
        borderColor: theme.colors.line,
      }}
    >
      <Text style={{ color: theme.colors.ink, fontSize: 14, lineHeight: 18, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}
