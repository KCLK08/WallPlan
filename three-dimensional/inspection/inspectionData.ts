import { findMaterial } from '@/catalog/materials';
import type { SavedLayer, SavedOpening, SavedWall, WallSideId } from '@/construction/wallModel';
import { profileSection } from '@/three-dimensional/geometry/profileGeometry';
import type { SceneBox, WallGeometry } from '@/three-dimensional/geometry/types';

import type { FactGroup, InspectionFact, InspectionRecord } from './inspectionTypes';
import { selectionIdForBox } from './selection';

const missing = { de: 'Nicht hinterlegt', en: 'Not recorded' };

export function inspectPart(wall: SavedWall, geometry: WallGeometry, selectionId: string): InspectionRecord | null {
  const parts = geometry.boxes.filter((box) => selectionIdForBox(box) === selectionId);
  if (parts.length === 0) {
    return null;
  }
  if (selectionId.startsWith('uw-') || selectionId.startsWith('cw-')) {
    return inspectProfile(wall, selectionId, parts);
  }
  if (selectionId.startsWith('board-')) {
    return inspectBoard(wall, selectionId, parts);
  }
  if (selectionId.startsWith('insulation-')) {
    return inspectInsulation(wall, selectionId, parts);
  }
  if (selectionId.startsWith('opening-')) {
    return inspectOpening(wall, selectionId);
  }
  return null;
}

