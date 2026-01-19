import * as THREE from 'three';
import { POSE_LANDMARKS } from '@mediapipe/pose';

// MediaPipe Pose Landmark Indices
const MP = {
  NOSE: 0,
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16,
  LEFT_HIP: 23, RIGHT_HIP: 24,
  LEFT_KNEE: 25, RIGHT_KNEE: 26,
  LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
};

export class SkeletonRetargeter {
  constructor(avatar) {
    this.avatar = avatar;
    this.bones = avatar.bones;
    
    // Initial bone rotations (T-Pose) - We capture these to apply relative rotations
    this.initialRotations = {};
    if (this.avatar.skeleton) {
      this.avatar.skeleton.bones.forEach(b => {
          this.initialRotations[b.name] = b.quaternion.clone();
      });
    }
    
    // Store previous quaternions for smoothing
    this.previousQuaternions = {}; 
    this.smoothingFactor = 0.5; // Simple lerp factor
  }

  update(landmarks) {
    if (!this.avatar.skeleton || !landmarks) return;

    // Helper: Convert MediaPipe (Normalized) to Scene (World) Vector
    // MP: X right, Y down, Z (depth)
    // Three: X right, Y up, Z (depth)
    const getMPPos = (index) => {
        const lm = landmarks[index];
        // Invert Y because MP is top-left origin, 3D is bottom-left origin
        // Invert Z because MP Z is roughly depth from camera? It needs tuning.
        return new THREE.Vector3(-lm.x, -lm.y, -lm.z); 
    };

    /**
     * Rotates a bone to align with a vector defined by two MediaPipe landmarks.
     * @param {string} boneName - The name of the bone to rotate.
     * @param {number} mpStartIndex - The start landmark index.
     * @param {number} mpEndIndex - The end landmark index.
     * @param {THREE.Vector3} tPoseDirection - The direction this bone points in T-Pose (Local Space).
     */
    const rotateBone = (boneName, mpStartIndex, mpEndIndex, tPoseDirection) => {
        const bone = this.bones[boneName];
        if (!bone) return;

        // 1. Get Target Direction in "MediaPipe Space"
        const p1 = getMPPos(mpStartIndex);
        const p2 = getMPPos(mpEndIndex);
        const targetDirWorld = new THREE.Vector3().subVectors(p2, p1).normalize();

        // 2. Transform Target Direction into "Bone Parent's Space"
        // This makes the rotation local and respects the parent's current rotation.
        const parentRotation = new THREE.Quaternion();
        if (bone.parent) {
             // We need the accumulated world rotation of the parent
             // But simpler: just inverse transform the direction vector?
             // Actually, bone.parent.getWorldQuaternion is what we need to un-rotate.
             bone.parent.getWorldQuaternion(parentRotation);
        }
        
        // Inverse of parent rotation = transforming World Direction -> Local Direction
        const invParentRot = parentRotation.clone().invert();
        const targetDirLocal = targetDirWorld.clone().applyQuaternion(invParentRot);

        // 3. Current Local Direction vs Target Local Direction
        // tPoseDirection is where the bone points when rotation is (0,0,0,1)
        // We want to find Rotation R such that R * tPoseDirection = targetDirLocal
        
        const rotationQuat = new THREE.Quaternion().setFromUnitVectors(tPoseDirection, targetDirLocal);

        // 4. Smoothly apply
        // bone.quaternion.slerp(rotationQuat, 0.5);
        bone.quaternion.copy(rotationQuat); // Try instant first to test correctness
    };
    
    // T-Pose Local Vectors for XBot (Check these by viewing model in Blender if possible, but assuming standard)
    // Left Arm points +X locally relative to shoulder?
    // Actually in XBot, Left Arm is +X, Right Arm is -X?
    // Let's test with just Arms first.

    // NOTE: MP coordinates are -x, -y. 
    // Left Shoulder(11) -> Left Elbow(13) is Vector(-1, 0, 0) roughly in MP (left of screen).
    // In 3D World (Mirror), "Left" is "Right" of screen? 
    // Let's assume MP X is screen space (0..1).
    // If I raise left hand, MP y decreases (goes up).
    
    // Config for Standard Mixamo/XBot Rig
    const UP = new THREE.Vector3(0, 1, 0);
    const DOWN = new THREE.Vector3(0, -1, 0);
    const LEFT = new THREE.Vector3(1, 0, 0);  // Bone Axis?
    const RIGHT = new THREE.Vector3(-1, 0, 0);

    // XBot Specifics:
    // Left Arm usually points roughly +x in local space? No, usually +Y or +X depending on export.
    // Standard Mixamo: Hips is root.
    // Let's assume Vector(0,1,0) is along the bone length for limbs? 
    // Try: Vector(0,1,0) (Y-axis along bone)
    
    rotateBone('mixamorigLeftArm', MP.LEFT_SHOULDER, MP.LEFT_ELBOW, new THREE.Vector3(0,1,0));
    rotateBone('mixamorigLeftForeArm', MP.LEFT_ELBOW, MP.LEFT_WRIST, new THREE.Vector3(0,1,0));
    
    rotateBone('mixamorigRightArm', MP.RIGHT_SHOULDER, MP.RIGHT_ELBOW, new THREE.Vector3(0,1,0));
    rotateBone('mixamorigRightForeArm', MP.RIGHT_ELBOW, MP.RIGHT_WRIST, new THREE.Vector3(0,1,0));
    
    rotateBone('mixamorigLeftUpLeg', MP.LEFT_HIP, MP.LEFT_KNEE, new THREE.Vector3(0,1,0));
    rotateBone('mixamorigLeftLeg', MP.LEFT_KNEE, MP.LEFT_ANKLE, new THREE.Vector3(0,1,0));
  }
}
