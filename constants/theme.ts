import type { TextStyle, ViewStyle } from 'react-native';

export const accent = '#E88935';

export type ThemeMode = 'light' | 'dark';

export type AppTheme = {
  mode: ThemeMode;
  statusBar: 'light' | 'dark';
  colors: {
    canvas: string;
    card: string;
    ink: string;
    steel: string;
    line: string;
    accent: string;
    accentPressed: string;
    onAccent: string;
    accentMuted: string;
    danger: string;
    stage: string;
    stageInk: string;
  };
  shadow: ViewStyle;
  radius: {
    card: number;
    control: number;
  };
  type: {
    display: TextStyle;
    title: TextStyle;
    body: TextStyle;
    label: TextStyle;
  };
};

const type = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700' } satisfies TextStyle,
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' } satisfies TextStyle,
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' } satisfies TextStyle,
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0.4,
  } satisfies TextStyle,
};

const lightShadow: ViewStyle = {
  shadowColor: '#1C1F24',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 3,
};

export const lightTheme: AppTheme = {
  mode: 'light',
  statusBar: 'dark',
  colors: {
    canvas: '#F3F4F6',
    card: '#FFFFFF',
    ink: '#1C1F24',
    steel: '#5E6670',
    line: '#E3E5E9',
    accent,
    accentPressed: '#C96E22',
    onAccent: '#1C1F24',
    accentMuted: '#F8E7D6',
    danger: '#9E2B25',
    stage: '#1C1F24',
    stageInk: '#F4F5F7',
  },
  shadow: lightShadow,
  radius: { card: 20, control: 16 },
  type,
};

export const darkTheme: AppTheme = {
  mode: 'dark',
  statusBar: 'light',
  colors: {
    canvas: '#121418',
    card: '#1C1F24',
    ink: '#F4F5F7',
    steel: '#A7ADB6',
    line: '#343841',
    accent,
    accentPressed: '#D4893F',
    onAccent: '#1C1F24',
    accentMuted: '#3A2C22',
    danger: '#F0A8A0',
    stage: '#0E1013',
    stageInk: '#F4F5F7',
  },
  shadow: {},
  radius: { card: 20, control: 16 },
  type,
};
