export const GEOMETRY_COLORS = {
  uw: '#C5CDD6',
  cw: '#7E93A8',
  gypsumA: ['#F7F1E8', '#E4D3BF', '#D2BFA8'] as const,
  gypsumB: ['#E7EBF0', '#C5CED8', '#A9B4C0'] as const,
  osb: '#C4A574',
  insulation: '#D7A15A',
  opening: '#E88935',
} as const;

export type GeometryLayer = 'uw' | 'cw' | 'board-a' | 'board-b' | 'insulation' | 'opening';

export type GeometrySide = 'A' | 'B' | null;

export type SceneBox = {
  id: string;
  layer: GeometryLayer;
  side: GeometrySide;
  /** Saved layer id for a board. Null for profiles, insulation and opening markers. */
  boardLayerId: string | null;
  catalogItemId: string | null;
  /** 0 keeps the part on the construction. Higher values move outward in the layer and explosion views. */
  stackIndex: number;
  sizeMm: [number, number, number];
  centerMm: [number, number, number];
  color: string;
};

export type GeometryNote = {
  id: string;
  kind: 'assumption' | 'missing' | 'display';
  textDe: string;
  textEn: string;
};

export type WallGeometry = {
  boxes: readonly SceneBox[];
  notes: readonly GeometryNote[];
  lengthMm: number;
  heightMm: number;
  nominalDepthMm: number;
};

export type ViewMode = 'complete' | 'side-a' | 'side-b' | 'construction' | 'layers' | 'exploded';

export type LayerToggles = {
  uw: boolean;
  cw: boolean;
  insulation: boolean;
  openings: boolean;
  sideA: boolean;
  sideB: boolean;
  boards: Readonly<Record<string, boolean>>;
};
