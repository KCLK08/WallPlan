export function studOffsetsMm(lengthMm: number, spacingMm: number): number[] {
  if (!Number.isFinite(lengthMm) || lengthMm <= 0) {
    throw new Error('lengthMm must be greater than 0');
  }
  if (!Number.isFinite(spacingMm) || spacingMm <= 0) {
    throw new Error('spacingMm must be greater than 0');
  }

  const offsets: number[] = [];
  for (let offset = 0; offset < lengthMm - 0.001; offset += spacingMm) {
    offsets.push(Math.round(offset * 1000) / 1000);
  }
  offsets.push(lengthMm);
  return offsets;
}
