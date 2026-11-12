import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { PixelRatio, Platform, Pressable, ScrollView, Text, useWindowDimensions, View, type GestureResponderEvent } from 'react-native';

import { findMaterial } from '@/catalog/materials';
import { useAppTheme } from '@/components/useAppTheme';
import { drawingText, drawingViewLabel } from '@/constants/drawingCopy';
import type { SavedWall } from '@/construction/wallModel';
import { useSettingsStore } from '@/store/settingsStore';
import { InspectionPanel } from '@/three-dimensional/InspectionPanel';
import { buildWallGeometry } from '@/three-dimensional/geometry/wallGeometry';
import { inspectPart } from '@/three-dimensional/inspection/inspectionData';
import { isolateBoard, revealBoards } from '@/three-dimensional/inspection/measurementGeometry';
import { nextSelection } from '@/three-dimensional/inspection/selection';

import { hitSheet } from './sheet';
import { buildSheet } from './sheet';
import type { DrawingView } from './geometry/project';
import { DrawingSheet } from './rendering/DrawingSheet';
import { applyDrawingGesture, consumeTap, createGestureMemory } from './rendering/gesture';
import { RN_DP_PER_INCH, WEB_PX_PER_INCH, effectiveScale, fitPxPerMm, frameCamera, pxPerMmForScale, scaleFits, sheetMillimetres, zoomAt, type Camera2D, type ScaleChoice } from './rendering/scale';
import { layersFor, type DrawingLayers } from './views/drawingViews';

const views: DrawingView[] = ['front', 'back', 'side', 'plan', 'construction'];
const scales: ScaleChoice[] = ['auto', 10, 20, 25, 50];
const SHEET_PADDING = 72;

