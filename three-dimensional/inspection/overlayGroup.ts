import * as THREE from 'three';

import type { SceneBox } from '@/three-dimensional/geometry/types';
import { toScene } from '@/three-dimensional/geometry/units';

import type { MeasureLine } from './inspectionTypes';

const HIGHLIGHT = '#E88935';
const SHELL_MM = 16;
const LINE_MM = 16;

export function buildOverlay(selected: readonly SceneBox[], measures: readonly MeasureLine[]): THREE.Group {
  const group = new THREE.Group();
  group.name = 'inspection-overlay';
  const highlight = new THREE.MeshBasicMaterial({
    color: HIGHLIGHT,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  const measureMaterial = new THREE.MeshBasicMaterial({ color: HIGHLIGHT });
  for (const box of selected) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(
        toScene(box.sizeMm[0] + SHELL_MM),
        toScene(box.sizeMm[1] + SHELL_MM),
        toScene(box.sizeMm[2] + SHELL_MM),
      ),
      highlight,
    );
    mesh.position.set(toScene(box.centerMm[0]), toScene(box.centerMm[1]), toScene(box.centerMm[2]));
    mesh.name = `highlight-${box.id}`;
    group.add(mesh);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(toScene(box.sizeMm[0]), toScene(box.sizeMm[1]), toScene(box.sizeMm[2]))),
      new THREE.LineBasicMaterial({ color: HIGHLIGHT }),
    );
    edges.position.copy(mesh.position);
    edges.name = `highlight-edge-${box.id}`;
    group.add(edges);
  }
  for (const measure of measures) {
    if (measure.lengthMm < 1) continue;
    const size = measure.endMm.map((value, index) => Math.max(Math.abs(value - measure.startMm[index]), LINE_MM)) as [number, number, number];
    const center = measure.startMm.map((value, index) => (value + measure.endMm[index]) / 2) as [number, number, number];
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(toScene(size[0]), toScene(size[1]), toScene(size[2])), measureMaterial);
    mesh.position.set(toScene(center[0]), toScene(center[1]), toScene(center[2]));
    mesh.name = `measure-${measure.id}`;
    group.add(mesh);
  }
  group.userData.materials = [highlight, measureMaterial];
  return group;
}

export function disposeOverlay(group: THREE.Group): void {
  const materials = new Set<THREE.Material>();
  group.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
      object.geometry.dispose();
      const list = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of list) materials.add(material);
    }
  });
  for (const material of materials) material.dispose();
}
