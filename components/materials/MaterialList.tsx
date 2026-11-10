import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { useAppTheme } from '@/components/useAppTheme';
import type { CalculationGroup, CalculationStatus, MaterialCalculation, MaterialLine } from '@/calculations/material/types';
import { materialGroupLabel, materialStatusLabel, materialText, materialUnitLabel } from '@/constants/materialCopy';
import type { Language } from '@/types/settings';

const groups: CalculationGroup[] = ['framing', 'cladding-a', 'cladding-b', 'insulation', 'fasteners', 'other'];

const settled: CalculationStatus[] = ['calculable', 'conditional', 'not-applicable'];

export function MaterialList({ calculation, language }: { calculation: MaterialCalculation; language: Language }) {
  const theme = useAppTheme();
  const incomplete = calculation.lines.filter((entry) => entry.status === 'incomplete');

  return (
    <View style={{ gap: 16 }}>
      {groups.map((group) => {
        const lines = calculation.lines.filter((entry) => entry.group === group && settled.includes(entry.status));
        return (
          <View key={group} style={{ gap: 8 }}>
            <Text style={{ color: theme.colors.ink, ...theme.type.title }}>{materialGroupLabel(language, group)}</Text>
            {lines.length === 0 ? (
              <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{materialText(language, 'groupEmpty')}</Text>
            ) : (
              lines.map((entry) => <MaterialRow key={entry.id} line={entry} language={language} />)
            )}
          </View>
        );
      })}
      <View style={{ gap: 8 }}>
        <Text style={{ color: theme.colors.ink, ...theme.type.title }}>{materialText(language, 'incompleteTitle')}</Text>
        <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{materialText(language, 'incompleteBody')}</Text>
        {incomplete.map((entry) => (
          <MaterialRow key={entry.id} line={entry} language={language} groupLabel={materialGroupLabel(language, entry.group)} />
        ))}
      </View>
    </View>
  );
}

function MaterialRow({ line, language, groupLabel }: { line: MaterialLine; language: Language; groupLabel?: string }) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const name = language === 'de' ? line.nameDe : line.nameEn;
  const basis = language === 'de' ? line.basisDe : line.basisEn;
  const assumptions = language === 'de' ? line.assumptionsDe : line.assumptionsEn;
  const warnings = language === 'de' ? line.warningsDe : line.warningsEn;
  const statusColor = line.status === 'incomplete' ? theme.colors.danger : line.status === 'conditional' ? theme.colors.accentPressed : theme.colors.steel;

  return (
    <Card>
      <Pressable accessibilityRole="button" onPress={() => setOpen((value) => !value)} style={{ gap: 6 }}>
        {groupLabel ? <Text style={{ color: theme.colors.steel, ...theme.type.label }}>{groupLabel}</Text> : null}
        <Text style={{ color: theme.colors.ink, fontSize: 17, lineHeight: 22, fontWeight: '700' }}>{name}</Text>
        <Text style={{ color: theme.colors.ink, ...theme.type.body }}>{quantityText(line, language)}</Text>
        <Text style={{ color: statusColor, ...theme.type.label }}>{materialStatusLabel(language, line.status)}</Text>
        <Text style={{ color: theme.colors.steel, ...theme.type.label }}>{materialText(language, 'basis')}</Text>
        <Text style={{ color: theme.colors.ink, ...theme.type.body }}>{basis}</Text>
      </Pressable>
      {open ? (
        <View style={{ gap: 8 }}>
          {assumptions.length > 0 ? (
            <View style={{ gap: 4 }}>
              <Text style={{ color: theme.colors.steel, ...theme.type.label }}>{materialText(language, 'assumptions')}</Text>
              {assumptions.map((assumption) => (
                <Text key={assumption} style={{ color: theme.colors.ink, ...theme.type.body }}>
                  {assumption}
                </Text>
              ))}
            </View>
          ) : null}
          {warnings.length > 0 ? (
            <View style={{ gap: 4 }}>
              <Text style={{ color: theme.colors.steel, ...theme.type.label }}>{materialText(language, 'warnings')}</Text>
              {warnings.map((warning) => (
                <Text key={warning} style={{ color: theme.colors.ink, ...theme.type.body }}>
                  {warning}
                </Text>
              ))}
            </View>
          ) : null}
          <Text style={{ color: theme.colors.steel, ...theme.type.body }}>
            {materialText(language, 'catalog')}: {line.catalogItemId ?? materialText(language, 'none')}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

function quantityText(line: MaterialLine, language: Language): string {
  if (line.theoretical === null || line.unit === null) {
    return materialText(language, 'noQuantity');
  }
  const locale = language === 'de' ? 'de-DE' : 'en-GB';
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 });
  const unit = materialUnitLabel(language, line.unit);
  const theoretical = `${materialText(language, 'theoretical')}: ${format.format(line.theoretical)} ${unit}`;
  if (line.planning === null) {
    return theoretical;
  }
  return `${theoretical}\n${materialText(language, 'planning')}: ${format.format(line.planning)} ${unit}`;
}
