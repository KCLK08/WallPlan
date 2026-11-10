import { findMaterial } from '@/catalog/materials';
import type { SavedWall } from '@/construction/wallModel';

import { catalogText, materialLine } from './calculationRules';
import type { MaterialLine } from './types';

const noPieceDe = 'Es wird keine Stückzahl ausgegeben. Ein Zuschnitt aus Lieferlängen ist nicht hinterlegt.';
const noPieceEn = 'No piece count is given. Cutting from stock lengths is not implemented.';

export function calculateProfiles(wall: SavedWall): MaterialLine[] {
  const lengthM = wall.dimensions.lengthMm / 1000;
  const heightM = wall.dimensions.heightMm / 1000;
  const hasOpening = wall.openings.length > 0;
  const spacingWarningDe =
    'Gezählt werden die gespeicherten Ständerpositionen. Der Abstand ist keine technische Systemfreigabe.';
  const spacingWarningEn = 'The stored stud positions are counted. The spacing is not a technical system approval.';

  return [
    trackLine('uw-floor', wall.framing.connections.floorCatalogId, lengthM, 'Bodenanschluss über die volle Wandlänge.', 'Floor track across the full wall length.', hasOpening),
    trackLine(
      'uw-ceiling',
      wall.framing.connections.ceilingCatalogId,
      lengthM,
      'Deckenanschluss über die volle Wandlänge. Türöffnungen reichen hier nicht in die Decke hinein.',
      'Ceiling track across the full wall length. Door openings do not reach the ceiling in this model.',
      false,
    ),
    trackLine('uw-left', wall.framing.connections.leftCatalogId, heightM, 'Linker Wandanschluss über die volle Wandhöhe.', 'Left wall connection across the full wall height.', false),
    trackLine(
      'uw-right',
      wall.framing.connections.rightCatalogId,
      heightM,
      'Rechter Wandanschluss über die volle Wandhöhe.',
      'Right wall connection across the full wall height.',
      false,
    ),
    studLine(wall, heightM, hasOpening, spacingWarningDe, spacingWarningEn),
    ...wall.openings.flatMap((opening) => doorLines(opening.id, opening.name, opening.uaCatalogId, opening.lintelCatalogId)),
  ];
}

function trackLine(
  id: string,
  catalogItemId: string,
  metres: number,
  basisDe: string,
  basisEn: string,
  interrupted: boolean,
): MaterialLine {
  const named = catalogText(catalogItemId);
  const stock = findMaterial(catalogItemId)?.standardLengthsMm;
  const stockWarningDe = stock?.length
    ? 'Lieferlängen sind hinterlegt. Ohne Zuschnitt wird daraus keine Stückzahl.'
    : 'Lieferlängen dieser Profilbreite sind nicht hinterlegt.';
  const stockWarningEn = stock?.length
    ? 'Stock lengths are recorded. No piece count is derived without a cutting layout.'
    : 'Stock lengths for this profile width are not recorded.';
  return materialLine({
    id,
    catalogItemId: named.found ? catalogItemId : catalogItemId,
    group: 'framing',
    theoretical: named.found ? metres : null,
    unit: named.found ? 'metre' : null,
    status: !named.found ? 'incomplete' : interrupted ? 'conditional' : 'calculable',
    basisDe,
    basisEn,
    assumptionsDe: interrupted ? ['Die Bodenlänge läuft über die Türöffnung weiter. Eine Unterbrechung ist nicht hinterlegt.'] : [],
    assumptionsEn: interrupted ? ['The floor length continues across the door opening. An interruption is not recorded.'] : [],
    warningsDe: [stockWarningDe, noPieceDe],
    warningsEn: [stockWarningEn, noPieceEn],
    nameDe: named.found ? undefined : catalogItemId,
  });
}

function studLine(wall: SavedWall, heightM: number, hasOpening: boolean, spacingWarningDe: string, spacingWarningEn: string): MaterialLine {
  const count = wall.framing.studOffsetsMm.length;
  const named = catalogText(wall.framing.cwCatalogId);
  const ends = wall.framing.studOffsetsMm.filter((offset) => offset === 0 || offset === wall.dimensions.lengthMm).length;
  return materialLine({
    id: 'cw-studs',
    catalogItemId: wall.framing.cwCatalogId,
    group: 'framing',
    theoretical: named.found ? count * heightM : null,
    unit: named.found ? 'metre' : null,
    status: !named.found ? 'incomplete' : wall.framing.spacingStatus === 'not-assessed' || hasOpening ? 'conditional' : 'calculable',
    basisDe: `${count} gespeicherte Positionen, davon ${ends} am Wandende, jeweils mal Wandhöhe. Zusätzliche Endprofile werden nicht noch einmal gezählt.`,
    basisEn: `${count} stored positions, ${ends} of them at the wall ends, each multiplied by the wall height. End studs are not counted again.`,
    assumptionsDe: hasOpening ? ['Ständer in der Türöffnung bleiben in voller Höhe stehen. Kürzen oder Entfernen ist nicht geregelt.'] : [],
    assumptionsEn: hasOpening ? ['Studs inside the door opening stay at full height. Shortening or removal is not defined.'] : [],
    warningsDe: [spacingWarningDe, noPieceDe],
    warningsEn: [spacingWarningEn, noPieceEn],
  });
}

function doorLines(id: string, name: string, uaCatalogId: string | null, lintelCatalogId: string | null): MaterialLine[] {
  const label = name ? ` „${name}“` : '';
  return [
    materialLine({
      id: `door-${id}-ua`,
      catalogItemId: uaCatalogId,
      group: 'framing',
      status: 'incomplete',
      basisDe: `Zusätzliche Profile an der Türöffnung${label}. Anzahl, Anschluss und Austausch von CW-Ständern sind nicht geregelt.`,
      basisEn: `Extra profiles at door opening${label}. Count, fixing and replacement of CW studs are not defined.`,
      warningsDe: ['UA wird nicht als fertige Türlösung berechnet.'],
      warningsEn: ['UA is not calculated as a finished door solution.'],
    }),
    materialLine({
      id: `door-${id}-lintel`,
      catalogItemId: lintelCatalogId,
      group: 'framing',
      status: 'incomplete',
      basisDe: `Türsturz${label}. Eine Sturzlänge ist nicht hinterlegt und wird nicht aus der Öffnungsbreite abgeleitet.`,
      basisEn: `Door lintel${label}. A lintel length is not recorded and is not derived from the opening width.`,
      warningsDe: ['Der Sturz bleibt unvollständig.'],
      warningsEn: ['The lintel stays incomplete.'],
    }),
  ];
}
