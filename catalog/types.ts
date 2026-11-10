import type { CATALOG_VERSION } from './version';

export type MaterialCategory =
  | 'metal-profiles'
  | 'hangers'
  | 'boards'
  | 'insulation'
  | 'fasteners'
  | 'joint-compounds'
  | 'sealing'
  | 'accessories';

export type QuantityUnit = 'piece' | 'metre' | 'square-metre' | 'pack' | 'set';

export type ConstructionUse =
  | 'metal-stud-partition'
  | 'double-stud-partition'
  | 'independent-lining'
  | 'suspended-ceiling'
  | 'ceiling-lining'
  | 'timber-framing';

export type ProfileFamily = 'uw' | 'cw' | 'ua' | 'lintel' | 'cd' | 'ud' | 'hat';

export type BoardFamily =
  | 'gypsum-a'
  | 'gypsum-h2'
  | 'gypsum-f'
  | 'gypsum-fibre'
  | 'acoustic'
  | 'hard-gypsum'
  | 'cement'
  | 'osb';

export type InsulationKind = 'glass-wool' | 'stone-wool' | 'mineral-wool' | 'mat' | 'board';

export type FastenerKind =
  | 'fine-thread'
  | 'coarse-thread'
  | 'drill'
  | 'sheet-metal'
  | 'profile'
  | 'frame-anchor'
  | 'universal-anchor'
  | 'ceiling'
  | 'system';

export type ManufacturerReference = {
  manufacturer: string;
  product: string;
  sourceId: string;
};

export type MaterialProperty = {
  key: string;
  labelDe: string;
  labelEn: string;
  value: string;
  sourceId: string;
};

export type BoardFormat = {
  widthMm: number;
  lengthMm: number;
};

export type ProfileSpec = {
  family: ProfileFamily;
  nominalDepthMm: number;
  steelThicknessMm?: number;
};

export type BoardSpec = {
  family: BoardFamily;
  thicknessMm: number;
};

export type InsulationSpec = {
  kind: InsulationKind;
  thicknessOptionsMm?: readonly number[];
  lambdaWmK?: number;
};

export type FastenerSpec = {
  kind: FastenerKind;
  lengthsMm?: readonly number[];
  diameterMm?: number;
  threadDe: string;
  threadEn: string;
  substratesDe: string;
  substratesEn: string;
};

export type MaterialItem = {
  id: string;
  nameDe: string;
  nameEn: string;
  category: MaterialCategory;
  subcategory: string;
  materialType: string;
  descriptionDe: string;
  descriptionEn: string;
  thicknessMm?: number;
  standardLengthsMm?: readonly number[];
  standardFormatsMm?: readonly BoardFormat[];
  unit: QuantityUnit;
  properties: readonly MaterialProperty[];
  suitableFor: readonly ConstructionUse[];
  limitationsDe: string;
  limitationsEn: string;
  manufacturerReferences: readonly ManufacturerReference[];
  sourceIds: readonly string[];
  catalogVersion: typeof CATALOG_VERSION;
  profile?: ProfileSpec;
  board?: BoardSpec;
  insulation?: InsulationSpec;
  fastener?: FastenerSpec;
  compareWith?: readonly string[];
};

export type CladdingLayerRole = 'backing' | 'finish';

export type CladdingLayerSpec = {
  id: string;
  catalogItemId: string;
  orderFromFraming: number;
  role: CladdingLayerRole;
};

export type CompatibilityStatus = 'compatible' | 'conditional' | 'incompatible' | 'not-assessed';

export type CompatibilityFinding = {
  status: CompatibilityStatus;
  ruleId: string;
  summaryDe: string;
  summaryEn: string;
  sourceIds: readonly string[];
};
