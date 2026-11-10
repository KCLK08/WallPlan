import * as THREE from 'three';

import type { SceneBox } from './types';
import { toScene } from './units';

export function buildSceneGroup(boxes: readonly SceneBox[]): THREE.Group {
  const group = new THREE.Group();
  group.name = 'saved-wall';
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  for (const box of boxes) {
    const material = materialFor(materials, box);
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(toScene(box.sizeMm[0]), toScene(box.sizeMm[1]), toScene(box.sizeMm[2])),
      material,
    );
    mesh.name = box.id;
    mesh.position.set(toScene(box.centerMm[0]), toScene(box.centerMm[1]), toScene(box.centerMm[2]));
    group.add(mesh);
  }
  group.userData.materials = [...materials.values()];
  return group;
}

export function disposeSceneGroup(group: THREE.Group): void {
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
    }
  });
  const materials = group.userData.materials;
  if (Array.isArray(materials)) {
    for (const material of materials) {
      if (material instanceof THREE.Material) {
        material.dispose();
      }
    }
  }
}

function materialFor(materials: Map<string, THREE.MeshStandardMaterial>, box: SceneBox): THREE.MeshStandardMaterial {
  const existing = materials.get(box.color);
  if (existing) {
    return existing;
  }
  const metal = box.layer === 'uw' || box.layer === 'cw';
  const created = new THREE.MeshStandardMaterial({
    color: box.color,
    metalness: metal ? 0.55 : 0.04,
    roughness: metal ? 0.38 : 0.86,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  materials.set(box.color, created);
  return created;
}
