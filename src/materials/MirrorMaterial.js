import * as THREE from 'three';

export function createMirrorMaterial(envMap = null) {
  // CRITICAL: Metallic 1.0, Roughness 0.05 for chrome effect
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 1.0,
    roughness: 0.05,
    envMap: envMap,
    envMapIntensity: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    flatShading: false,
  });
  
  return material;
}
