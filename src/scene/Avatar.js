import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Avatar {
  constructor(scene) {
    this.scene = scene;
    this.model = null;
    this.skeleton = null;
    this.bones = {}; // Map of bone name -> Bone Object
    
    // We can default to a standard URL or use a placeholder
    // Using a reliable hosted model for development (Xbot from Three.js examples)
    this.modelUrl = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Xbot.glb'; 
  }

  async load() {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(this.modelUrl, (gltf) => {
        this.model = gltf.scene;
        this.scene.add(this.model);
        
        // Setup shadows
        this.model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Skeleton helpers
        const skinnedMesh = this.model.getObjectByProperty('type', 'SkinnedMesh');
        if (skinnedMesh) {
            this.skeleton = skinnedMesh.skeleton;
            // Map bones for easier access
            this.skeleton.bones.forEach(bone => {
                this.bones[bone.name] = bone;
            });
            console.log("Skeleton loaded with bones:", Object.keys(this.bones));
        }

        // Apply Mirror Material (Chrome) to the avatar mesh
        // We will do this via a method to allow toggling
        
        resolve(this.model);
      }, undefined, (error) => {
        console.error('An error happened loading the avatar:', error);
        reject(error);
      });
    });
  }

  setMaterial(material) {
    if (!this.model) return;
    this.model.traverse((child) => {
      if (child.isMesh) {
        child.material = material;
      }
    });
  }
}
