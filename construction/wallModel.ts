import type { BoardFormat, CompatibilityStatus } from '@/catalog/types';

/** Payload version stored inside `constructions.data_json`. */
export const CONFIG_VERSION = 1 as const;

/**
 * Planner input bounds. They stop empty, negative and absurd typing.
 * They are not a structural approval and not a stock-length guarantee.
 */
export const PLANNER_LIMITS = {
  minLengthMm: 200,
  maxLengthMm: 20000,
  minHeightMm: 200,
  maxHeightMm: 8000,
  minOpeningMm: 300,
} as const;

/** Grids that divide a 1 250 mm board. The catalog has no tested spacing rule for them. */
export const PLANNING_SPACINGS_MM = [312.5, 417, 625] as const;

export type PlanningSpacingMm = (typeof PLANNING_SPACINGS_MM)[number];

export type ConstructionKind =
  | 'metal-stud-partition'
  | 'double-stud-partition'
  | 'independent-lining'
  | 'suspended-ceiling'
  | 'timber-framing';

export const CONSTRUCTION_KINDS_VISIBLE: readonly ConstructionKind[] = [
  'metal-stud-partition',
  'double-stud-partition',
  'independent-lining',
  'suspended-ceiling',
  'timber-framing',
];

export type CladdingVariant = 'single-gypsum' | 'double-gypsum' | 'osb-gypsum';

export type WallSideId = 'A' | 'B';

/**
 * Reserved marker for a later double-stud wall.
 * No row spacing, coupling or depth is stored, because the catalog has no such rule.
 */
export const DOUBLE_STUD_SUPPORT = {
  kind: 'double-stud-partition',
  supported: false,
  reason: 'no-stored-rules',
} as const;

export type FasteningRecord = {
  catalogItemId: string | null;
  status: CompatibilityStatus;
  /** This phase never chooses a screw length or a count. */
  offered: false;
  ruleId: string;
};

export type SavedLayer = {
  id: string;
  catalogItemId: string;
  orderFromFraming: number;
  role: 'backing' | 'finish';
  format: BoardFormat | null;
  fastening: FasteningRecord;
};

export type SavedSide = {
  side: WallSideId;
  variant: CladdingVariant;
  /** Double gypsum keeps this so a later view can offset the joints. */
  staggerJoints: boolean;
  layers: SavedLayer[];
  /** Status of the layer pair. Null when the side has one layer. */
  pairStatus: CompatibilityStatus | null;
  pairRuleId: string | null;
};

export type SavedOpening = {
  id: string;
  kind: 'door';
  name: string;
  widthMm: number;
  heightMm: number;
  offsetFromLeftMm: number;
  executionStatus: 'not-assessed';
  executionRuleId: 'door-execution-missing';
  uaCatalogId: string | null;
  lintelCatalogId: string | null;
};

export type SavedWall = {
  configVersion: typeof CONFIG_VERSION;
  kind: 'metal-stud-partition';
  name: string;
  description: string;
  dimensions: { lengthMm: number; heightMm: number };
  framing: {
    nominalDepthMm: number;
    uwCatalogId: string;
    cwCatalogId: string;
    spacingMm: number;
    spacingStatus: 'not-assessed';
    spacingRuleId: 'spacing-grid-1250';
    studOffsetsMm: number[];
    connections: {
      floorCatalogId: string;
      ceilingCatalogId: string;
      leftCatalogId: string;
      rightCatalogId: string;
    };
  };
  sides: { A: SavedSide; B: SavedSide };
  insulation: {
    enabled: boolean;
    catalogItemId: string | null;
    thicknessMm: number | null;
    format: BoardFormat | null;
    geometricStatus: CompatibilityStatus | 'omitted';
    geometricRuleId: string | null;
    systemStatus: 'not-assessed';
  };
  openings: SavedOpening[];
  /** The finished wall has no stored fire or acoustic approval. */
  systemStatus: 'not-assessed';
};

export type LayerDraft = {
  id: string;
  catalogItemId: string | null;
  format: BoardFormat | null;
};

export type SideDraft = {
  side: WallSideId;
  variant: CladdingVariant;
  staggerJoints: boolean;
  layers: LayerDraft[];
};

export type OpeningDraft = {
  id: string;
  name: string;
  widthMm: number | null;
  heightMm: number | null;
  offsetFromLeftMm: number | null;
};

export type WallDraft = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  lengthMm: number | null;
  heightMm: number | null;
  nominalDepthMm: number | null;
  spacingMm: number | null;
  sideA: SideDraft;
  sideB: SideDraft;
  insulationCatalogId: string | null;
  insulationThicknessMm: number | null;
  openings: OpeningDraft[];
  createdAt: string;
};
