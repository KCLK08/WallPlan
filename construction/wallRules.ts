import { assessCompatibility, fastenersFor } from '@/catalog/compatibility';
import { findMaterial, MATERIALS } from '@/catalog/materials';
import type { BoardFormat, CompatibilityStatus, MaterialItem } from '@/catalog/types';
import { studOffsetsMm } from '@/calculations/studLayout';
import type { Language, UnitSystem } from '@/types/settings';

import {
  CONFIG_VERSION,
  CONSTRUCTION_KINDS_VISIBLE,
  DOUBLE_STUD_SUPPORT,
  PLANNER_LIMITS,
  PLANNING_SPACINGS_MM,
  type CladdingVariant,
  type ConstructionKind,
  type LayerDraft,
  type OpeningDraft,
  type SavedLayer,
  type SavedOpening,
  type SavedSide,
  type SavedWall,
  type SideDraft,
  type WallDraft,
  type WallSideId,
} from './wallModel';

const gypsumFamilies = new Set(['gypsum-a', 'gypsum-h2', 'gypsum-f', 'acoustic', 'hard-gypsum', 'gypsum-fibre']);

/** Only this catalog row stores the fermacell spacing rule "thickness times 50". */
const FIBRE_SPACING_RULE_ID = 'board-fibre-12-5';

const statusRank: Record<CompatibilityStatus, number> = {
  compatible: 0,
  conditional: 1,
  'not-assessed': 2,
  incompatible: 3,
};

export type DimensionError = 'not-numeric' | 'not-positive' | 'below-min' | 'above-max';

export type OpeningError = 'not-numeric' | 'not-positive' | 'negative' | 'implausible' | 'outside' | 'overlap';

export type WallIssue =
  | { code: 'name-required' }
  | { code: 'length' | 'height'; reason: DimensionError }
  | { code: 'profile-required' | 'profile-incompatible' | 'spacing-required' }
  | { code: 'spacing-rejected'; boardId: string; maxMm: number }
  | { code: 'layer-required' | 'layer-kind' | 'format-required'; side: WallSideId; layerId: string }
  | { code: 'insulation-incomplete' | 'insulation-fit' }
  | { code: 'opening'; id: string; reason: OpeningError };

export type ProfileChoice = {
  nominalDepthMm: number;
  uwCatalogId: string;
  cwCatalogId: string;
  status: CompatibilityStatus;
  ruleId: string;
};

export type ConstructionTypeChoice = {
  kind: ConstructionKind;
  available: boolean;
  reason: 'ready' | 'no-stored-rules' | 'later';
};

export function createStableId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function constructionTypeChoices(): ConstructionTypeChoice[] {
  return CONSTRUCTION_KINDS_VISIBLE.map((kind) => {
    if (kind === 'metal-stud-partition') {
      return { kind, available: true, reason: 'ready' };
    }
    if (kind === 'double-stud-partition') {
      return { kind, available: false, reason: DOUBLE_STUD_SUPPORT.reason };
    }
    return { kind, available: false, reason: 'later' };
  });
}

export function createWallDraft(projectId: string, now = new Date().toISOString()): WallDraft {
  return {
    id: createStableId(),
    projectId,
    name: '',
    description: '',
    lengthMm: null,
    heightMm: null,
    nominalDepthMm: null,
    spacingMm: null,
    sideA: emptySide('A'),
    sideB: emptySide('B'),
    insulationCatalogId: null,
    insulationThicknessMm: null,
    openings: [],
    createdAt: now,
  };
}

export function parseLengthInput(raw: string, unit: UnitSystem): { ok: true; mm: number } | { ok: false; error: DimensionError } {
  const trimmed = raw.trim().replace(',', '.');
  if (!trimmed) {
    return { ok: false, error: 'not-numeric' };
  }
  if (trimmed.startsWith('-')) {
    return { ok: false, error: 'not-positive' };
  }
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return { ok: false, error: 'not-numeric' };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, error: 'not-positive' };
  }
  const mm = unit === 'cm' ? value * 10 : unit === 'm' ? value * 1000 : value;
  return { ok: true, mm: Math.round(mm * 1000) / 1000 };
}

