import { useState } from 'react';
import { Text, View } from 'react-native';

import type { CladdingVariant, SavedOpening } from '@/construction/wallModel';
import { useAppTheme } from '@/components/useAppTheme';

type WallSchematicProps = {
  lengthMm: number | null;
  heightMm: number | null;
  studOffsetsMm?: readonly number[];
  openings?: readonly Pick<SavedOpening, 'id' | 'offsetFromLeftMm' | 'widthMm' | 'heightMm'>[];
  sideA?: CladdingVariant | null;
  sideB?: CladdingVariant | null;
  caption: string;
  missingLabel: string;
};

export function WallSchematic({
  lengthMm,
  heightMm,
  studOffsetsMm = [],
  openings = [],
  sideA,
  sideB,
  caption,
  missingLabel,
}: WallSchematicProps) {
  const theme = useAppTheme();
  const [width, setWidth] = useState(0);
  const drawWidth = Math.max(width - 28, 0);
  const drawHeight = 200;
  const ready = lengthMm !== null && heightMm !== null && lengthMm > 0 && heightMm > 0 && drawWidth > 0;
  const scale = ready ? Math.min(drawWidth / lengthMm, drawHeight / heightMm) : 1;
  const wallWidth = ready ? lengthMm * scale : drawWidth;
  const wallHeight = ready ? heightMm * scale : 120;

  return (
    <View style={{ gap: 8 }} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <View
        style={{
          height: drawHeight + 8,
          borderRadius: theme.radius.card,
          backgroundColor: theme.colors.card,
          borderWidth: 1,
          borderColor: theme.colors.line,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {ready ? (
          <View style={{ width: wallWidth, height: wallHeight, backgroundColor: theme.colors.canvas, borderWidth: 1, borderColor: theme.colors.ink }}>
            <Band side="left" variant={sideA} />
            <Band side="right" variant={sideB} />
            {studOffsetsMm.map((offset) => (
              <View
                key={offset}
                style={{
                  position: 'absolute',
                  left: Math.min(wallWidth - 2, offset * scale),
                  top: 0,
                  bottom: 0,
                  width: 2,
                  backgroundColor: theme.colors.steel,
                }}
              />
            ))}
            {openings.map((opening) => {
              const openingHeight = Math.max(opening.heightMm * scale, 1);
              return (
                <View
                  key={opening.id}
                  style={{
                    position: 'absolute',
                    left: opening.offsetFromLeftMm * scale,
                    top: Math.max(0, wallHeight - openingHeight),
                    width: Math.max(opening.widthMm * scale, 1),
                    height: openingHeight,
                    backgroundColor: theme.colors.card,
                    borderWidth: 1,
                    borderColor: theme.colors.accentPressed,
                  }}
                />
              );
            })}
          </View>
        ) : (
          <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{missingLabel}</Text>
        )}
      </View>
      <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{caption}</Text>
    </View>
  );
}

function Band({ side, variant }: { side: 'left' | 'right'; variant?: CladdingVariant | null }) {
  if (!variant) {
    return null;
  }
  const color = variant === 'osb-gypsum' ? '#C4A574' : variant === 'double-gypsum' ? '#E88935' : '#F8E7D6';
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: variant === 'single-gypsum' ? 6 : 10,
        [side]: 0,
        backgroundColor: color,
      }}
    />
  );
}
