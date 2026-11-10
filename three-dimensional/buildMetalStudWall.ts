import * as THREE from 'three';

import { studOffsetsMm } from '@/calculations/studLayout';
import { METAL_STUD_TEST_WALL, type MetalStudTestWall } from '@/construction/metalStudPartition';

const MM = 0.001;

function addBox(
  parent: THREE.Object3D,
  size: [number, number, number],
  position: [number, number, number],
  material: THREE.Material,
  name?: string,
): void {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  if (name) {
    mesh.name = name;
  }
  parent.add(mesh);
}

export function buildMetalStudWall(spec: MetalStudTestWall = METAL_STUD_TEST_WALL): THREE.Group {
  const length = spec.lengthMm * MM;
  const height = spec.heightMm * MM;
  const depth = spec.profileDepthMm * MM;
  const flange = spec.flangeMm * MM;
  const steel = spec.visualSteelMm * MM;
  const boardThickness = spec.boardThicknessMm * MM;
  const webDepth = depth - steel * 2;
  const flangeZ = depth / 2 - steel / 2;

  const metal = new THREE.MeshStandardMaterial({
    color: '#d5dae1',
    metalness: 0.72,
    roughness: 0.34,
  });
  const gypsum = new THREE.MeshStandardMaterial({
    color: '#f6f1e8',
    metalness: 0.02,
    roughness: 0.88,
  });

  const wall = new THREE.Group();
  wall.name = spec.id;
  wall.userData.materials = [metal, gypsum];

  const bottomY = steel / 2;
  const topY = height - steel / 2;
  const flangeRise = steel + flange / 2;
  const flangeDrop = height - steel - flange / 2;

  addBox(wall, [length, steel, webDepth], [length / 2, bottomY, 0], metal, 'uw-bottom');
  addBox(wall, [length, flange, steel], [length / 2, flangeRise, flangeZ], metal);
  addBox(wall, [length, flange, steel], [length / 2, flangeRise, -flangeZ], metal);
  addBox(wall, [length, steel, webDepth], [length / 2, topY, 0], metal, 'uw-top');
  addBox(wall, [length, flange, steel], [length / 2, flangeDrop, flangeZ], metal);
  addBox(wall, [length, flange, steel], [length / 2, flangeDrop, -flangeZ], metal);

  const studHeight = height - steel * 2;
  const studY = steel + studHeight / 2;
  const offsets = studOffsetsMm(spec.lengthMm, spec.studSpacingMm);

  offsets.forEach((offsetMm, index) => {
    const opening = offsetMm > spec.lengthMm / 2 ? -1 : 1;
    const webX = Math.min(Math.max(offsetMm * MM, steel / 2), length - steel / 2);
    const stud = new THREE.Group();
    stud.name = `cw-${index}`;
    addBox(stud, [steel, studHeight, webDepth], [0, 0, 0], metal);
    const lip = opening * (steel / 2 + flange / 2);
    addBox(stud, [flange, studHeight, steel], [lip, 0, flangeZ], metal);
    addBox(stud, [flange, studHeight, steel], [lip, 0, -flangeZ], metal);
    stud.position.set(webX, studY, 0);
    wall.add(stud);
  });

  addBox(
    wall,
    [length, height, boardThickness],
    [length / 2, height / 2, depth / 2 + boardThickness / 2],
    gypsum,
    'gypsum-board',
  );

  return wall;
}
