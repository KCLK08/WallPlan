export type MetalStudTestWall = {
  id: string;
  lengthMm: number;
  heightMm: number;
  studSpacingMm: number;
  profileDepthMm: number;
  flangeMm: number;
  steelThicknessMm: number;
  visualSteelMm: number;
  boardThicknessMm: number;
  trackCatalogId: string;
  studCatalogId: string;
  boardCatalogId: string;
};

/**
 * Fixed prototype. Sheet thickness is drawn thicker than 0.6 mm so the
 * channels stay readable on a phone. Outer depth and flange follow a 75 mm track.
 */
export const METAL_STUD_TEST_WALL: MetalStudTestWall = {
  id: 'prototype-metal-stud',
  lengthMm: 3000,
  heightMm: 2500,
  studSpacingMm: 625,
  profileDepthMm: 75,
  flangeMm: 40,
  steelThicknessMm: 0.6,
  visualSteelMm: 2,
  boardThicknessMm: 12.5,
  trackCatalogId: 'uw-75',
  studCatalogId: 'cw-75',
  boardCatalogId: 'gk-12-5',
};
