import { View } from 'react-native';

export function BackMark({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 12,
        height: 12,
        borderLeftWidth: 2.5,
        borderBottomWidth: 2.5,
        borderColor: color,
        transform: [{ rotate: '45deg' }],
        marginLeft: 4,
      }}
    />
  );
}

export function SettingsMark({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
    </View>
  );
}
