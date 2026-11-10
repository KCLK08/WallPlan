import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { searchMaterials } from '@/catalog/query';
import { CATALOG_TAXONOMY } from '@/catalog/taxonomy';
import { CATALOG_VERSION } from '@/catalog/version';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { TopBar } from '@/components/TopBar';
import { useAppTheme } from '@/components/useAppTheme';
import { useTranslation } from '@/components/useTranslation';
import { useSettingsStore } from '@/store/settingsStore';

export default function CatalogScreen() {
  const theme = useAppTheme();
  const t = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const [query, setQuery] = useState('');
  const results = query.trim() ? searchMaterials(query) : [];

  return (
    <Screen>
      <TopBar title={t('catalogTitle')} back />
      <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{t('catalogLead')}</Text>
      <Text style={{ color: theme.colors.steel, ...theme.type.label }}>
        {t('catalogVersion')} {CATALOG_VERSION}
      </Text>
      <TextField label={t('catalogSearch')} value={query} onChangeText={setQuery} placeholder={t('catalogSearchPlaceholder')} />
      {query.trim() ? (
        results.length === 0 ? (
          <Text style={{ color: theme.colors.ink, ...theme.type.body }}>{t('catalogEmpty')}</Text>
        ) : (
          results.map((item) => (
            <Card key={item.id} onPress={() => router.push(`/material/${item.id}`)}>
              <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>
                {language === 'de' ? item.nameDe : item.nameEn}
              </Text>
              <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{item.id}</Text>
            </Card>
          ))
        )
      ) : (
        CATALOG_TAXONOMY.map((category) => (
          <Card key={category.id} onPress={() => router.push(`/catalog/${category.id}`)}>
            <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>
              {language === 'de' ? category.nameDe : category.nameEn}
            </Text>
            <Text style={{ color: theme.colors.accentPressed, fontSize: 15, lineHeight: 20, fontWeight: '700' }}>
              {category.groups.length}
            </Text>
          </Card>
        ))
      )}
    </Screen>
  );
}
