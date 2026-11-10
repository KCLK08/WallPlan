import { useEffect, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAppTheme } from '@/components/useAppTheme';
import { initializeDatabase } from '@/database/initialize';
import { listProjects } from '@/database/projectsRepository';
import { readSettings } from '@/database/settingsRepository';
import { useProjectsStore } from '@/store/projectsStore';
import { useSettingsStore } from '@/store/settingsStore';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider databaseName="wallplan.db" onInit={initializeDatabase}>
        <DatabaseGate>{children}</DatabaseGate>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}

function DatabaseGate({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const theme = useAppTheme();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const settings = await readSettings(db);
        if (cancelled) {
          return;
        }
        useSettingsStore.getState().hydrate(settings);
        const projects = await listProjects(db);
        if (cancelled) {
          return;
        }
        useProjectsStore.getState().setProjects(projects);
      } catch {
        if (!cancelled) {
          setLoadFailed(true);
        }
      } finally {
        if (!cancelled) {
          setReady(true);
          await SplashScreen.hideAsync();
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [db]);

  useEffect(() => {
    if (ready) {
      void SystemUI.setBackgroundColorAsync(theme.colors.canvas);
    }
  }, [ready, theme.colors.canvas]);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: '#1C1F24' }} />;
  }

  if (loadFailed) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.canvas, justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: theme.colors.ink, fontSize: 22, lineHeight: 28, fontWeight: '700' }}>WallPlan</Text>
        <Text style={{ color: theme.colors.steel, fontSize: 16, lineHeight: 24, marginTop: 12 }}>
          Die lokalen Daten konnten nicht geladen werden. Bitte die App erneut öffnen.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.canvas }}>
      <StatusBar style={theme.statusBar} />
      {children}
    </View>
  );
}
