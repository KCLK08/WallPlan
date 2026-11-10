import type { GeometryLayer, ViewMode } from '@/three-dimensional/geometry/types';
import type { Language } from '@/types/settings';

const de = {
  openModel: '3D-Ansicht',
  title: '3D-Ansicht',
  intro: 'Die Ansicht wird aus der gespeicherten Wand erzeugt. Sie speichert keine zweite Konstruktion.',
  reset: 'Ansicht zurücksetzen',
  perspective: 'Perspektive',
  orthographic: 'Parallelprojektion',
  modes: 'Ansicht',
  layers: 'Ebenen',
  legend: 'Farben',
  legendNote: 'Die Farben unterscheiden nur die Bauteile. Sie sagen nichts über Materialeigenschaften.',
  notes: 'Darstellungshinweise',
  disclaimer: 'Die Ansicht ist Geometrie. Sie ist kein Schall-, Brand- oder Wärmeschutznachweis und keine Montageanleitung.',
  dataMissing: 'Die gespeicherte Wand kann nicht gelesen werden. Ohne Konstruktionsdaten gibt es keine 3D-Ansicht.',
  hintTouch: 'Ein Finger dreht. Zwei Finger zoomen und verschieben.',
  hintWeb: 'Ziehen dreht. Mausrad zoomt. Umschalt-Ziehen verschiebt.',
  modeComplete: 'Gesamt',
  modeSideA: 'Seite A',
  modeSideB: 'Seite B',
  modeConstruction: 'Konstruktion',
  modeLayers: 'Schichten',
  modeExploded: 'Explosion',
  layerUw: 'UW-Profile',
  layerCw: 'CW-Profile',
  layerSideA: 'Beplankung A',
  layerSideB: 'Beplankung B',
  layerInsulation: 'Dämmung',
  layerOpenings: 'Öffnungen',
  colorUw: 'UW',
  colorCw: 'CW',
  colorA: 'Gips Seite A',
  colorB: 'Gips Seite B',
  colorOsb: 'OSB',
  colorInsulation: 'Dämmung',
  colorOpening: 'Öffnungsmarkierung',
};

const en: typeof de = {
  openModel: '3D view',
  title: '3D view',
  intro: 'The view is built from the saved wall. It does not store a second construction.',
  reset: 'Reset view',
  perspective: 'Perspective',
  orthographic: 'Orthographic',
  modes: 'View',
  layers: 'Layers',
  legend: 'Colours',
  legendNote: 'The colours only separate the parts. They do not describe material properties.',
  notes: 'Drawing notes',
  disclaimer: 'The view is geometry. It is not an acoustic, fire or thermal proof and not an installation guide.',
  dataMissing: 'The saved wall cannot be read. There is no 3D view without the construction data.',
  hintTouch: 'One finger rotates. Two fingers zoom and pan.',
  hintWeb: 'Drag to rotate. Scroll to zoom. Shift-drag to pan.',
  modeComplete: 'Whole',
  modeSideA: 'Side A',
  modeSideB: 'Side B',
  modeConstruction: 'Framing',
  modeLayers: 'Layers',
  modeExploded: 'Exploded',
  layerUw: 'UW profiles',
  layerCw: 'CW studs',
  layerSideA: 'Cladding A',
  layerSideB: 'Cladding B',
  layerInsulation: 'Insulation',
  layerOpenings: 'Openings',
  colorUw: 'UW',
  colorCw: 'CW',
  colorA: 'Gypsum side A',
  colorB: 'Gypsum side B',
  colorOsb: 'OSB',
  colorInsulation: 'Insulation',
  colorOpening: 'Opening marker',
};

const copy = { de, en };

export type ModelCopyKey = keyof typeof de;

export function modelText(language: Language, key: ModelCopyKey): string {
  return copy[language][key];
}

const modeKey: Record<ViewMode, ModelCopyKey> = {
  complete: 'modeComplete',
  'side-a': 'modeSideA',
  'side-b': 'modeSideB',
  construction: 'modeConstruction',
  layers: 'modeLayers',
  exploded: 'modeExploded',
};

export function viewModeLabel(language: Language, mode: ViewMode): string {
  return modelText(language, modeKey[mode]);
}

const layerKey: Record<GeometryLayer, ModelCopyKey> = {
  uw: 'layerUw',
  cw: 'layerCw',
  'board-a': 'layerSideA',
  'board-b': 'layerSideB',
  insulation: 'layerInsulation',
  opening: 'layerOpenings',
};

export function geometryLayerLabel(language: Language, layer: GeometryLayer): string {
  return modelText(language, layerKey[layer]);
}
