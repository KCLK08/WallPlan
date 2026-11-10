import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { OSB_PLUS_GYPSUM_SIDE_A } from '@/catalog/cladding';
import { assessCompatibility } from '@/catalog/compatibility';
import { findMaterial } from '@/catalog/materials';
import { findSource } from '@/catalog/sources';
import type { CompatibilityStatus } from '@/catalog/types';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { useAppTheme } from '@/components/useAppTheme';
import { useTranslation } from '@/components/useTranslation';
import type { MessageKey } from '@/constants/i18n';
import { useSettingsStore } from '@/store/settingsStore';

const statusKey: Record<CompatibilityStatus, MessageKey> = {
  compatible: 'statusCompatible',
  conditional: 'statusConditional',
  incompatible: 'statusIncompatible',
  'not-assessed': 'statusNotAssessed',
};

export default function MaterialScreen() {
  const theme = useAppTheme();
  const t = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = typeof id === 'string' ? findMaterial(id) : undefined;

  if (!item) {
    return (
      <Screen>
        <TopBar title={t('materialDetails')} back />
        <EmptyState title={t('catalogEmpty')} body={t('catalogLead')} />
      </Screen>
    );
  }

  const name = language === 'de' ? item.nameDe : item.nameEn;
  const description = language === 'de' ? item.descriptionDe : item.descriptionEn;
  const limits = language === 'de' ? item.limitationsDe : item.limitationsEn;
  const showLayers = item.id === 'gk-12-5' || item.id === 'board-osb3-15';

  return (
    <Screen>
      <TopBar title={name} back />
      <Text style={{ color: theme.colors.steel, ...theme.type.label }}>{item.id}</Text>
      <Text style={{ color: theme.colors.ink, ...theme.type.body }}>{description}</Text>
      <Card>
        <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>{t('materialDetails')}</Text>
        <Fact label={language === 'de' ? 'Dicke' : 'Thickness'} value={item.thicknessMm ? `${item.thicknessMm} mm` : t('materialNotRecorded')} />
        <Fact
          label={language === 'de' ? 'Längen' : 'Lengths'}
          value={item.standardLengthsMm ? item.standardLengthsMm.map((length) => `${length} mm`).join(', ') : t('materialNotRecorded')}
        />
        <Fact
          label={language === 'de' ? 'Formate' : 'Formats'}
          value={
            item.standardFormatsMm
              ? item.standardFormatsMm.map((format) => `${format.widthMm} × ${format.lengthMm} mm`).join(', ')
              : t('materialNotRecorded')
          }
        />
        {item.properties.map((property) => (
          <Fact key={property.key} label={language === 'de' ? property.labelDe : property.labelEn} value={property.value} />
        ))}
        {item.fastener ? (
          <Fact
            label={language === 'de' ? 'Gewinde und Untergrund' : 'Thread and substrate'}
            value={`${language === 'de' ? item.fastener.threadDe : item.fastener.threadEn}. ${
              language === 'de' ? item.fastener.substratesDe : item.fastener.substratesEn
            }`}
          />
        ) : null}
      </Card>
      <Card>
        <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>{t('materialUse')}</Text>
        <Text style={{ color: theme.colors.steel, ...theme.type.body }}>
          {item.suitableFor.length > 0 ? item.suitableFor.join(', ') : t('materialNotRecorded')}
        </Text>
      </Card>
      <Card>
        <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>{t('materialLimits')}</Text>
        <Text style={{ color: theme.colors.ink, ...theme.type.body }}>{limits}</Text>
      </Card>
      <Card>
        <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>{t('materialCompatibility')}</Text>
        {(item.compareWith ?? []).length === 0 ? (
          <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{t('statusNotAssessed')}</Text>
        ) : (
          item.compareWith?.map((partnerId) => {
            const partner = findMaterial(partnerId);
            const result = assessCompatibility(item.id, partnerId);
            return (
              <View key={partnerId} style={{ gap: 4, paddingTop: 8 }}>
                <Text style={{ color: theme.colors.ink, fontSize: 16, lineHeight: 22, fontWeight: '700' }}>
                  {partner ? (language === 'de' ? partner.nameDe : partner.nameEn) : partnerId}
                </Text>
                <Text style={{ color: statusColor(result.status, theme.colors), fontSize: 15, lineHeight: 20, fontWeight: '700' }}>
                  {t(statusKey[result.status])}
                </Text>
                <Text style={{ color: theme.colors.steel, ...theme.type.body }}>
                  {language === 'de' ? result.summaryDe : result.summaryEn}
                </Text>
              </View>
            );
          })
        )}
      </Card>
      {showLayers ? (
        <Card>
          <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>{t('materialLayers')}</Text>
          {OSB_PLUS_GYPSUM_SIDE_A.layers.map((layer) => {
            const layerItem = findMaterial(layer.catalogItemId);
            return (
              <Text key={layer.id} style={{ color: theme.colors.ink, ...theme.type.body }}>
                {layer.orderFromFraming}. {layerItem ? (language === 'de' ? layerItem.nameDe : layerItem.nameEn) : layer.catalogItemId}
              </Text>
            );
          })}
        </Card>
      ) : null}
      <Card>
        <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>{t('materialSources')}</Text>
        {item.sourceIds.map((sourceId) => {
          const source = findSource(sourceId);
          return (
            <Text key={sourceId} style={{ color: theme.colors.steel, ...theme.type.body }}>
              {source ? source.title : sourceId}
            </Text>
          );
        })}
      </Card>
    </Screen>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ color: theme.colors.steel, ...theme.type.label }}>{label}</Text>
      <Text style={{ color: theme.colors.ink, ...theme.type.body }}>{value}</Text>
    </View>
  );
}

function statusColor(status: CompatibilityStatus, colors: { accentPressed: string; accent: string; danger: string; steel: string }): string {
  if (status === 'compatible') {
    return colors.accentPressed;
  }
  if (status === 'conditional') {
    return colors.accent;
  }
  if (status === 'incompatible') {
    return colors.danger;
  }
  return colors.steel;
}
