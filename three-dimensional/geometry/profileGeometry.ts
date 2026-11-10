import { findMaterial } from '@/catalog/materials';
import type { MaterialItem } from '@/catalog/types';
import type { SavedWall } from '@/construction/wallModel';

import { DISPLAY_GAP_MM, VISUAL_STEEL_MM } from './units';
import { GEOMETRY_COLORS, type GeometryNote, type SceneBox } from './types';

export type ProfileSection = {
  catalogItemId: string;
  found: boolean;
  webDepthMm: number;
  flangeMm: number | null;
  steelMm: number | null;
  drawnSteelMm: number;
  flangeSource: 'property' | 'type-name' | 'missing';
  webSource: 'property' | 'nominal';
};

export function profileSection(catalogItemId: string, nominalDepthMm: number): ProfileSection {
  const item = findMaterial(catalogItemId);
  const webProperty = millimetresFrom(item, 'web');
  const flangeProperty = millimetresFrom(item, 'flange');
  const typeFlange = flangeProperty === null ? flangeFromTypeName(item, nominalDepthMm) : null;
  const steel = item?.profile?.steelThicknessMm ?? item?.thicknessMm ?? null;
  return {
    catalogItemId,
    found: Boolean(item),
    webDepthMm: webProperty ?? nominalDepthMm,
    flangeMm: flangeProperty ?? typeFlange,
    steelMm: steel,
    drawnSteelMm: steel !== null && steel > VISUAL_STEEL_MM ? steel : VISUAL_STEEL_MM,
    flangeSource: flangeProperty !== null ? 'property' : typeFlange !== null ? 'type-name' : 'missing',
    webSource: webProperty !== null ? 'property' : 'nominal',
  };
}

export function drawnStudCenters(wall: SavedWall): number[] {
  const uw = profileSection(wall.framing.uwCatalogId, wall.framing.nominalDepthMm);
  const cw = profileSection(wall.framing.cwCatalogId, wall.framing.nominalDepthMm);
  const endInset = (uw.flangeMm ?? uw.drawnSteelMm) + cw.drawnSteelMm / 2 + DISPLAY_GAP_MM;
  const seen = new Set<number>();
  const centers: number[] = [];
  for (const offset of wall.framing.studOffsetsMm) {
    const key = Math.round(offset * 10);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    centers.push(Math.min(Math.max(offset, endInset), wall.dimensions.lengthMm - endInset));
  }
  return centers;
}

export function profileBoxes(wall: SavedWall): { boxes: SceneBox[]; notes: GeometryNote[] } {
  const uw = profileSection(wall.framing.uwCatalogId, wall.framing.nominalDepthMm);
  const cw = profileSection(wall.framing.cwCatalogId, wall.framing.nominalDepthMm);
  const notes = sectionNotes(uw, cw);
  const length = wall.dimensions.lengthMm;
  const height = wall.dimensions.heightMm;
  const trackTop = (uw.flangeMm ?? uw.drawnSteelMm) + DISPLAY_GAP_MM;
  const trackBottom = height - trackTop;
  const boxes: SceneBox[] = [
    ...trackRun('uw-floor', uw, length, 0, false),
    ...trackRun('uw-ceiling', uw, length, height, true),
    ...sideRun('uw-left', uw, 0, trackTop, trackBottom),
    ...sideRun('uw-right', uw, length, trackTop, trackBottom),
  ];

  const centers = drawnStudCenters(wall);
  if (centers.length < wall.framing.studOffsetsMm.length) {
    notes.push({
      id: 'duplicate-stud',
      kind: 'display',
      textDe: 'Eine doppelte Ständerposition wird nur einmal gezeichnet, damit sich die Profile nicht decken.',
      textEn: 'A repeated stud position is drawn once so the profiles do not occupy the same space.',
    });
  }
  centers.forEach((x, index) => {
    const toward = x > length / 2 ? -1 : 1;
    boxes.push(...studRun(`cw-${index}`, cw, x, trackTop, trackBottom, toward));
  });
  if (centers.some((x, index) => Math.abs(x - wall.framing.studOffsetsMm[index]) > 0.01)) {
    notes.push({
      id: 'stud-inset',
      kind: 'display',
      textDe: 'Randständer rücken hinter den Anschlussflansch, damit sich die Körper nicht durchdringen. Die gespeicherte Position bleibt am Wandende.',
      textEn: 'End studs move clear of the side-track flange so the solids do not intersect. The stored position stays at the wall end.',
    });
  }

  if (wall.openings.some((opening) => studInside(wall.framing.studOffsetsMm, opening))) {
    notes.push({
      id: 'stud-through-opening',
      kind: 'assumption',
      textDe: 'Ständer in einer Türöffnung bleiben in voller Höhe. Kürzen oder ein Austausch gegen UA ist nicht geregelt und wird nicht gezeichnet.',
      textEn: 'Studs inside a door opening stay at full height. Shortening them or replacing them with UA is not defined and is not drawn.',
    });
  }
  notes.push({
    id: 'no-door-profiles',
    kind: 'missing',
    textDe: 'UA-Profile und Türstürze werden nicht gezeichnet. Katalogmaße allein legen Anzahl, Lage und Anschluss nicht fest.',
    textEn: 'UA profiles and lintels are not drawn. Catalog sizes alone do not fix their count, position or connection.',
  });
  return { boxes, notes };
}