export function DrawingViewport({ wall }: { wall: SavedWall }) {
  const theme = useAppTheme();
  const language = useSettingsStore((state) => state.language);
  const { height, width } = useWindowDimensions();
  const wide = width >= 900;
  const pxPerInch = Platform.OS === 'web' ? WEB_PX_PER_INCH : RN_DP_PER_INCH * PixelRatio.get();
  const geometry = useMemo(() => buildWallGeometry(wall), [wall]);
  const [view, setView] = useState<DrawingView>('front');
  const [layers, setLayers] = useState<DrawingLayers>(() => layersFor('front', geometry));
  const [scaleChoice, setScaleChoice] = useState<ScaleChoice>('auto');
  const [userFramed, setUserFramed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [camera, setCamera] = useState<Camera2D>({ pxPerMm: 0.1, panX: 16, panY: 16 });
  const stageRef = useRef<ComponentRef<typeof View> | null>(null);
  const memory = useRef(createGestureMemory());
  const cameraRef = useRef(camera);
  cameraRef.current = camera;
  const sheet = useMemo(() => buildSheet(wall, view, layers), [wall, view, layers]);
  const zoomRange = useMemo(() => {
    const fitted = fitPxPerMm(
      Math.max(sheet.bounds.maxX - sheet.bounds.minX, 1),
      Math.max(sheet.bounds.maxY - sheet.bounds.minY, 1),
      Math.max(viewport.width, 1),
      Math.max(viewport.height, 1),
      SHEET_PADDING,
    );
    return { minPxPerMm: fitted / 8, maxPxPerMm: Math.max(fitted * 8, pxPerMmForScale(5, pxPerInch)) };
  }, [sheet.bounds, viewport.width, viewport.height, pxPerInch]);
  const record = useMemo(() => (selectedId ? inspectPart(wall, geometry, selectedId) : null), [selectedId, wall, geometry]);
  const stageHeight = Math.max(280, Math.min(640, Math.round(height * (wide ? 0.62 : 0.42))));

  useEffect(() => {
    setLayers(layersFor(view, geometry));
    setSelectedId(null);
    setUserFramed(false);
  }, [geometry, view]);

  useEffect(() => {
    if (userFramed || viewport.width < 2 || viewport.height < 2) {
      return;
    }
    setCamera(frameCamera(sheet.bounds, viewport.width, viewport.height, scaleChoice, pxPerInch, SHEET_PADDING));
  }, [userFramed, viewport, sheet.bounds, scaleChoice, pxPerInch]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }
    const node = stageRef.current as unknown as HTMLElement | null;
    if (!node || typeof node.addEventListener !== 'function') {
      return;
    }
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const bounds = node.getBoundingClientRect();
      setUserFramed(true);
      setCamera((current) =>
        zoomAt(current, event.deltaY > 0 ? 0.92 : 1.08, event.clientX - bounds.left, event.clientY - bounds.top, zoomRange.minPxPerMm, zoomRange.maxPxPerMm),
      );
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [zoomRange, viewport.width, viewport.height]);

  function touchPoints(event: GestureResponderEvent) {
    const touches = event.nativeEvent.touches ?? [];
    return touches.length > 0
      ? Array.from(touches).map((touch) => ({ x: touch.locationX, y: touch.locationY }))
      : [{ x: event.nativeEvent.locationX, y: event.nativeEvent.locationY }];
  }

  function handleGrant(event: GestureResponderEvent) {
    setCamera((current) => applyDrawingGesture(current, memory.current, touchPoints(event), zoomRange));
  }

  function handleMove(event: GestureResponderEvent) {
    setCamera((current) => applyDrawingGesture(current, memory.current, touchPoints(event), zoomRange));
  }

  function handleRelease() {
    const tap = consumeTap(memory.current);
    if (!tap) {
      setUserFramed(true);
      return;
    }
    const point = sheetMillimetres(tap.x, tap.y, sheet.bounds, cameraRef.current);
    setSelectedId((current) => nextSelection(current, hitSheet(sheet, point.x, point.y)));
  }

  function reset() {
    setView('front');
    setLayers(layersFor('front', geometry));
    setScaleChoice('auto');
    setUserFramed(false);
    setSelectedId(null);
  }

  const scaleLabel = scaleSentence(scaleChoice, userFramed, sheet.bounds, viewport, pxPerInch, camera.pxPerMm, language);
  const boardSelection = selectedId?.match(/^board-([AB])-(.+)$/);
  const boardLayers = uniqueBoardLayers(geometry.boxes, language);
  const panel = record ? (
    <InspectionPanel
      record={record}
      language={language}
      wide={wide}
      canIsolate={Boolean(boardSelection)}
      onClear={() => setSelectedId(null)}
      onIsolate={() => {
        if (!boardSelection) return;
        setLayers((current) => ({
          ...current,
          material: isolateBoard(current.material, boardSelection[2], boardSelection[1] as 'A' | 'B'),
        }));
      }}
      onReveal={() => setLayers((current) => ({ ...current, material: revealBoards(current.material, geometry) }))}
    />
  ) : null;

  return (
    <View style={{ flex: 1, gap: 8 }}>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 8 }}>
        <View
          ref={stageRef}
          onLayout={(event) => {
            const next = { width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height };
            setViewport((current) => (current.width === next.width && current.height === next.height ? current : next));
          }}
          style={{ height: wide ? Math.max(stageHeight, 420) : stageHeight, flex: wide ? 1 : undefined }}
        >
          <DrawingSheet
            sheet={sheet}
            camera={camera}
            selectedId={selectedId}
            showText={layers.dimensionText && layers.dimensions}
            language={language}
            onGrant={handleGrant}
            onMove={handleMove}
            onRelease={handleRelease}
          />
          {sheet.parts.length === 0 ? (
            <Text pointerEvents="none" style={{ position: 'absolute', left: 16, top: 16, color: '#1C1F24', fontSize: 15 }}>
              {drawingText(language, 'empty')}
            </Text>
          ) : null}
        </View>
        {wide && record ? panel : null}
      </View>
      <Text style={{ color: theme.colors.ink, fontSize: 13, lineHeight: 18 }}>{scaleLabel}</Text>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
        {!wide && record ? panel : null}
        <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{drawingText(language, 'intro')}</Text>
        <Text style={{ color: theme.colors.steel, ...theme.type.label }}>{drawingText(language, 'views')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {views.map((entry) => (
            <Chip key={entry} label={drawingViewLabel(language, entry)} selected={view === entry} onPress={() => setView(entry)} />
          ))}
        </View>
        <Text style={{ color: theme.colors.steel, ...theme.type.label }}>{drawingText(language, 'scale')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {scales.map((entry) => (
            <Chip
              key={String(entry)}
              label={entry === 'auto' ? drawingText(language, 'scaleAuto') : `1:${entry}`}
              selected={scaleChoice === entry && !userFramed}
              onPress={() => {
                setScaleChoice(entry);
                setUserFramed(false);
              }}
            />
          ))}
          <Chip label={drawingText(language, 'zoomIn')} selected={false} onPress={() => zoom(1.25)} />
          <Chip label={drawingText(language, 'zoomOut')} selected={false} onPress={() => zoom(0.8)} />
          <Chip label={drawingText(language, 'reset')} selected={false} onPress={reset} />
        </View>
        <Text style={{ color: theme.colors.steel, ...theme.type.label }}>{drawingText(language, 'layers')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip label={drawingText(language, 'layerUw')} selected={layers.material.uw} onPress={() => toggleMaterial('uw')} />
          <Chip label={drawingText(language, 'layerCw')} selected={layers.material.cw} onPress={() => toggleMaterial('cw')} />
          <Chip label={drawingText(language, 'layerSideA')} selected={layers.material.sideA} onPress={() => toggleMaterial('sideA')} />
          <Chip label={drawingText(language, 'layerSideB')} selected={layers.material.sideB} onPress={() => toggleMaterial('sideB')} />
          <Chip label={drawingText(language, 'layerInsulation')} selected={layers.material.insulation} onPress={() => toggleMaterial('insulation')} />
          <Chip label={drawingText(language, 'layerOpenings')} selected={layers.material.openings} onPress={() => toggleMaterial('openings')} />
          <Chip label={drawingText(language, 'layerDimensions')} selected={layers.dimensions} onPress={() => setLayers((current) => ({ ...current, dimensions: !current.dimensions }))} />
          <Chip
            label={drawingText(language, 'layerDimensionText')}
            selected={layers.dimensionText}
            onPress={() => setLayers((current) => ({ ...current, dimensionText: !current.dimensionText }))}
          />
          <Chip label={drawingText(language, 'layerMarkers')} selected={layers.markers} onPress={() => setLayers((current) => ({ ...current, markers: !current.markers }))} />
          {boardLayers.map((layer) => (
            <Chip
              key={layer.id}
              label={layer.label}
              selected={layers.material.boards[layer.id] !== false}
              onPress={() =>
                setLayers((current) => ({
                  ...current,
                  material: { ...current.material, boards: { ...current.material.boards, [layer.id]: current.material.boards[layer.id] === false } },
                }))
              }
            />
          ))}
        </View>
        {layers.dimensions ? (
          <View style={{ gap: 4 }}>
            <Text style={{ color: theme.colors.steel, ...theme.type.label }}>{drawingText(language, 'numbers')}</Text>
            {layers.dimensionText
              ? sheet.dimensions.map((dimension) => (
                  <Text key={dimension.id} style={{ color: theme.colors.ink, ...theme.type.body }}>
                    {language === 'de' ? dimension.textDe : dimension.textEn}
                  </Text>
                ))
              : null}
            {layers.dimensionText
              ? sheet.markers.map((marker) => (
                  <Text key={marker.id} style={{ color: theme.colors.ink, ...theme.type.body }}>
                    {`${drawingText(language, 'markerPrefix')}: ${language === 'de' ? marker.textDe : marker.textEn}`}
                  </Text>
                ))
              : null}
          </View>
        ) : null}
        <Text style={{ color: theme.colors.steel, ...theme.type.label }}>{drawingText(language, 'notes')}</Text>
        {sheet.notes.map((note) => (
          <Text key={note.id} style={{ color: theme.colors.ink, ...theme.type.body }}>
            {language === 'de' ? note.textDe : note.textEn}
          </Text>
        ))}
        <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{drawingText(language, 'disclaimer')}</Text>
      </ScrollView>
    </View>
  );

  function zoom(factor: number) {
    setUserFramed(true);
    setCamera((current) => zoomAt(current, factor, viewport.width / 2, viewport.height / 2, zoomRange.minPxPerMm, zoomRange.maxPxPerMm));
  }

  function toggleMaterial(key: 'uw' | 'cw' | 'sideA' | 'sideB' | 'insulation' | 'openings') {
    setLayers((current) => ({ ...current, material: { ...current.material, [key]: !current.material[key] } }));
  }
}

function scaleSentence(
  choice: ScaleChoice,
  zoomed: boolean,
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  viewport: { width: number; height: number },
  pxPerInch: number,
  pxPerMm: number,
  language: 'de' | 'en',
): string {
  if (zoomed) {
    const rounded = Math.max(1, Math.round(effectiveScale(pxPerMm, pxPerInch)));
    return `${drawingText(language, 'zoomed')} 1:${rounded}`;
  }
  if (choice === 'auto') {
    return drawingText(language, 'fitted');
  }
  const fits = viewport.width > 2 && scaleFits(bounds, viewport.width, viewport.height, choice, pxPerInch, SHEET_PADDING);
  return `1:${choice}. ${drawingText(language, fits ? 'namedFits' : 'namedOverflows')}`;
}

function uniqueBoardLayers(
  boxes: readonly { boardLayerId: string | null; side: 'A' | 'B' | null; catalogItemId: string | null }[],
  language: 'de' | 'en',
): { id: string; label: string }[] {
  const seen = new Set<string>();
  const layers: { id: string; label: string }[] = [];
  for (const box of boxes) {
    if (!box.boardLayerId || seen.has(box.boardLayerId)) continue;
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
