import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureDetector, usePanGesture, usePinchGesture, useSimultaneousGestures } from 'react-native-gesture-handler';

import { catalogName } from '@/catalog/prototypeMaterials';
import { studOffsetsMm } from '@/calculations/studLayout';
import { formatLength } from '@/calculations/units';
import { translate } from '@/constants/i18n';
import { accent } from '@/constants/theme';
import { METAL_STUD_TEST_WALL } from '@/construction/metalStudPartition';
import { useSettingsStore } from '@/store/settingsStore';

import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { createInitialCamera, panOrbit, rotateOrbit, zoomOrbit } from './orbit';
import { pointerModifiers } from './pointerModifiers';
import { useWheelZoom } from './useWheelZoom';
import { WallCanvas } from './WallCanvas';

const wallLengthM = METAL_STUD_TEST_WALL.lengthMm / 1000;
const wallHeightM = METAL_STUD_TEST_WALL.heightMm / 1000;

export function PrototypeViewport() {
  const language = useSettingsStore((state) => state.language);
  const units = useSettingsStore((state) => state.units);
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [showBoard, setShowBoard] = useState(true);
  const cameraRef = useRef(createInitialCamera(wallLengthM, wallHeightM));
  useWheelZoom(cameraRef);

  const rotate = usePanGesture({
    maxPointers: 1,
    onUpdate: (event) => {
      if (pointerModifiers.shift) {
        panOrbit(cameraRef.current, event.changeX, event.changeY);
        return;
      }
      rotateOrbit(cameraRef.current, event.changeX, event.changeY);
    },
  });
  const pan = usePanGesture({
    minPointers: 2,
    maxPointers: 2,
    onUpdate: (event) => {
      panOrbit(cameraRef.current, event.changeX, event.changeY);
    },
  });
  const pinch = usePinchGesture({
    onUpdate: (event) => {
      if (event.scaleChange > 0) {
        zoomOrbit(cameraRef.current, 1 / event.scaleChange);
      }
    },
  });
  const gesture = useSimultaneousGestures(rotate, pan, pinch);
  const studCount = studOffsetsMm(METAL_STUD_TEST_WALL.lengthMm, METAL_STUD_TEST_WALL.studSpacingMm).length;
  const lengthLabel = formatLength(METAL_STUD_TEST_WALL.lengthMm, units, language);
  const heightLabel = formatLength(METAL_STUD_TEST_WALL.heightMm, units, language);

  return (
    <View style={styles.host}>
      <CanvasErrorBoundary message={t('canvasError')}>
        <WallCanvas showBoard={showBoard} cameraRef={cameraRef} />
      </CanvasErrorBoundary>
      <GestureDetector gesture={gesture}>
        <View collapsable={false} style={styles.gestureLayer} />
      </GestureDetector>
      <View pointerEvents="none" style={styles.caption}>
        <Text style={styles.captionTitle}>{t('testWall')}</Text>
        <Text style={styles.captionBody}>
          {lengthLabel} × {heightLabel}
        </Text>
        <Text style={styles.captionBody}>
          {t('uwCount')} · {studCount}× {catalogName(METAL_STUD_TEST_WALL.studCatalogId, language)} · {t('boardLayer')}
        </Text>
      </View>
      <View pointerEvents="box-none" style={styles.hud}>
        <Text style={styles.hint}>
          {Platform.OS === 'web' ? t('prototypeHintWeb') : t('prototypeHintTouch')}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowBoard((current) => !current)}
          style={({ pressed }) => [styles.toggle, pressed && styles.togglePressed]}
        >
          <Text style={styles.toggleLabel}>{showBoard ? t('hideBoard') : t('showBoard')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
  gestureLayer: {
    ...StyleSheet.absoluteFill,
  },
  caption: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    gap: 2,
  },
  captionTitle: {
    color: '#F4F5F7',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  captionBody: {
    color: '#C5CAD1',
    fontSize: 14,
    lineHeight: 20,
  },
  hud: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    gap: 10,
  },
  hint: {
    color: '#C5CAD1',
    fontSize: 13,
    lineHeight: 18,
  },
  toggle: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  togglePressed: {
    backgroundColor: '#C96E22',
  },
  toggleLabel: {
    color: '#1C1F24',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
});