export function lengthToInput(mm: number, unit: UnitSystem, language: Language): string {
  const value = unit === 'cm' ? mm / 10 : unit === 'm' ? mm / 1000 : mm;
  const text = String(Math.round(value * 1000) / 1000);
  return language === 'de' ? text.replace('.', ',') : text;
}

export function checkSpan(mm: number, axis: 'length' | 'height'): DimensionError | null {
  const min = axis === 'length' ? PLANNER_LIMITS.minLengthMm : PLANNER_LIMITS.minHeightMm;
  const max = axis === 'length' ? PLANNER_LIMITS.maxLengthMm : PLANNER_LIMITS.maxHeightMm;
  if (mm < min) {
    return 'below-min';
  }
  if (mm > max) {
    return 'above-max';
  }
  return null;
}

export function profileChoices(): ProfileChoice[] {
  const tracks = wallProfiles('uw');
  const studs = wallProfiles('cw');
  const choices: ProfileChoice[] = [];
  for (const stud of studs) {
    const track = tracks.find((item) => item.profile?.nominalDepthMm === stud.profile?.nominalDepthMm);
    if (!track?.profile || !stud.profile) {
      continue;
    }
    const finding = assessCompatibility(stud.id, track.id);
    if (finding.status !== 'compatible') {
      continue;
    }
    choices.push({
      nominalDepthMm: stud.profile.nominalDepthMm,
      uwCatalogId: track.id,
      cwCatalogId: stud.id,
      status: finding.status,
      ruleId: finding.ruleId,
    });
  }
  return choices.sort((left, right) => left.nominalDepthMm - right.nominalDepthMm);
}

export function spacingChoices(): { spacingMm: number; status: 'not-assessed'; ruleId: 'spacing-grid-1250' }[] {
  return PLANNING_SPACINGS_MM.map((spacingMm) => ({
    spacingMm,
    status: 'not-assessed' as const,
    ruleId: 'spacing-grid-1250' as const,
  }));
}

/** Documented maximum for the one fibre board that states the rule. Null when the catalog has no numeric rule. */
export function fibreSpacingLimitMm(catalogItemId: string): number | null {
  if (catalogItemId !== FIBRE_SPACING_RULE_ID) {
    return null;
  }
  const item = findMaterial(catalogItemId);
  if (!item?.board || item.board.family !== 'gypsum-fibre') {
    return null;
  }
  return item.board.thicknessMm * 50;
}

export function spacingRejection(spacingMm: number, boardIds: readonly string[]): { boardId: string; maxMm: number } | null {
  for (const boardId of boardIds) {
    const maxMm = fibreSpacingLimitMm(boardId);
    if (maxMm !== null && spacingMm > maxMm) {
      return { boardId, maxMm };
    }
  }
  return null;
}

export function studPositions(lengthMm: number, spacingMm: number): number[] {
  return studOffsetsMm(lengthMm, spacingMm);
}

export function gypsumBoardChoices(): MaterialItem[] {
  return MATERIALS.filter((item) => item.suitableFor.includes('metal-stud-partition') && gypsumFamilies.has(item.board?.family ?? ''));
}

export function osbBoardChoices(): MaterialItem[] {
  return MATERIALS.filter(
    (item) => item.suitableFor.includes('metal-stud-partition') && item.board?.family === 'osb',
  );
}

export function insulationChoices(): MaterialItem[] {
  return MATERIALS.filter(
    (item) =>
      item.category === 'insulation' &&
      item.suitableFor.includes('metal-stud-partition') &&
      (item.insulation?.thicknessOptionsMm?.length ?? 0) > 0,
  );
}

export function thicknessChoices(catalogItemId: string, nominalDepthMm: number): { thicknessMm: number; fits: boolean }[] {
  const item = findMaterial(catalogItemId);
  const options = item?.insulation?.thicknessOptionsMm ?? [];
  return options.map((thicknessMm) => ({ thicknessMm, fits: thicknessMm <= nominalDepthMm }));
}

export function withVariant(side: SideDraft, variant: CladdingVariant): SideDraft {
  const count = variant === 'single-gypsum' ? 1 : 2;
  const layers: LayerDraft[] = [];
  for (let index = 0; index < count; index += 1) {
    const previous = side.layers[index];
    const keep = variant === side.variant;
    layers.push({
      id: previous?.id ?? createStableId(),
      catalogItemId: keep ? (previous?.catalogItemId ?? null) : null,
      format: keep ? (previous?.format ?? null) : null,
    });
  }
  return { side: side.side, variant, staggerJoints: variant === 'double-gypsum', layers };
}

