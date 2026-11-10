import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, useWindowDimensions, View, type GestureResponderEvent } from 'react-native';

import { findMaterial } from '@/catalog/materials';
import { useAppTheme } from '@/components/useAppTheme';
import { translate } from '@/constants/i18n';
import { modelText, viewModeLabel } from '@/constants/modelCopy';
import type { SavedWall } from '@/construction/wallModel';
import { useSettingsStore } from '@/store/settingsStore';

import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { GEOMETRY_COLORS, type LayerToggles, type ViewMode } from './geometry/types';
import { buildWallGeometry } from './geometry/wallGeometry';
import { cameraAngles, displayBoxes, togglesFor } from './geometry/view';
import { frameWallCamera } from './orbit';
import { pointerModifiers } from './pointerModifiers';
import { SavedWallCanvas } from './SavedWallCanvas';
import { applyTouchSample, createTouchMemory, resetTouchMemory, type TouchPoint } from './touchOrbit';
import { useWheelZoom } from './useWheelZoom';

const modes: ViewMode[] = ['complete', 'side-a', 'side-b', 'construction', 'layers', 'exploded'];

export function SavedWallViewport({ wall }: { wall: SavedWall }) {
  const theme = useAppTheme();
  const language = useSettingsStore((state) => state.language);
  const { height } = useWindowDimensions();
  const stageHeight = Math.max(280, Math.min(560, Math.round(height * 0.48)));
  const geometry = useMemo(() => buildWallGeometry(wall), [wall]);
  const [mode, setMode] = useState<ViewMode>('complete');
  const [toggles, setToggles] = useState<LayerToggles>(() => togglesFor('complete', geometry));
  const [orthographic, setOrthographic] = useState(false);
  const cameraRef = useRef(frameWallCamera(geometry.lengthMm / 1000, geometry.heightMm / 1000, geometry.nominalDepthMm / 1000));
  const touchMemory = useRef(createTouchMemory());
  useWheelZoom(cameraRef);
  const boxes = useMemo(() => displayBoxes(geometry, mode, toggles), [geometry, mode, toggles]);

  useEffect(() => {
    const next = frameWallCamera(geometry.lengthMm / 1000, geometry.heightMm / 1000, geometry.nominalDepthMm / 1000);
    Object.assign(cameraRef.current, next);
    setMode('complete');
    setToggles(togglesFor('complete', geometry));
  }, [geometry]);

  function handleTouch(event: GestureResponderEvent) {
    const touches = event.nativeEvent.touches;
    const points: TouchPoint[] =
      touches.length > 0
        ? touches.map((touch) => ({ x: touch.pageX, y: touch.pageY }))
        : [{ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY }];
    applyTouchSample(cameraRef.current, touchMemory.current, points, pointerModifiers.shift);
  }

  function chooseMode(next: ViewMode) {
    setMode(next);
    setToggles(togglesFor(next, geometry));
    const angles = cameraAngles(next);
    cameraRef.current.theta = angles.theta;
    cameraRef.current.phi = angles.phi;
  }

  function reset() {
    Object.assign(
      cameraRef.current,
      frameWallCamera(geometry.lengthMm / 1000, geometry.heightMm / 1000, geometry.nominalDepthMm / 1000),
    );
    setOrthographic(false);
    chooseMode('complete');
  }

  const boardLayers = uniqueBoardLayers(geometry.boxes, language);

  return (
    <View style={{ flex: 1, gap: 8 }}>
      <View style={{ height: stageHeight, borderRadius: theme.radius.card, overflow: 'hidden', backgroundColor: theme.colors.stage }}>
        <CanvasErrorBoundary message={translate(language, 'canvasError')}>
          <SavedWallCanvas
            boxes={boxes}
            cameraRef={cameraRef}
            lengthMm={geometry.lengthMm}
            heightMm={geometry.heightMm}
            orthographic={orthographic}
          />
        </CanvasErrorBoundary>
        <View
          collapsable={false}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onResponderGrant={handleTouch}
          onResponderMove={handleTouch}
          onResponderRelease={() => resetTouchMemory(touchMemory.current)}
          onResponderTerminate={() => resetTouchMemory(touchMemory.current)}
        />
        <Text pointerEvents="none" style={{ position: 'absolute', left: 12, right: 12, bottom: 10, color: '#C5CAD1', fontSize: 13, lineHeight: 18 }}>
          {Platform.OS === 'web' ? modelText(language, 'hintWeb') : modelText(language, 'hintTouch')}
        </Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
        <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{modelText(language, 'intro')}</Text>
        <Text style={{ color: theme.colors.steel, ...theme.type.label }}>{modelText(language, 'modes')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {modes.map((entry) => (
            <Chip key={entry} label={viewModeLabel(language, entry)} selected={mode === entry} onPress={() => chooseMode(entry)} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip label={modelText(language, 'perspective')} selected={!orthographic} onPress={() => setOrthographic(false)} />
          <Chip label={modelText(language, 'orthographic')} selected={orthographic} onPress={() => setOrthographic(true)} />
          <Chip label={modelText(language, 'reset')} selected={false} onPress={reset} />
        </View>
        <Text style={{ color: theme.colors.steel, ...theme.type.label }}>{modelText(language, 'layers')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip label={modelText(language, 'layerUw')} selected={toggles.uw} onPress={() => setToggles((current) => ({ ...current, uw: !current.uw }))} />
          <Chip label={modelText(language, 'layerCw')} selected={toggles.cw} onPress={() => setToggles((current) => ({ ...current, cw: !current.cw }))} />
          <Chip label={modelText(language, 'layerSideA')} selected={toggles.sideA} onPress={() => setToggles((current) => ({ ...current, sideA: !current.sideA }))} />
          <Chip label={modelText(language, 'layerSideB')} selected={toggles.sideB} onPress={() => setToggles((current) => ({ ...current, sideB: !current.sideB }))} />
          <Chip
            label={modelText(language, 'layerInsulation')}
            selected={toggles.insulation}
            onPress={() => setToggles((current) => ({ ...current, insulation: !current.insulation }))}
          />
          <Chip
            label={modelText(language, 'layerOpenings')}
            selected={toggles.openings}
            onPress={() => setToggles((current) => ({ ...current, openings: !current.openings }))}
          />
          {boardLayers.map((layer) => (
            <Chip
              key={layer.id}
              label={layer.label}
              selected={toggles.boards[layer.id] !== false}
              onPress={() =>
                setToggles((current) => ({
                  ...current,
                  boards: { ...current.boards, [layer.id]: current.boards[layer.id] === false },
                }))
              }
            />
          ))}
        </View>
        <Text style={{ color: theme.colors.steel, ...theme.type.label }}>{modelText(language, 'legend')}</Text>
        <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{modelText(language, 'legendNote')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Swatch color={GEOMETRY_COLORS.uw} label={modelText(language, 'colorUw')} />
          <Swatch color={GEOMETRY_COLORS.cw} label={modelText(language, 'colorCw')} />
          <Swatch color={GEOMETRY_COLORS.gypsumA[0]} label={modelText(language, 'colorA')} />
          <Swatch color={GEOMETRY_COLORS.gypsumB[0]} label={modelText(language, 'colorB')} />
          <Swatch color={GEOMETRY_COLORS.osb} label={modelText(language, 'colorOsb')} />
          <Swatch color={GEOMETRY_COLORS.insulation} label={modelText(language, 'colorInsulation')} />
          <Swatch color={GEOMETRY_COLORS.opening} label={modelText(language, 'colorOpening')} />
        </View>
        <Text style={{ color: theme.colors.steel, ...theme.type.label }}>{modelText(language, 'notes')}</Text>
        {geometry.notes.map((note) => (
          <Text key={note.id} style={{ color: theme.colors.ink, ...theme.type.body }}>
            {language === 'de' ? note.textDe : note.textEn}
          </Text>
        ))}
        <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{modelText(language, 'disclaimer')}</Text>
      </ScrollView>
    </View>
  );
}

function uniqueBoardLayers(
  boxes: readonly { boardLayerId: string | null; side: 'A' | 'B' | null; catalogItemId: string | null }[],
  language: 'de' | 'en',
): { id: string; label: string }[] {
  const seen = new Set<string>();
  const layers: { id: string; label: string }[] = [];
  for (const box of boxes) {
    if (!box.boardLayerId || seen.has(box.boardLayerId)) {
      continue;
    }
    seen.add(box.boardLayerId);
    const item = box.catalogItemId ? findMaterial(box.catalogItemId) : undefined;
    const name = (language === 'de' ? item?.nameDe : item?.nameEn) ?? box.catalogItemId ?? box.boardLayerId;
    layers.push({ id: box.boardLayerId, label: `${box.side ?? ''} ${name}`.trim() });
  }
  return layers;
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minHeight: 44,
        borderRadius: theme.radius.control,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected ? theme.colors.accent : theme.colors.card,
        borderWidth: 1,
        borderColor: selected ? theme.colors.accent : theme.colors.line,
      }}
    >
      <Text style={{ color: selected ? theme.colors.onAccent : theme.colors.ink, fontSize: 15, lineHeight: 20, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  const theme = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ color: theme.colors.ink, ...theme.type.body }}>{label}</Text>
    </View>
  );
}