export function formatMillimetres(value: number, language: 'de' | 'en'): string {
  const locale = language === 'de' ? 'de-DE' : 'en-GB';
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)} mm`;
}

function inspectProfile(wall: SavedWall, selectionId: string, parts: readonly SceneBox[]): InspectionRecord {
  const catalogId = selectionId.startsWith('cw-') ? wall.framing.cwCatalogId : wall.framing.uwCatalogId;
  const section = profileSection(catalogId, wall.framing.nominalDepthMm);
  const item = findMaterial(catalogId);
  const web = parts.find((box) => box.id.endsWith('-web')) ?? parts[0];
  const bounds = boundsOf(parts);
  const place = selectionId.startsWith('cw-') ? 'CW-Ständer' : profilePlace(selectionId);
  const facts: InspectionFact[] = [
    fact('general', 'Kategorie', 'Category', 'Metallprofil', 'Metal profile'),
    fact('general', 'Bezeichnung', 'Name', item?.nameDe ?? missing.de, item?.nameEn ?? missing.en),
    fact('general', 'Material-ID', 'Material id', catalogId, catalogId),
    fact('geometry', 'Gezeichnete Länge', 'Drawn length', mm(bounds.width), mm(bounds.width, 'en')),
    fact('geometry', 'Gezeichnete Höhe', 'Drawn height', mm(bounds.height), mm(bounds.height, 'en')),
    fact('geometry', 'Gezeichnete Tiefe', 'Drawn depth', mm(bounds.depth), mm(bounds.depth, 'en')),
    fact('geometry', 'Mitte von links', 'Centre from the left', mm(web.centerMm[0]), mm(web.centerMm[0], 'en')),
    fact('geometry', 'Mitte über dem Boden', 'Centre above the floor', mm(web.centerMm[1]), mm(web.centerMm[1], 'en')),
    fact('construction', 'Profilbreite', 'Profile width', mm(wall.framing.nominalDepthMm), mm(wall.framing.nominalDepthMm, 'en')),
    fact(
      'construction',
      'Materialstärke',
      'Material thickness',
      section.steelMm === null ? missing.de : mm(section.steelMm),
      section.steelMm === null ? missing.en : mm(section.steelMm, 'en'),
    ),
    fact(
      'construction',
      'Flansch',
      'Flange',
      section.flangeMm === null ? missing.de : section.flangeSource === 'type-name' ? `${mm(section.flangeMm)} aus der Typbezeichnung` : mm(section.flangeMm),
      section.flangeMm === null ? missing.en : section.flangeSource === 'type-name' ? `${mm(section.flangeMm, 'en')} from the type name` : mm(section.flangeMm, 'en'),
    ),
  ];
  if (selectionId.startsWith('cw-')) {
    const offset = storedOffset(wall, selectionId);
    if (offset !== null) {
      facts.push(fact('geometry', 'Gespeicherte Position von links', 'Stored position from the left', mm(offset), mm(offset, 'en')));
      const previous = previousOffset(wall, offset);
      const next = nextOffset(wall, offset);
      if (previous !== null) {
        facts.push(fact('geometry', 'Abstand zum linken Ständer', 'Distance to the stud on the left', mm(offset - previous), mm(offset - previous, 'en')));
      }
      if (next !== null) {
        facts.push(fact('geometry', 'Abstand zum rechten Ständer', 'Distance to the stud on the right', mm(next - offset), mm(next - offset, 'en')));
      }
      const opening = wall.openings.find((entry) => offset > entry.offsetFromLeftMm + 1 && offset < entry.offsetFromLeftMm + entry.widthMm - 1);
      facts.push(
        fact(
          'construction',
          'Türöffnung',
          'Door opening',
          opening ? openingLabel(opening) : 'Keine',
          opening ? openingLabel(opening, 'en') : 'None',
        ),
      );
    }
  }
  return { id: selectionId, titleDe: place, titleEn: place === 'CW-Ständer' ? 'CW stud' : profilePlace(selectionId, 'en'), facts };
}

function inspectBoard(wall: SavedWall, selectionId: string, parts: readonly SceneBox[]): InspectionRecord | null {
  const match = selectionId.match(/^board-([AB])-(.+)$/);
  if (!match) {
    return null;
  }
  const side = match[1] as WallSideId;
  const layerId = match[2];
  const config = wall.sides[side];
  const layer = config.layers.find((entry) => entry.id === layerId);
  if (!layer) {
    return null;
  }
  const item = findMaterial(layer.catalogItemId);
  const bounds = boundsOf(parts);
  const facts: InspectionFact[] = [
    fact('general', 'Kategorie', 'Category', item?.board?.family === 'osb' ? 'OSB-Platte' : 'Beplankung', item?.board?.family === 'osb' ? 'OSB board' : 'Cladding'),
    fact('general', 'Bezeichnung', 'Name', item?.nameDe ?? missing.de, item?.nameEn ?? missing.en),
    fact('general', 'Material-ID', 'Material id', layer.catalogItemId, layer.catalogItemId),
    fact('general', 'Wandseite', 'Wall side', `Seite ${side}`, `Side ${side}`),
    fact('general', 'Schicht', 'Layer', `${layer.orderFromFraming} von ${config.layers.length}`, `${layer.orderFromFraming} of ${config.layers.length}`),
    fact('geometry', 'Ausdehnung, Breite', 'Extent, width', mm(bounds.width), mm(bounds.width, 'en')),
    fact('geometry', 'Ausdehnung, Höhe', 'Extent, height', mm(bounds.height), mm(bounds.height, 'en')),
    fact('geometry', 'Plattenstärke', 'Board thickness', layerThickness(layer), layerThickness(layer, 'en')),
    fact('geometry', 'Hinterlegtes Format', 'Recorded format', layer.format ? `${mm(layer.format.widthMm)} × ${mm(layer.format.lengthMm)}` : missing.de, layer.format ? `${mm(layer.format.widthMm, 'en')} × ${mm(layer.format.lengthMm, 'en')}` : missing.en),
    fact('construction', 'Beplankung', 'Cladding', variantLabel(config.variant), variantLabel(config.variant, 'en')),
    fact('construction', 'Anzahl der Lagen', 'Number of layers', String(config.layers.length), String(config.layers.length)),
    fact('construction', 'Rolle', 'Role', layer.role === 'backing' ? 'Innere Lage' : 'Äußere Lage', layer.role === 'backing' ? 'Inner layer' : 'Outer layer'),
    fact(
      'construction',
      'Türöffnungen',
      'Door openings',
      wall.openings.length ? wall.openings.map((opening) => openingLabel(opening)).join(', ') : 'Keine',
      wall.openings.length ? wall.openings.map((opening) => openingLabel(opening, 'en')).join(', ') : 'None',
    ),
  ];
  return {
    id: selectionId,
    titleDe: `${item?.nameDe ?? 'Beplankung'}, Seite ${side}`,
    titleEn: `${item?.nameEn ?? 'Cladding'}, side ${side}`,
    facts,
  };
}

function inspectInsulation(wall: SavedWall, selectionId: string, parts: readonly SceneBox[]): InspectionRecord {
  const item = wall.insulation.catalogItemId ? findMaterial(wall.insulation.catalogItemId) : undefined;
  const bounds = boundsOf(parts);
  return {
    id: selectionId,
    titleDe: 'Dämmstoffbereich',
    titleEn: 'Insulation area',
    facts: [
      fact('general', 'Kategorie', 'Category', 'Dämmung', 'Insulation'),
      fact('general', 'Bezeichnung', 'Name', item?.nameDe ?? missing.de, item?.nameEn ?? missing.en),
      fact(
        'general',
        'Material-ID',
        'Material id',
        wall.insulation.catalogItemId ?? missing.de,
        wall.insulation.catalogItemId ?? missing.en,
      ),
      fact('geometry', 'Feldbreite', 'Bay width', mm(bounds.width), mm(bounds.width, 'en')),
      fact('geometry', 'Feldhöhe', 'Bay height', mm(bounds.height), mm(bounds.height, 'en')),
      fact('geometry', 'Dicke', 'Thickness', wall.insulation.thicknessMm === null ? missing.de : mm(wall.insulation.thicknessMm), wall.insulation.thicknessMm === null ? missing.en : mm(wall.insulation.thicknessMm, 'en')),
      fact('geometry', 'Mitte von links', 'Centre from the left', mm(bounds.centerX), mm(bounds.centerX, 'en')),
      fact('construction', 'Hinweis', 'Note', 'Nur die gewählte Dicke im Hohlraum. Kein Schall-, Brand- oder Wärmeschutzwert der Wand.', 'Only the chosen thickness in the cavity. No acoustic, fire or thermal value of the wall.'),
    ],
  };
}

function inspectOpening(wall: SavedWall, selectionId: string): InspectionRecord | null {
  const id = selectionId.slice('opening-'.length);
  const opening = wall.openings.find((entry) => entry.id === id);
  if (!opening) {
    return null;
  }
  return {
    id: selectionId,
    titleDe: opening.name || 'Türöffnung',
    titleEn: opening.name || 'Door opening',
    facts: [
      fact('general', 'Kategorie', 'Category', 'Türöffnung', 'Door opening'),
      fact('general', 'Bezeichnung', 'Name', opening.name || missing.de, opening.name || missing.en),
      fact('geometry', 'Breite', 'Width', mm(opening.widthMm), mm(opening.widthMm, 'en')),
      fact('geometry', 'Höhe', 'Height', mm(opening.heightMm), mm(opening.heightMm, 'en')),
      fact('geometry', 'Abstand von links', 'Distance from the left', mm(opening.offsetFromLeftMm), mm(opening.offsetFromLeftMm, 'en')),
      fact('construction', 'UA und Sturz', 'UA and lintel', 'Nicht als Einbau hinterlegt', 'Installation is not recorded'),
    ],
  };
}

function fact(group: FactGroup, labelDe: string, labelEn: string, valueDe: string, valueEn: string): InspectionFact {
  return { group, labelDe, labelEn, valueDe, valueEn };
}

function mm(value: number, language: 'de' | 'en' = 'de'): string {
  return formatMillimetres(value, language);
}

function layerThickness(layer: SavedLayer, language: 'de' | 'en' = 'de'): string {
  const item = findMaterial(layer.catalogItemId);
  const thickness = item?.board?.thicknessMm ?? item?.thicknessMm;
  if (thickness === undefined) {
    return language === 'de' ? missing.de : missing.en;
  }
  return mm(thickness, language);
}

function profilePlace(selectionId: string, language: 'de' | 'en' = 'de'): string {
  const english = language === 'en';
  if (selectionId === 'uw-floor') return english ? 'UW floor track' : 'UW-Bodenprofil';
  if (selectionId === 'uw-ceiling') return english ? 'UW ceiling track' : 'UW-Deckenprofil';
  if (selectionId === 'uw-left') return english ? 'UW connection, left' : 'UW-Anschluss links';
  if (selectionId === 'uw-right') return english ? 'UW connection, right' : 'UW-Anschluss rechts';
  return english ? 'Profile' : 'Profil';
}

function variantLabel(variant: SavedWall['sides']['A']['variant'], language: 'de' | 'en' = 'de'): string {
  if (variant === 'double-gypsum') return language === 'de' ? 'Zwei Lagen Gipskarton' : 'Two gypsum layers';
  if (variant === 'osb-gypsum') return language === 'de' ? 'OSB und Gipskarton' : 'OSB and gypsum';
  return language === 'de' ? 'Eine Lage Gipskarton' : 'One gypsum layer';
}

function openingLabel(opening: SavedOpening, language: 'de' | 'en' = 'de'): string {
  const name = opening.name || (language === 'de' ? 'Tür' : 'Door');
  return `${name}, ${mm(opening.widthMm, language)} × ${mm(opening.heightMm, language)}`;
}

function storedOffset(wall: SavedWall, selectionId: string): number | null {
  const index = Number(selectionId.slice(3));
  const offsets = uniqueOffsets(wall.framing.studOffsetsMm);
  return Number.isInteger(index) ? (offsets[index] ?? null) : null;
}

function previousOffset(wall: SavedWall, offset: number): number | null {
  const lower = uniqueOffsets(wall.framing.studOffsetsMm).filter((entry) => entry < offset - 0.1);
  return lower.length ? lower[lower.length - 1] : null;
}

function nextOffset(wall: SavedWall, offset: number): number | null {
  return uniqueOffsets(wall.framing.studOffsetsMm).find((entry) => entry > offset + 0.1) ?? null;
}

function uniqueOffsets(offsets: readonly number[]): number[] {
  const seen = new Set<number>();
  const result: number[] = [];
  for (const offset of offsets) {
    const key = Math.round(offset * 10);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(offset);
  }
  return result;
}

function boundsOf(parts: readonly SceneBox[]): { width: number; height: number; depth: number; centerX: number } {
  const min = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  const max = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
  for (const box of parts) {
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], box.centerMm[axis] - box.sizeMm[axis] / 2);
      max[axis] = Math.max(max[axis], box.centerMm[axis] + box.sizeMm[axis] / 2);
    }
  }
  return {
    width: max[0] - min[0],
    height: max[1] - min[1],
    depth: max[2] - min[2],
    centerX: (min[0] + max[0]) / 2,
  };
}