export function setLayerBoard(side: SideDraft, layerId: string, catalogItemId: string): SideDraft {
  return {
    ...side,
    layers: side.layers.map((layer) =>
      layer.id === layerId ? { ...layer, catalogItemId, format: null } : layer,
    ),
  };
}

export function setLayerFormat(side: SideDraft, layerId: string, format: BoardFormat | null): SideDraft {
  return {
    ...side,
    layers: side.layers.map((layer) => (layer.id === layerId ? { ...layer, format } : layer)),
  };
}

export function formatsFor(catalogItemId: string): readonly BoardFormat[] {
  return findMaterial(catalogItemId)?.standardFormatsMm ?? [];
}

export function validateOpening(
  opening: OpeningDraft,
  wall: { lengthMm: number; heightMm: number },
  others: readonly OpeningDraft[],
): OpeningError | null {
  if (opening.widthMm === null || opening.heightMm === null || opening.offsetFromLeftMm === null) {
    return 'not-numeric';
  }
  if (opening.offsetFromLeftMm < 0) {
    return 'negative';
  }
  if (opening.widthMm <= 0 || opening.heightMm <= 0) {
    return 'not-positive';
  }
  if (opening.widthMm < PLANNER_LIMITS.minOpeningMm || opening.heightMm < PLANNER_LIMITS.minOpeningMm) {
    return 'implausible';
  }
  if (opening.offsetFromLeftMm + opening.widthMm > wall.lengthMm + 0.001 || opening.heightMm > wall.heightMm + 0.001) {
    return 'outside';
  }
  const overlaps = others.some((other) => {
    if (other.id === opening.id || other.widthMm === null || other.offsetFromLeftMm === null) {
      return false;
    }
    return opening.offsetFromLeftMm! < other.offsetFromLeftMm + other.widthMm && other.offsetFromLeftMm < opening.offsetFromLeftMm! + opening.widthMm!;
  });
  return overlaps ? 'overlap' : null;
}

export function replaceOpening(openings: readonly OpeningDraft[], next: OpeningDraft): OpeningDraft[] {
  const exists = openings.some((opening) => opening.id === next.id);
  return exists ? openings.map((opening) => (opening.id === next.id ? next : opening)) : [...openings, next];
}

export function compileWall(draft: WallDraft): { ok: true; wall: SavedWall } | { ok: false; issues: WallIssue[] } {
  const issues = validateDraft(draft);
  if (issues.length > 0) {
    return { ok: false, issues };
  }
  const choice = profileChoices().find((entry) => entry.nominalDepthMm === draft.nominalDepthMm);
  if (!choice || draft.lengthMm === null || draft.heightMm === null || draft.spacingMm === null) {
    return { ok: false, issues: [{ code: 'profile-required' }] };
  }
  const wall: SavedWall = {
    configVersion: CONFIG_VERSION,
    kind: 'metal-stud-partition',
    name: draft.name.trim().slice(0, 80),
    description: draft.description.trim().slice(0, 400),
    dimensions: { lengthMm: draft.lengthMm, heightMm: draft.heightMm },
    framing: {
      nominalDepthMm: choice.nominalDepthMm,
      uwCatalogId: choice.uwCatalogId,
      cwCatalogId: choice.cwCatalogId,
      spacingMm: draft.spacingMm,
      spacingStatus: 'not-assessed',
      spacingRuleId: 'spacing-grid-1250',
      studOffsetsMm: studPositions(draft.lengthMm, draft.spacingMm),
      connections: {
        floorCatalogId: choice.uwCatalogId,
        ceilingCatalogId: choice.uwCatalogId,
        leftCatalogId: choice.uwCatalogId,
        rightCatalogId: choice.uwCatalogId,
      },
    },
    sides: {
      A: compileSide(draft.sideA, choice.cwCatalogId),
      B: compileSide(draft.sideB, choice.cwCatalogId),
    },
    insulation: compileInsulation(draft, choice.cwCatalogId, choice.nominalDepthMm),
    openings: draft.openings.map((opening) => compileOpening(opening, choice.nominalDepthMm)),
    systemStatus: 'not-assessed',
  };
  return { ok: true, wall };
}

