import type { SavedWall } from '@/construction/wallModel';

import { calculateBoards } from './boardCalculator';
import { calculateFasteners } from './fastenerCalculator';
import { calculateInsulation } from './insulationCalculator';
import { calculateProfiles } from './profileCalculator';
import { CALCULATION_VERSION, type CalculationGroup, type MaterialCalculation } from './types';

const groupOrder: CalculationGroup[] = ['framing', 'cladding-a', 'cladding-b', 'insulation', 'fasteners', 'other'];

export function calculateMaterials(
  wall: SavedWall,
  options: { generatedAt?: string; sourceUpdatedAt?: string | null } = {},
): MaterialCalculation {
  const lines = [...calculateProfiles(wall), ...calculateBoards(wall), ...calculateInsulation(wall), ...calculateFasteners(wall)];
  return {
    calculationVersion: CALCULATION_VERSION,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    sourceUpdatedAt: options.sourceUpdatedAt ?? null,
    lines: lines.sort((left, right) => groupOrder.indexOf(left.group) - groupOrder.indexOf(right.group) || left.id.localeCompare(right.id)),
  };
}
