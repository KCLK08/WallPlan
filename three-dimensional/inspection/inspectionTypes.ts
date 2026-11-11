export type FactGroup = 'general' | 'geometry' | 'construction';

export type InspectionFact = {
  group: FactGroup;
  labelDe: string;
  labelEn: string;
  valueDe: string;
  valueEn: string;
};

export type InspectionRecord = {
  id: string;
  titleDe: string;
  titleEn: string;
  facts: readonly InspectionFact[];
};

export type MeasureLine = {
  id: string;
  labelDe: string;
  labelEn: string;
  lengthMm: number;
  startMm: [number, number, number];
  endMm: [number, number, number];
};
