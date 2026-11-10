import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { materialsIn } from '@/catalog/query';
import { CATALOG_TAXONOMY } from '@/catalog/taxonomy';
import type { MaterialCategory } from '@/catalog/types';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { useAppTheme } from '@/components/useAppTheme';
import { useTranslation } from '@/components/useTranslation';
import { useSettingsStore } from '@/store/settingsStore';

export default function CatalogGroupScreen() {
  const theme = useAppTheme();
  const t = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const { group } = useLocalSearchParams<{ group: string }>();
  const category = CATALOG_TAXONOMY.find((entry) => entry.id === group);

  if (!category) {
    return (
      <Screen>
        <TopBar title={t('catalogTitle')} back />
        <EmptyState title={t('catalogEmpty')} body={t('catalogLead')} />
      </Screen>
    );
  }

  const items = materialsIn(category.id as MaterialCategory);

  return (
    <Screen>
      <TopBar title={language === 'de' ? category.nameDe : category.nameEn} back />
      {category.groups.map((subcategory) => {
        const groupItems = items.filter((item) => item.subcategory === subcategory.id);
        return (
          <View key={subcategory.id} style={{ gap: 12 }}>
            <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>
              {language === 'de' ? subcategory.nameDe : subcategory.nameEn}
            </Text>
            {groupItems.map((item) => (
              <Card key={item.id} onPress={() => router.push(`/material/${item.id}`)}>
                <Text style={{ color: theme.colors.ink, fontSize: 17, lineHeight: 24, fontWeight: '700' }}>
                  {language === 'de' ? item.nameDe : item.nameEn}
                </Text>
                <Text style={{ color: theme.colors.steel, ...theme.type.body }}>
                  {language === 'de' ? item.descriptionDe : item.descriptionEn}
                </Text>
              </Card>
            ))}
          </View>
        );
      })}
    </Screen>
  );
}
