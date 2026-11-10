import type { SavedWall } from '@/construction/wallModel';

import { boardBoxes } from './boardGeometry';
import { insulationBoxes } from './insulationGeometry';
import { openingMarkers } from './openingGeometry';
import { profileBoxes } from './profileGeometry';
import type { WallGeometry } from './types';

export function buildWallGeometry(wall: SavedWall): WallGeometry {
  const profiles = profileBoxes(wall);
  const boards = boardBoxes(wall);
  const insulation = insulationBoxes(wall);
  const markers = boards.notes.some((note) => note.id === 'board-overlap')
    ? []
    : openingMarkers(wall.openings, wall.framing.nominalDepthMm, boards.outerAMm, boards.outerBMm);
  const markerNote =
    markers.length > 0
      ? [
          {
            id: 'opening-marker',
            kind: 'display' as const,
            textDe: 'Die orangefarbene Markierung zeigt die gespeicherte Öffnung. Sie ist kein UA-Profil und kein Türsturz.',
            textEn: 'The orange marker shows the stored opening. It is not a UA profile and not a lintel.',
          },
        ]
      : [];
  return {
    boxes: [...profiles.boxes, ...boards.boxes, ...insulation.boxes, ...markers],
    notes: [...profiles.notes, ...boards.notes, ...insulation.notes, ...markerNote],
    lengthMm: wall.dimensions.lengthMm,
    heightMm: wall.dimensions.heightMm,
    nominalDepthMm: wall.framing.nominalDepthMm,
  };
}