export function validateDraft(draft: WallDraft): WallIssue[] {
  const issues: WallIssue[] = [];
  if (!draft.name.trim()) {
    issues.push({ code: 'name-required' });
  }
  if (draft.lengthMm === null) {
    issues.push({ code: 'length', reason: 'not-numeric' });
  } else {
    const reason = checkSpan(draft.lengthMm, 'length');
    if (reason) {
      issues.push({ code: 'length', reason });
    }
  }
  if (draft.heightMm === null) {
    issues.push({ code: 'height', reason: 'not-numeric' });
  } else {
    const reason = checkSpan(draft.heightMm, 'height');
    if (reason) {
      issues.push({ code: 'height', reason });
    }
  }
  const choice = profileChoices().find((entry) => entry.nominalDepthMm === draft.nominalDepthMm);
  if (!choice) {
    issues.push({ code: 'profile-required' });
  } else if (assessCompatibility(choice.cwCatalogId, choice.uwCatalogId).status === 'incompatible') {
    issues.push({ code: 'profile-incompatible' });
  }
  if (draft.spacingMm === null || !PLANNING_SPACINGS_MM.some((spacing) => spacing === draft.spacingMm)) {
    issues.push({ code: 'spacing-required' });
  }
  issues.push(...sideIssues(draft.sideA), ...sideIssues(draft.sideB));
  if (draft.spacingMm !== null) {
    const rejected = spacingRejection(draft.spacingMm, boardIds(draft));
    if (rejected) {
      issues.push({ code: 'spacing-rejected', ...rejected });
    }
  }
  const insulationStarted = draft.insulationCatalogId !== null || draft.insulationThicknessMm !== null;
  if (insulationStarted && (draft.insulationCatalogId === null || draft.insulationThicknessMm === null || !choice)) {
    issues.push({ code: 'insulation-incomplete' });
  } else if (draft.insulationCatalogId && draft.insulationThicknessMm !== null && choice) {
    const fit = thicknessChoices(draft.insulationCatalogId, choice.nominalDepthMm).find(
      (entry) => entry.thicknessMm === draft.insulationThicknessMm,
    );
    if (!fit?.fits) {
      issues.push({ code: 'insulation-fit' });
    }
  }
  if (draft.lengthMm !== null && draft.heightMm !== null) {
    for (const opening of draft.openings) {
      const reason = validateOpening(opening, { lengthMm: draft.lengthMm, heightMm: draft.heightMm }, draft.openings);
      if (reason) {
        issues.push({ code: 'opening', id: opening.id, reason });
      }
    }
  }
  return issues;
}

export function validateStep(draft: WallDraft, step: number): WallIssue[] {
  const issues = validateDraft(draft);
  if (step === 1) {
    return issues.filter((issue) => issue.code === 'name-required');
  }
  if (step === 2) {
    return issues.filter((issue) => issue.code === 'length' || issue.code === 'height');
  }
  if (step === 3) {
    return issues.filter((issue) => issue.code === 'profile-required' || issue.code === 'profile-incompatible' || issue.code === 'spacing-required');
  }
  if (step === 4) {
    return issues.filter((issue) => issue.code === 'layer-required' || issue.code === 'layer-kind' || issue.code === 'format-required' || issue.code === 'spacing-rejected');
  }
  if (step === 5) {
    return issues.filter((issue) => issue.code === 'insulation-incomplete' || issue.code === 'insulation-fit');
  }
  if (step === 6) {
    return issues.filter((issue) => issue.code === 'opening');
  }
  return issues;
}

export function draftFromWall(wall: SavedWall, projectId: string, id: string, createdAt: string): WallDraft {
  return {
    id,
    projectId,
    name: wall.name,
    description: wall.description,
    lengthMm: wall.dimensions.lengthMm,
    heightMm: wall.dimensions.heightMm,
    nominalDepthMm: wall.framing.nominalDepthMm,
    spacingMm: wall.framing.spacingMm,
    sideA: sideToDraft(wall.sides.A),
    sideB: sideToDraft(wall.sides.B),
    insulationCatalogId: wall.insulation.enabled ? wall.insulation.catalogItemId : null,
    insulationThicknessMm: wall.insulation.enabled ? wall.insulation.thicknessMm : null,
    openings: wall.openings.map((opening) => ({
      id: opening.id,
      name: opening.name,
      widthMm: opening.widthMm,
      heightMm: opening.heightMm,
      offsetFromLeftMm: opening.offsetFromLeftMm,
    })),
    createdAt,
  };
}

