import type { SavedWall } from '@/construction/wallModel';

import { openingAreaMm2, openingsOverlap, squareMetres, materialLine } from './calculationRules';
import type { MaterialLine } from './types';

export function calculateInsulation(wall: SavedWall): MaterialLine[] {
  if (!wall.insulation.enabled) {
    return [
      materialLine({
        id: 'insulation-none',
        group: 'insulation',
        status: 'not-applicable',
        nameDe: 'Keine Dämmung',
        nameEn: 'No insulation',
        basisDe: 'Für diese Wand ist keine Dämmung gewählt.',
        basisEn: 'No insulation is selected for this wall.',
      }),
    ];
  }
  if (!wall.insulation.catalogItemId || wall.insulation.thicknessMm === null || openingsOverlap(wall.openings)) {
    return [
      materialLine({
        id: 'insulation-incomplete',
        catalogItemId: wall.insulation.catalogItemId,
        group: 'insulation',
        status: 'incomplete',
        basisDe: 'Dämmstoff, Dicke oder eine überschneidungsfreie Öffnungsfläche fehlen.',
        basisEn: 'Insulation, thickness or a non-overlapping opening area is missing.',
      }),
    ];
  }
  if (wall.insulation.geometricStatus === 'incompatible') {
    return [
      materialLine({
        id: 'insulation-fit',
        catalogItemId: wall.insulation.catalogItemId,
        group: 'insulation',
        status: 'incomplete',
        basisDe: 'Die gewählte Dicke passt nach der hinterlegten Geometrieregel nicht in die Profilnenntiefe. Es wird keine Menge ausgegeben.',
        basisEn: 'The chosen thickness does not fit the nominal profile depth under the stored geometric rule. No quantity is given.',
      }),
    ];
  }
  const netM2 = squareMetres(wall.dimensions.lengthMm * wall.dimensions.heightMm - openingAreaMm2(wall.openings));
  const volume = netM2 * (wall.insulation.thicknessMm / 1000);
  const lines: MaterialLine[] = [
    materialLine({
      id: 'insulation-area',
      catalogItemId: wall.insulation.catalogItemId,
      group: 'insulation',
      theoretical: netM2,
      unit: 'square-metre',
      status: 'conditional',
      basisDe: 'Nettofläche der Wand. Türöffnungen sind abgezogen. Das ist keine Schall- oder Brandschutzaussage.',
      basisEn: 'Net wall area. Door openings are deducted. This is not an acoustic or fire statement.',
      assumptionsDe: ['Die Fläche füllt den Hohlraum nur geometrisch.'],
      assumptionsEn: ['The area only fills the cavity geometrically.'],
    }),
    materialLine({
      id: 'insulation-volume',
      catalogItemId: wall.insulation.catalogItemId,
      group: 'insulation',
      theoretical: volume,
      unit: 'cubic-metre',
      status: 'conditional',
      basisDe: `Nettofläche mal ${wall.insulation.thicknessMm} mm Dicke.`,
      basisEn: `Net area times ${wall.insulation.thicknessMm} mm thickness.`,
      assumptionsDe: ['Die Dicke ist die gewählte Planungsdicke. Sie ist nur mit der Profilnenntiefe verglichen, nicht als Wärmedämmwert gerechnet.'],
      assumptionsEn: ['The thickness is the chosen planning thickness. It is only compared with the nominal profile depth, not calculated as a thermal value.'],
      warningsDe: ['Kein U-Wert, kein Schallschutz und kein Brandschutz der fertigen Wand.'],
      warningsEn: ['No U-value, acoustic rating or fire resistance of the finished wall.'],
    }),
  ];
  if (!wall.insulation.format) {
    lines.push(
      materialLine({
        id: 'insulation-pieces',
        catalogItemId: wall.insulation.catalogItemId,
        group: 'insulation',
        status: 'incomplete',
        basisDe: 'Ohne Dämmstoffformat wird keine Stückzahl berechnet.',
        basisEn: 'No piece count is calculated without an insulation format.',
      }),
    );
    return lines;
  }
  const theoretical = (netM2 * 1_000_000) / (wall.insulation.format.widthMm * wall.insulation.format.lengthMm);
  lines.push(
    materialLine({
      id: 'insulation-pieces',
      catalogItemId: wall.insulation.catalogItemId,
      group: 'insulation',
      theoretical,
      planning: Math.ceil(theoretical - 1e-9),
      unit: 'piece',
      status: 'conditional',
      basisDe: `Nettofläche geteilt durch das Format ${wall.insulation.format.widthMm} × ${wall.insulation.format.lengthMm} mm. Das ist kein Zuschnitt.`,
      basisEn: `Net area divided by the format ${wall.insulation.format.widthMm} × ${wall.insulation.format.lengthMm} mm. This is not a cutting layout.`,
      assumptionsDe: ['Die Planungsmenge ist auf ganze Platten aufgerundet. Es ist kein Verschnitt.'],
      assumptionsEn: ['The planning quantity is rounded up to whole boards. It is not a waste allowance.'],
    }),
  );
  return lines;
}