function studInside(offsets: readonly number[], opening: { offsetFromLeftMm: number; widthMm: number }): boolean {
  return offsets.some(
    (offset) => offset > opening.offsetFromLeftMm + 1 && offset < opening.offsetFromLeftMm + opening.widthMm - 1,
  );
}

function trackRun(id: string, section: ProfileSection, lengthMm: number, edgeY: number, ceiling: boolean): SceneBox[] {
  const steel = section.drawnSteelMm;
  const inset = steel + DISPLAY_GAP_MM;
  const span = Math.max(lengthMm - inset * 2, steel);
  const yWeb = ceiling ? edgeY - steel / 2 : steel / 2;
  const boxes = [box(`${id}-web`, section, [span, steel, section.webDepthMm], [lengthMm / 2, yWeb, 0])];
  if (section.flangeMm !== null && section.flangeMm - steel > 0.5) {
    const rise = section.flangeMm - steel;
    const y = ceiling ? edgeY - steel - rise / 2 : steel + rise / 2;
    const z = section.webDepthMm / 2 - steel / 2;
    boxes.push(box(`${id}-flange-a`, section, [span, rise, steel], [lengthMm / 2, y, z]));
    boxes.push(box(`${id}-flange-b`, section, [span, rise, steel], [lengthMm / 2, y, -z]));
  }
  return boxes;
}

function sideRun(id: string, section: ProfileSection, edgeX: number, y0: number, y1: number): SceneBox[] {
  const steel = section.drawnSteelMm;
  const span = Math.max(y1 - y0, steel);
  const y = y0 + span / 2;
  const inward = edgeX === 0 ? 1 : -1;
  const xWeb = edgeX === 0 ? steel / 2 : edgeX - steel / 2;
  const boxes = [box(`${id}-web`, section, [steel, span, section.webDepthMm], [xWeb, y, 0])];
  if (section.flangeMm !== null && section.flangeMm - steel > 0.5) {
    const reach = section.flangeMm - steel;
    const x = xWeb + inward * (steel / 2 + reach / 2);
    const z = section.webDepthMm / 2 - steel / 2;
    boxes.push(box(`${id}-flange-a`, section, [reach, span, steel], [x, y, z]));
    boxes.push(box(`${id}-flange-b`, section, [reach, span, steel], [x, y, -z]));
  }
  return boxes;
}

function studRun(id: string, section: ProfileSection, x: number, y0: number, y1: number, toward: number): SceneBox[] {
  const steel = section.drawnSteelMm;
  const span = Math.max(y1 - y0, steel);
  const y = y0 + span / 2;
  const boxes = [box(`${id}-web`, section, [steel, span, section.webDepthMm], [x, y, 0], 'cw')];
  if (section.flangeMm !== null && section.flangeMm - steel > 0.5) {
    const reach = section.flangeMm - steel;
    const flangeX = x + toward * (steel / 2 + reach / 2);
    const z = section.webDepthMm / 2 - steel / 2;
    boxes.push(box(`${id}-flange-a`, section, [reach, span, steel], [flangeX, y, z], 'cw'));
    boxes.push(box(`${id}-flange-b`, section, [reach, span, steel], [flangeX, y, -z], 'cw'));
  }
  return boxes;
}

function box(
  id: string,
  section: ProfileSection,
  sizeMm: [number, number, number],
  centerMm: [number, number, number],
  kind: 'uw' | 'cw' = 'uw',
): SceneBox {
  return {
    id,
    layer: kind,
    side: null,
    boardLayerId: null,
    catalogItemId: section.found ? section.catalogItemId : null,
    stackIndex: 0,
    sizeMm,
    centerMm,
    color: kind === 'cw' ? GEOMETRY_COLORS.cw : GEOMETRY_COLORS.uw,
  };
}

