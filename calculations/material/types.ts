export const CALCULATION_VERSION = 1 as const;

export type CalculationStatus = 'calculable' | 'conditional' | 'incomplete' | 'not-applicable';

export type CalculationUnit = 'piece' | 'metre' | 'square-metre' | 'cubic-metre';

export type CalculationGroup = 'framing' | 'cladding-a' | 'cladding-b' | 'insulation' | 'fasteners' | 'other';

export type MaterialLine = {
  id: string;
  catalogItemId: string | null;
  nameDe: string;
  nameEn: string;
  categoryDe: string;
  categoryEn: string;
  group: CalculationGroup;
  theoretical: number | null;
  planning: number | null;
  unit: CalculationUnit | null;
  basisDe: string;
  basisEn: string;
  assumptionsDe: readonly string[];
  assumptionsEn: readonly string[];
  status: CalculationStatus;
  warningsDe: readonly string[];
  warningsEn: readonly string[];
};

export type MaterialCalculation = {
  calculationVersion: typeof CALCULATION_VERSION;
  generatedAt: string;
  sourceUpdatedAt: string | null;
  lines: readonly MaterialLine[];
};