export function materialLabel(id: string | null, language: Language): string {
  if (!id) {
    return '';
  }
  const item = findMaterial(id);
  if (!item) {
    return id;
  }
  return language === 'de' ? item.nameDe : item.nameEn;
}

export function profileSummary(choice: ProfileChoice, language: Language): string {
  const finding = assessCompatibility(choice.cwCatalogId, choice.uwCatalogId);
  return language === 'de' ? finding.summaryDe : finding.summaryEn;
}

function emptySide(side: WallSideId): SideDraft {
  return {
    side,
    variant: 'single-gypsum',
    staggerJoints: false,
    layers: [{ id: createStableId(), catalogItemId: null, format: null }],
  };
}

function wallProfiles(family: 'uw' | 'cw'): MaterialItem[] {
  return MATERIALS.filter(
    (item) => item.profile?.family === family && item.suitableFor.includes('metal-stud-partition'),
  );
}

function boardIds(draft: WallDraft): string[] {
  return [...draft.sideA.layers, ...draft.sideB.layers].flatMap((layer) => (layer.catalogItemId ? [layer.catalogItemId] : []));
}

function sideIssues(side: SideDraft): WallIssue[] {
  const issues: WallIssue[] = [];
  side.layers.forEach((layer, index) => {
    if (!layer.catalogItemId) {
      issues.push({ code: 'layer-required', side: side.side, layerId: layer.id });
      return;
    }
    if (!layerMatchesSlot(side.variant, index, layer.catalogItemId)) {
      issues.push({ code: 'layer-kind', side: side.side, layerId: layer.id });
      return;
    }
    const formats = formatsFor(layer.catalogItemId);
    if (formats.length > 0 && !layer.format) {
      issues.push({ code: 'format-required', side: side.side, layerId: layer.id });
    } else if (layer.format && !formats.some((format) => sameFormat(format, layer.format))) {
      issues.push({ code: 'format-required', side: side.side, layerId: layer.id });
    }
  });
  return issues;
}

function layerMatchesSlot(variant: CladdingVariant, index: number, catalogItemId: string): boolean {
  const item = findMaterial(catalogItemId);
  const family = item?.board?.family;
  if (!item || !family || !item.suitableFor.includes('metal-stud-partition')) {
    return false;
  }
  if (variant === 'osb-gypsum' && index === 0) {
    return family === 'osb';
  }
  return gypsumFamilies.has(family);
}

function compileSide(side: SideDraft, profileId: string): SavedSide {
  const layers = side.layers.map((layer, index) => compileLayer(side.variant, layer, index, profileId));
  const pair = layers.length === 2 ? assessCompatibility(layers[0].catalogItemId, layers[1].catalogItemId) : null;
  const osbPair = side.variant === 'osb-gypsum';
  return {
    side: side.side,
    variant: side.variant,
    staggerJoints: side.variant === 'double-gypsum',
    layers,
    pairStatus: osbPair && pair ? pair.status : null,
    pairRuleId: osbPair && pair ? pair.ruleId : null,
  };
}

function compileLayer(variant: CladdingVariant, layer: LayerDraft, index: number, profileId: string): SavedLayer {
  const catalogItemId = layer.catalogItemId ?? '';
  const onOsb = variant === 'osb-gypsum';
  return {
    id: layer.id,
    catalogItemId,
    orderFromFraming: index + 1,
    role: index === 0 && variant !== 'single-gypsum' ? 'backing' : 'finish',
    format: layer.format,
    fastening: fasteningFor(catalogItemId, profileId, onOsb, index),
  };
}