function sectionNotes(uw: ProfileSection, cw: ProfileSection): GeometryNote[] {
  const notes: GeometryNote[] = [
    {
      id: 'visual-steel',
      kind: 'display',
      textDe: `Blech unter ${VISUAL_STEEL_MM} mm wird mit ${VISUAL_STEEL_MM} mm gezeichnet, damit das Profil sichtbar bleibt. Die Katalogdicke steht daneben und ist nicht verändert.`,
      textEn: `Steel thinner than ${VISUAL_STEEL_MM} mm is drawn at ${VISUAL_STEEL_MM} mm so the profile stays visible. The catalog thickness is unchanged.`,
    },
    {
      id: 'display-gap',
      kind: 'display',
      textDe: `Berührende Flächen haben ${DISPLAY_GAP_MM} mm Abstand in der Ansicht. Das ist kein Baumaß.`,
      textEn: `Touching faces are separated by ${DISPLAY_GAP_MM} mm in the view. That is not a construction dimension.`,
    },
    {
      id: 'no-return-lip',
      kind: 'missing',
      textDe: 'Die Umbördelung der CW-Profile ist nicht als Maß hinterlegt und wird nicht gezeichnet.',
      textEn: 'The return lip of the CW profiles is not recorded as a dimension and is not drawn.',
    },
  ];
  for (const section of [uw, cw]) {
    if (!section.found) {
      notes.push({
        id: `missing-${section.catalogItemId}`,
        kind: 'missing',
        textDe: `${section.catalogItemId} fehlt im Katalog. Gezeichnet wird nur die Nennbreite aus der Wand, ohne Flansch.`,
        textEn: `${section.catalogItemId} is missing from the catalog. Only the nominal width from the wall is drawn, without a flange.`,
      });
    } else if (section.flangeSource === 'missing') {
      notes.push({
        id: `flange-${section.catalogItemId}`,
        kind: 'missing',
        textDe: `Für ${section.catalogItemId} ist kein Flanschmaß hinterlegt. Der Flansch wird nicht ergänzt.`,
        textEn: `No flange size is recorded for ${section.catalogItemId}. The flange is not invented.`,
      });
    } else if (section.flangeSource === 'type-name') {
      notes.push({
        id: `flange-name-${section.catalogItemId}`,
        kind: 'assumption',
        textDe: `Der Flansch von ${section.catalogItemId} wird aus der hinterlegten Typbezeichnung gelesen, nicht aus einem eigenen Messfeld.`,
        textEn: `The flange of ${section.catalogItemId} is read from the recorded type name, not from a separate measured field.`,
      });
    }
    if (section.webSource === 'nominal') {
      notes.push({
        id: `web-${section.catalogItemId}`,
        kind: 'assumption',
        textDe: `Für ${section.catalogItemId} ist kein separates Stegmaß hinterlegt. Gezeichnet wird die Nennbreite.`,
        textEn: `No separate web size is recorded for ${section.catalogItemId}. The nominal width is drawn.`,
      });
    }
    if (section.steelMm === null) {
      notes.push({
        id: `steel-${section.catalogItemId}`,
        kind: 'missing',
        textDe: `Für ${section.catalogItemId} ist keine Blechdicke hinterlegt. ${VISUAL_STEEL_MM} mm sind nur die Strichstärke der Ansicht.`,
        textEn: `No steel thickness is recorded for ${section.catalogItemId}. ${VISUAL_STEEL_MM} mm is only the line weight of the view.`,
      });
    }
  }
  return notes;
}

function millimetresFrom(item: MaterialItem | undefined, key: string): number | null {
  const raw = item?.properties.find((property) => property.key === key)?.value;
  if (!raw) {
    return null;
  }
  const match = raw.trim().match(/^(\d+(?:[.,]\d+)?)\s*mm$/i);
  if (!match) {
    return null;
  }
  const value = Number(match[1].replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

function flangeFromTypeName(item: MaterialItem | undefined, nominalDepthMm: number): number | null {
  const raw = item?.properties.find((property) => property.key === 'name')?.value;
  if (!raw) {
    return null;
  }
  const match = raw.trim().match(/^CW\s+(\d+(?:[.,]\d+)?)\s*x\s+(\d+(?:[.,]\d+)?)\s*x\s+\d/i);
  if (!match) {
    return null;
  }
  const web = Number(match[1].replace(',', '.'));
  const flange = Number(match[2].replace(',', '.'));
  if (!Number.isFinite(web) || !Number.isFinite(flange) || Math.abs(web - nominalDepthMm) > 1) {
    return null;
  }
  return flange;
}
