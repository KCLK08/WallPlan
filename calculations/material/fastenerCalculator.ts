import type { SavedLayer, SavedWall, WallSideId } from '@/construction/wallModel';

import { materialLine } from './calculationRules';
import type { MaterialLine } from './types';

export function calculateFasteners(wall: SavedWall): MaterialLine[] {
  const layers = (['A', 'B'] as const).flatMap((side) => wall.sides[side].layers.map((layer) => layerLine(side, layer)));
  const doors = wall.openings.map((opening) =>
    materialLine({
      id: `door-${opening.id}-fixing`,
      group: 'fasteners',
      status: 'incomplete',
      nameDe: opening.name ? `Türbefestigung ${opening.name}` : 'Türbefestigung',
      nameEn: opening.name ? `Door fixing ${opening.name}` : 'Door fixing',
      basisDe: 'Für UA, Sturz und Türzarge ist kein Verbrauchswert hinterlegt.',
      basisEn: 'No consumption figure is recorded for UA, the lintel or the door frame.',
      warningsDe: ['Es wird keine Schrauben- oder Dübelmenge angenommen.'],
      warningsEn: ['No screw or anchor quantity is assumed.'],
    }),
  );
  return [
    ...layers,
    ...doors,
    materialLine({
      id: 'track-fixing',
      group: 'other',
      status: 'incomplete',
      nameDe: 'Befestigung der Anschlussprofile am Baukörper',
      nameEn: 'Fixing of the tracks to the structure',
      basisDe: 'Es ist kein Befestigungsmittel gewählt und kein Verbrauchswert hinterlegt.',
      basisEn: 'No fixing is selected and no consumption figure is recorded.',
    }),
  ];
}

function layerLine(side: WallSideId, layer: SavedLayer): MaterialLine {
  const missing = layer.fastening.catalogItemId === null;
  return materialLine({
    id: `fastener-${side}-${layer.id}`,
    catalogItemId: layer.fastening.catalogItemId,
    group: 'fasteners',
    status: 'incomplete',
    nameDe: missing ? `Befestigung Seite ${side}, Lage ${layer.orderFromFraming}` : undefined,
    nameEn: missing ? `Fixing side ${side}, layer ${layer.orderFromFraming}` : undefined,
    basisDe: missing
      ? `Regel ${layer.fastening.ruleId}. Eine Menge wird nicht geschätzt.`
      : `Katalogstatus ${layer.fastening.status}, Regel ${layer.fastening.ruleId}. Schraubenlänge und Verbrauch sind nicht hinterlegt.`,
    basisEn: missing
      ? `Rule ${layer.fastening.ruleId}. A quantity is not estimated.`
      : `Catalog status ${layer.fastening.status}, rule ${layer.fastening.ruleId}. Screw length and consumption are not recorded.`,
    warningsDe: ['Keine Schraubenabstände, keine Längen und keine OSB-Metall-Schraube werden erfunden.'],
    warningsEn: ['No screw spacing, length or OSB-to-metal screw is invented.'],
  });
}
