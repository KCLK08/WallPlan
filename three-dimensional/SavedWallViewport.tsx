import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, useWindowDimensions, View, type GestureResponderEvent } from 'react-native';

import { findMaterial } from '@/catalog/materials';
import { useAppTheme } from '@/components/useAppTheme';
import { inspectionText } from '@/constants/inspectionCopy';
import { translate } from '@/constants/i18n';
import { modelText, viewModeLabel } from '@/constants/modelCopy';
import type { SavedWall } from '@/construction/wallModel';
import { useSettingsStore } from '@/store/settingsStore';

import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { GEOMETRY_COLORS, type LayerToggles, type ViewMode } from './geometry/types';
import { buildWallGeometry } from './geometry/wallGeometry';
import { cameraAngles, displayBoxes, togglesFor } from './geometry/view';
import { formatMillimetres, inspectPart } from './inspection/inspectionData';
import { isolateBoard, measureLines, revealBoards } from './inspection/measurementGeometry';
import { nextSelection, pickSelection, selectionIdForBox, type ScreenPoint } from './inspection/selection';
import { InspectionPanel } from './InspectionPanel';
import { frameWallCamera } from './orbit';
import { pointerModifiers } from './pointerModifiers';
import { SavedWallCanvas } from './SavedWallCanvas';
import { applyTouchSample, consumeTap, createTouchMemory, resetTouchMemory, type TouchPoint } from './touchOrbit';
import { useWheelZoom } from './useWheelZoom';

const modes: ViewMode[] = ['complete', 'side-a', 'side-b', 'construction', 'layers', 'exploded'];

export function SavedWallViewport({ wall }: { wall: SavedWall }) {
  const theme = useAppTheme();
  const language = useSettingsStore((state) => state.language);
  const { height, width } = useWindowDimensions();
  const wide = width >= 900;
  const stageHeight = Math.max(280, Math.min(560, Math.round(height * (wide ? 0.62 : 0.46))));
  const geometry = useMemo(() => buildWallGeometry(wall), [wall]);
  const [mode, setMode] = useState<ViewMode>('complete');
  const [toggles, setToggles] = useState<LayerToggles>(() => togglesFor('complete', geometry));
  const [orthographic, setOrthographic] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showMeasures, setShowMeasures] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const cameraRef = useRef(frameWallCamera(geometry.lengthMm / 1000, geometry.heightMm / 1000, geometry.nominalDepthMm / 1000));
  const touchMemory = useRef(createTouchMemory());
  const tapPoint = useRef<ScreenPoint | null>(null);
  useWheelZoom(cameraRef);
  const boxes = useMemo(() => displayBoxes(geometry, mode, toggles), [geometry, mode, toggles]);
  const selected = useMemo(
    () => (selectedId ? boxes.filter((box) => selectionIdForBox(box) === selectedId) : []),
    [boxes, selectedId],
  );
  const measures = useMemo(
    () => (showMeasures ? measureLines(wall, geometry, toggles) : []),
    [showMeasures, wall, geometry, toggles],
  );
  const record = useMemo(() => (selectedId ? inspectPart(wall, geometry, selectedId) : null), [wall, geometry, selectedId]);

  useEffect(() => {
    const next = frameWallCamera(geometry.lengthMm / 1000, geometry.heightMm / 1000, geometry.nominalDepthMm / 1000);
    Object.assign(cameraRef.current, next);
    setMode('complete');
    setToggles(togglesFor('complete', geometry));
    setSelectedId(null);
  }, [geometry]);

  function touchPoints(event: GestureResponderEvent): TouchPoint[] {
    const touches = event.nativeEvent.touches;
    return touches.length > 0
      ? touches.map((touch) => ({ x: touch.pageX, y: touch.pageY }))
      : [{ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY }];
  }

  function handleGrant(event: GestureResponderEvent) {
    tapPoint.current = { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY };
    applyTouchSample(cameraRef.current, touchMemory.current, touchPoints(event), pointerModifiers.shift);
  }

  function handleMove(event: GestureResponderEvent) {
    applyTouchSample(cameraRef.current, touchMemory.current, touchPoints(event), pointerModifiers.shift);
  }

  function handleRelease() {
    const tap = consumeTap(touchMemory.current);
    const point = tapPoint.current;
    tapPoint.current = null;
    if (!tap || !point || viewport.width < 2 || viewport.height < 2) {
      return;
    }
    const picked = pickSelection(boxes, cameraRef.current, viewport, point, {
      orthographic,
      lengthMm: geometry.lengthMm,
      heightMm: geometry.heightMm,
    });
    setSelectedId((current) => nextSelection(current, picked));
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

  const boardSelection = selectedId?.match(/^board-([AB])-(.+)$/);

  function isolateSelection() {
    if (!boardSelection) {
      return;
    }
    setToggles((current) => isolateBoard(current, boardSelection[2], boardSelection[1] as 'A' | 'B'));
  }

  return (
    <View style={{ flex: 1, gap: 8 }}>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 8 }}>
      <View
        onLayout={(event) => {
          const next = { width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height };
          setViewport((current) => (current.width === next.width && current.height === next.height ? current : next));
        }}
        style={{
          height: wide ? Math.max(stageHeight, 360) : stageHeight,
          flex: wide ? 1 : undefined,
          borderRadius: theme.radius.card,
          overflow: 'hidden',
          backgroundColor: theme.colors.stage,
        }}
      >
        <CanvasErrorBoundary message={translate(language, 'canvasError')}>
          <SavedWallCanvas
            boxes={boxes}
            selected={selected}
            measures={measures}
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
          onResponderGrant={handleGrant}
          onResponderMove={handleMove}
          onResponderRelease={handleRelease}
          onResponderTerminate={() => {
            tapPoint.current = null;
            resetTouchMemory(touchMemory.current);
          }}
        />
        <Text pointerEvents="none" style={{ position: 'absolute', left: 12, right: 12, bottom: 10, color: '#C5CAD1', fontSize: 13, lineHeight: 18 }}>
          {Platform.OS === 'web' ? modelText(language, 'hintWeb') : modelText(language, 'hintTouch')}
        </Text>
      </View>
      {record ? (
        <InspectionPanel
          record={record}
          language={language}
          wide={wide}
          canIsolate={Boolean(boardSelection)}
          onClear={() => setSelectedId(null)}
          onIsolate={isolateSelection}
          onReveal={() => setToggles((current) => revealBoards(current, geometry))}
        />
      ) : null}
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
          <Chip
            label={showMeasures ? inspectionText(language, 'measuresOn') : inspectionText(language, 'measures')}
            selected={showMeasures}
            onPress={() => setShowMeasures((current) => !current)}
          />
        </View>
        {showMeasures ? (
          <View style={{ gap: 4 }}>
            <Text style={{ color: theme.colors.steel, ...theme.type.label }}>{inspectionText(language, 'measures')}</Text>
            {measures.map((measure) => (
              <Text key={measure.id} style={{ color: theme.colors.ink, ...theme.type.body }}>
                {`${language === 'de' ? measure.labelDe : measure.labelEn}: ${formatMillimetres(measure.lengthMm, language)}`}
              </Text>
            ))}
            <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{inspectionText(language, 'measureNote')}</Text>
          </View>
        ) : null}
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
