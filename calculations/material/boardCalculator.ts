import type { SavedLayer, SavedSide, SavedWall, WallSideId } from '@/construction/wallModel';

import { openingAreaMm2, openingsOverlap, squareMetres, materialLine } from './calculationRules';
import type { MaterialLine } from './types';

export function calculateBoards(wall: SavedWall): MaterialLine[] {
  if (openingsOverlap(wall.openings)) {
    return (['A', 'B'] as const).map((side) =>
      materialLine({
        id: `side-${side}-overlap`,
        group: side === 'A' ? 'cladding-a' : 'cladding-b',
        status: 'incomplete',
        basisDe: 'Die Öffnungen überschneiden sich. Die Nettofläche wird deshalb nicht ausgegeben.',
        basisEn: 'The openings overlap. The net area is therefore not given.',
      }),
    );
  }
  return [...sideLines(wall, 'A', wall.sides.A), ...sideLines(wall, 'B', wall.sides.B)];
}

function sideLines(wall: SavedWall, side: WallSideId, config: SavedSide): MaterialLine[] {
  const group = side === 'A' ? 'cladding-a' : 'cladding-b';
  const grossMm2 = wall.dimensions.lengthMm * wall.dimensions.heightMm;
  const netMm2 = grossMm2 - openingAreaMm2(wall.openings);
  const lines = config.layers.flatMap((layer) => layerLines(wall, group, side, layer, netMm2));
  if (config.layers.length > 1) {
    lines.push(
      materialLine({
        id: `side-${side}-sum`,
        group,
        theoretical: squareMetres(netMm2 * config.layers.length),
        unit: 'square-metre',
        status: 'calculable',
        nameDe: `Summe der Lagen, Seite ${side}`,
        nameEn: `Sum of the layers, side ${side}`,
        basisDe: `${config.layers.length} Lagen mal Nettofläche. Das ist keine Stückliste und keine Fugenversetzung.`,
        basisEn: `${config.layers.length} layers times the net area. This is not a cutting list and not a joint offset.`,
        warningsDe: config.staggerJoints ? ['Eine fachgerechte Fugenversetzung ist nicht geplant und steckt nicht in der Menge.'] : [],
        warningsEn: config.staggerJoints ? ['A proper joint offset is not planned and is not included in the quantity.'] : [],
      }),
    );
  }
  return lines;
}

function layerLines(wall: SavedWall, group: 'cladding-a' | 'cladding-b', side: WallSideId, layer: SavedLayer, netMm2: number): MaterialLine[] {
  const area = squareMetres(netMm2);
  const osb = layer.fastening.ruleId === 'osb-screw-missing';
  const openingTextDe = wall.openings.length ? ' Türöffnungen sind abgezogen.' : ' Ohne Öffnungsabzug.';
  const openingTextEn = wall.openings.length ? ' Door openings are deducted.' : ' No opening deducted.';
  const lines: MaterialLine[] = [
    materialLine({
      id: `side-${side}-${layer.id}-area`,
      catalogItemId: layer.catalogItemId,
      group,
      theoretical: area,
      unit: 'square-metre',
      status: osb ? 'conditional' : 'calculable',
      basisDe: `Nettofläche aus Wandmaß mal dieser Lage.${openingTextDe} Lage ${layer.orderFromFraming}, Rolle ${layer.role}.`,
      basisEn: `Net area from the wall size for this layer.${openingTextEn} Layer ${layer.orderFromFraming}, role ${layer.role}.`,
      warningsDe: osb ? ['Die Fläche ist geometrisch. Die Befestigung von OSB auf Metall ist nicht belegt.'] : [],
      warningsEn: osb ? ['The area is geometric. Fixing OSB to metal is not documented.'] : [],
    }),
  ];
  if (!layer.format) {
    lines.push(
      materialLine({
        id: `side-${side}-${layer.id}-pieces`,
        catalogItemId: layer.catalogItemId,
        group,
        status: 'incomplete',
        basisDe: 'Ohne hinterlegtes Plattenformat wird keine Stückzahl berechnet.',
        basisEn: 'No piece count is calculated without a recorded board format.',
      }),
    );
    return lines;
  }
  const boardMm2 = layer.format.widthMm * layer.format.lengthMm;
  const theoretical = netMm2 / boardMm2;
  lines.push(
    materialLine({
      id: `side-${side}-${layer.id}-pieces`,
      catalogItemId: layer.catalogItemId,
      group,
      theoretical,
      planning: Math.ceil(theoretical - 1e-9),
      unit: 'piece',
      status: 'conditional',
      basisDe: `Nettofläche geteilt durch das Format ${layer.format.widthMm} × ${layer.format.lengthMm} mm. Das ist kein Zuschnitt.`,
      basisEn: `Net area divided by the format ${layer.format.widthMm} × ${layer.format.lengthMm} mm. This is not a cutting layout.`,
      assumptionsDe: ['Die Planungsmenge ist auf ganze Platten aufgerundet. Es ist kein Verschnitt und keine Verlegeoptimierung.'],
      assumptionsEn: ['The planning quantity is rounded up to whole boards. It is not a waste allowance and not a layout optimisation.'],
    }),
  );
  return lines;
}