function fasteningFor(boardId: string, profileId: string, onOsb: boolean, index: number): SavedLayer['fastening'] {
  const family = findMaterial(boardId)?.board?.family;
  if (family === 'osb' || (onOsb && index === 0)) {
    const offers = fastenersFor('osb-on-metal');
    const compatible = offers.some((offer) => offer.status === 'compatible');
    return {
      catalogItemId: null,
      status: compatible ? 'compatible' : 'not-assessed',
      offered: false,
      ruleId: 'osb-screw-missing',
    };
  }
  if (family === 'gypsum-fibre' || (onOsb && index > 0)) {
    return {
      catalogItemId: null,
      status: 'not-assessed',
      offered: false,
      ruleId: onOsb ? 'gypsum-over-osb-untested' : 'fibre-screw-missing',
    };
  }
  const profileFinding = assessCompatibility('fastener-tn-fine', profileId);
  const boardFinding = assessCompatibility('fastener-tn-fine', boardId);
  return {
    catalogItemId: 'fastener-tn-fine',
    status: worse(profileFinding.status, boardFinding.status),
    offered: false,
    ruleId: profileFinding.ruleId,
  };
}

function compileInsulation(draft: WallDraft, profileId: string, nominalDepthMm: number): SavedWall['insulation'] {
  if (!draft.insulationCatalogId || draft.insulationThicknessMm === null) {
    return {
      enabled: false,
      catalogItemId: null,
      thicknessMm: null,
      format: null,
      geometricStatus: 'omitted',
      geometricRuleId: null,
      systemStatus: 'not-assessed',
    };
  }
  const finding = assessCompatibility(draft.insulationCatalogId, profileId);
  const fit = thicknessChoices(draft.insulationCatalogId, nominalDepthMm).find(
    (entry) => entry.thicknessMm === draft.insulationThicknessMm,
  );
  const formats = formatsFor(draft.insulationCatalogId);
  return {
    enabled: true,
    catalogItemId: draft.insulationCatalogId,
    thicknessMm: draft.insulationThicknessMm,
    format: formats.length === 1 ? formats[0] : null,
    geometricStatus: fit?.fits ? finding.status : 'incompatible',
    geometricRuleId: finding.ruleId,
    systemStatus: 'not-assessed',
  };
}

function compileOpening(opening: OpeningDraft, nominalDepthMm: number): SavedOpening {
  const ua = profileByFamily('ua', nominalDepthMm);
  const lintel = profileByFamily('lintel', nominalDepthMm);
  return {
    id: opening.id,
    kind: 'door',
    name: opening.name.trim(),
    widthMm: opening.widthMm ?? 0,
    heightMm: opening.heightMm ?? 0,
    offsetFromLeftMm: opening.offsetFromLeftMm ?? 0,
    executionStatus: 'not-assessed',
    executionRuleId: 'door-execution-missing',
    uaCatalogId: ua?.id ?? null,
    lintelCatalogId: lintel?.id ?? null,
  };
}

function profileByFamily(family: 'ua' | 'lintel', nominalDepthMm: number): MaterialItem | undefined {
  return MATERIALS.find(
    (item) =>
      item.profile?.family === family &&
      item.profile.nominalDepthMm === nominalDepthMm &&
      item.suitableFor.includes('metal-stud-partition'),
  );
}

function sideToDraft(side: SavedSide): SideDraft {
  return {
    side: side.side,
    variant: side.variant,
    staggerJoints: side.staggerJoints,
    layers: side.layers.map((layer) => ({ id: layer.id, catalogItemId: layer.catalogItemId, format: layer.format })),
  };
}

function sameFormat(left: BoardFormat | null | undefined, right: BoardFormat | null | undefined): boolean {
  return !!left && !!right && left.widthMm === right.widthMm && left.lengthMm === right.lengthMm;
}

function worse(left: CompatibilityStatus, right: CompatibilityStatus): CompatibilityStatus {
  return statusRank[left] >= statusRank[right] ? left : right;
}

export function parseSavedWall(raw: string): SavedWall | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') {
      return null;
    }
    const wall = value as Partial<SavedWall>;
    if (wall.configVersion !== CONFIG_VERSION || wall.kind !== 'metal-stud-partition') {
      return null;
    }
    if (!wall.dimensions || typeof wall.dimensions.lengthMm !== 'number' || typeof wall.framing?.cwCatalogId !== 'string') {
      return null;
    }
    if (!wall.sides?.A || !wall.sides?.B || !Array.isArray(wall.openings)) {
      return null;
    }
    return wall as SavedWall;
  } catch {
    return null;
  }
}
