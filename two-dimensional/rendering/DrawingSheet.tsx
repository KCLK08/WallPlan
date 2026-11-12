import { Text, View, type GestureResponderEvent } from 'react-native';

import type { Language } from '@/types/settings';

import type { Camera2D } from './scale';
import { sheetPoint } from './scale';
import type { DrawingSheet as SheetModel } from '../sheet';

const PAPER = '#F6F4EF';
const INK = '#1C1F24';
const HIDDEN = '#8B919A';
const ACCENT = '#E88935';

type DrawingSheetProps = {
  sheet: SheetModel;
  camera: Camera2D;
  selectedId: string | null;
  showText: boolean;
  language: Language;
  onGrant: (event: GestureResponderEvent) => void;
  onMove: (event: GestureResponderEvent) => void;
  onRelease: () => void;
};

export function DrawingSheet({ sheet, camera, selectedId, showText, language, onGrant, onMove, onRelease }: DrawingSheetProps) {
  return (
    <View
      style={{ flex: 1, overflow: 'hidden', backgroundColor: PAPER, borderRadius: 20 }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={onGrant}
      onResponderMove={onMove}
      onResponderRelease={onRelease}
    >
      {sheet.parts.map((part, index) => {
        const origin = sheetPoint(part.x, part.y + part.height, sheet.bounds, camera);
        const selected = part.selectionId === selectedId;
        return (
          <View
            key={part.boxId}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: origin.x,
              top: origin.y,
              width: Math.max(part.width * camera.pxPerMm, 1),
              height: Math.max(part.height * camera.pxPerMm, 1),
              backgroundColor: part.hidden || part.reference ? 'transparent' : part.fill,
              borderWidth: selected ? 2 : 1,
              borderStyle: part.hidden ? 'dashed' : 'solid',
              borderColor: selected || part.reference ? ACCENT : part.hidden ? HIDDEN : INK,
              zIndex: index + 1,
            }}
          />
        );
      })}
      {sheet.openings.map((opening) => {
        const origin = sheetPoint(opening.x, opening.y + opening.height, sheet.bounds, camera);
        const selected = opening.selectionId === selectedId;
        return (
          <View
            key={opening.selectionId}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: origin.x,
              top: origin.y,
              width: Math.max(opening.width * camera.pxPerMm, 1),
              height: Math.max(opening.height * camera.pxPerMm, 1),
              backgroundColor: 'transparent',
              borderWidth: selected ? 2 : 1,
              borderStyle: 'dashed',
              borderColor: ACCENT,
              zIndex: 40,
            }}
          />
        );
      })}
      {sheet.dimensions.map((dimension) => (
        <DimensionMark key={dimension.id} dimension={dimension} sheet={sheet} camera={camera} showText={showText} language={language} />
      ))}
      {sheet.markers.map((marker) => {
        const point = sheetPoint(marker.x, sheet.bounds.maxY, sheet.bounds, camera);
        return (
          <View key={marker.id} pointerEvents="none" style={{ position: 'absolute', left: point.x - 0.5, top: point.y - 12, width: 1, height: 12, backgroundColor: INK, zIndex: 50 }} />
        );
      })}
    </View>
  );
}

function DimensionMark({
  dimension,
  sheet,
  camera,
  showText,
  language,
}: {
  dimension: SheetModel['dimensions'][number];
  sheet: SheetModel;
  camera: Camera2D;
  showText: boolean;
  language: Language;
}) {
  const start = sheetPoint(dimension.x1, dimension.y1, sheet.bounds, camera);
  const end = sheetPoint(dimension.x2, dimension.y2, sheet.bounds, camera);
  const offset = 16 + dimension.lane * 22;
  const horizontal = dimension.axis === 'h';
  const lineStart = horizontal
    ? { x: Math.min(start.x, end.x), y: (dimension.side === 'above' ? Math.min(start.y, end.y) : Math.max(start.y, end.y)) + (dimension.side === 'above' ? -offset : offset) }
    : { x: (dimension.side === 'left' ? Math.min(start.x, end.x) : Math.max(start.x, end.x)) + (dimension.side === 'left' ? -offset : offset), y: Math.min(start.y, end.y) };
  const lineLength = horizontal ? Math.abs(end.x - start.x) : Math.abs(end.y - start.y);
  const text = showText ? (language === 'de' ? dimension.valueDe : dimension.valueEn) : '';
  const labelWidth = Math.ceil(text.length * 8);
  const textFits = horizontal ? lineLength >= labelWidth + 8 : text.length > 0;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 55 }}>
      {dimension.drawLine ? (
        <>
          <View style={hairline(start.x, start.y, horizontal ? start.x : lineStart.x, horizontal ? lineStart.y : start.y)} />
          <View style={hairline(end.x, end.y, horizontal ? end.x : lineStart.x, horizontal ? lineStart.y : end.y)} />
          <View
            style={
              horizontal
                ? { position: 'absolute', left: lineStart.x, top: lineStart.y, width: Math.max(lineLength, 1), height: 1, backgroundColor: INK }
                : { position: 'absolute', left: lineStart.x, top: lineStart.y, width: 1, height: Math.max(lineLength, 1), backgroundColor: INK }
            }
          />
        </>
      ) : null}
      {textFits ? (
        <Text
          numberOfLines={1}
          style={{
            position: 'absolute',
            left: horizontal ? lineStart.x + (lineLength - labelWidth) / 2 : lineStart.x + 4,
            top: horizontal ? lineStart.y - 15 : lineStart.y + Math.max(lineLength / 2 - 8, 0),
            width: labelWidth,
            color: INK,
            fontSize: 11,
            lineHeight: 14,
            textAlign: 'center',
            backgroundColor: PAPER,
          }}
        >
          {text}
        </Text>
      ) : null}
    </View>
  );
}

function hairline(x1: number, y1: number, x2: number, y2: number) {
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const horizontal = Math.abs(y1 - y2) < 0.5;
  return {
    position: 'absolute' as const,
    left,
    top,
    width: horizontal ? Math.max(Math.abs(x2 - x1), 1) : 1,
    height: horizontal ? 1 : Math.max(Math.abs(y2 - y1), 1),
    backgroundColor: HIDDEN,
  };
}
