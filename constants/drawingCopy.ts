import type { Language } from '@/types/settings';

import type { DrawingView } from '@/two-dimensional/geometry/project';

const de = {
  openDrawing: '2D-Zeichnung',
  title: '2D-Zeichnung',
  intro: 'Die Zeichnung liest dieselbe gespeicherte Wand wie die 3D-Ansicht und die Materialliste. Sie speichert keine eigene Konstruktion.',
  views: 'Ansicht',
  viewFront: 'Vorderansicht',
  viewBack: 'Rückansicht',
  viewSide: 'Seitenansicht',
  viewPlan: 'Draufsicht',
  viewConstruction: 'Konstruktion',
  scale: 'Maßstab',
  scaleAuto: 'Angepasst',
  reset: 'Ansicht zurücksetzen',
  zoomIn: 'Größer',
  zoomOut: 'Kleiner',
  layers: 'Ebenen',
  layerUw: 'UW-Profile',
  layerCw: 'CW-Profile',
  layerSideA: 'Beplankung A',
  layerSideB: 'Beplankung B',
  layerInsulation: 'Dämmung',
  layerOpenings: 'Öffnungen',
  layerDimensions: 'Maßlinien',
  layerDimensionText: 'Maßtext',
  layerMarkers: 'Positionen',
  numbers: 'Maßzahlen',
  markerPrefix: 'Ständerposition',
  notes: 'Hinweise',
  empty: 'Keine Bauteile eingeblendet.',
  disclaimer: 'Geometrische Darstellung. Kein geprüfter Ausführungs- oder Montageplan. Farben trennen nur die Bauteile.',
  fitted: 'Angepasst an die Fläche. Das ist kein fester Maßstab und kein Druckmaßstab.',
  namedFits: 'Bezogen auf die angenommene Pixeldichte. Das ist kein geprüfter Ausdruck.',
  namedOverflows: 'Dieser Maßstab ragt über die Fläche hinaus. Die Zeichnung bleibt maßstäblich und lässt sich verschieben. Kein Druckmaßstab.',
  zoomed: 'Die Ansicht ist gezoomt. Der gewählte Maßstab gilt nicht mehr.',
  dataMissing: 'Die gespeicherte Wand kann nicht gelesen werden. Ohne Konstruktionsdaten gibt es keine Zeichnung.',
};

const en: typeof de = {
  openDrawing: '2D drawing',
  title: '2D drawing',
  intro: 'The drawing reads the same saved wall as the 3D view and the material list. It does not store a construction of its own.',
  views: 'View',
  viewFront: 'Front',
  viewBack: 'Back',
  viewSide: 'Section',
  viewPlan: 'Plan',
  viewConstruction: 'Framing',
  scale: 'Scale',
  scaleAuto: 'Fitted',
  reset: 'Reset view',
  zoomIn: 'Larger',
  zoomOut: 'Smaller',
  layers: 'Layers',
  layerUw: 'UW profiles',
  layerCw: 'CW studs',
  layerSideA: 'Cladding A',
  layerSideB: 'Cladding B',
  layerInsulation: 'Insulation',
  layerOpenings: 'Openings',
  layerDimensions: 'Dimension lines',
  layerDimensionText: 'Dimension text',
  layerMarkers: 'Positions',
  numbers: 'Dimension figures',
  markerPrefix: 'Stud position',
  notes: 'Notes',
  empty: 'No parts are visible.',
  disclaimer: 'A geometric drawing. Not a checked fabrication or installation drawing. Colours only separate the parts.',
  fitted: 'Fitted to the screen. This is not a fixed scale and not a printed scale.',
  namedFits: 'Based on the assumed pixel density. This is not a checked print.',
  namedOverflows: 'This scale is larger than the screen. The drawing stays to scale and can be panned. Not a printed scale.',
  zoomed: 'The view is zoomed. The chosen scale no longer applies.',
  dataMissing: 'The saved wall cannot be read. There is no drawing without the construction data.',
};

const copy = { de, en };

export type DrawingCopyKey = keyof typeof de;

export function drawingText(language: Language, key: DrawingCopyKey): string {
  return copy[language][key];
}

const viewKey: Record<DrawingView, DrawingCopyKey> = {
  front: 'viewFront',
  back: 'viewBack',
  side: 'viewSide',
  plan: 'viewPlan',
  construction: 'viewConstruction',
};

export function drawingViewLabel(language: Language, view: DrawingView): string {
  return drawingText(language, viewKey[view]);
}
