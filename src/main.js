import './style.css';
import { CameraFeed } from './core/CameraFeed.js';
import { PoseTracker } from './core/PoseTracker.js';
import { World } from './scene/World.js';
import { Avatar } from './scene/Avatar.js';
import { SkeletonRetargeter } from './scene/Retargeter.js';
import { UIControls } from './ui/UIControls.js';
import { DebugOverlay } from './utils/DebugOverlay.js';
import * as THREE from 'three';
import { createMirrorMaterial } from './materials/MirrorMaterial.js';


function showError(msg) {
  const div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.top = '50%';
  div.style.left = '50%';
  div.style.transform = 'translate(-50%, -50%)';
  div.style.background = 'rgba(255, 0, 0, 0.8)';
  div.style.color = 'white';
  div.style.padding = '20px';
  div.style.zIndex = '9999';
  div.style.fontSize = '24px';
  div.style.borderRadius = '10px';
  div.style.textAlign = 'center';
  div.innerHTML = msg;
  document.body.appendChild(div);
}

async function init() {
  console.log('Initializing MirrorBody-X System...');
  const debug = new DebugOverlay();

  // 1. Setup Camera
  debug.log('Camera', 'Requesting...');
  const camera = new CameraFeed('video-source');
  let videoElement;
  try {
    videoElement = await camera.start();
    debug.log('Camera', 'Active (720p)');
  } catch (e) {
    console.error("Camera failed to start", e);
    debug.log('Camera', 'FAILED: ' + e.message);
    showError(`Camera Error:<br>${e.message}<br><br>Please allow camera access and refresh.`);
    return;
  }

  // 2. Setup Pose Tracking
  debug.log('MediaPipe', 'Loading JS...');
  const tracker = new PoseTracker(videoElement, 'canvas-output');
  tracker.onStatusChange = (status) => {
      debug.log('MediaPipe', status);
  };
  await tracker.start();

  // 3. Setup World
  const world = new World('three-canvas');
  
  // Load Avatar
  debug.log('Model', 'Downloading...');
  const avatar = new Avatar(world.scene);
  let retargeter = null;

  try {
    await avatar.load();
    console.log("Avatar loaded");
    debug.log('Model', 'Loaded XBot');
    
    // Apply Chrome Material
    const mirrorMaterial = createMirrorMaterial(null); // Env map todo
    avatar.setMaterial(mirrorMaterial);
    
    // Position Avatar (Mirror Clone Offset)
    if(avatar.model) {
        avatar.model.position.set(1.5, -1, 0); // Lowered Y to -1 to match typical floor level
        avatar.model.rotation.y = Math.PI; // Face the user
    }

    retargeter = new SkeletonRetargeter(avatar);
    
    // UI Controls
    new UIControls(world, avatar);

  } catch (e) {
    console.error("Failed to load avatar", e);
    debug.log('Model', 'FAILED');
  }
  
  // Floor (Green Nature)
  const floorGeo = new THREE.PlaneGeometry(100, 100);
  const floorMat = new THREE.MeshStandardMaterial({ 
      color: 0x2c5e1a, // Grass Green
      roughness: 1.0, 
      metalness: 0.0 
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  world.add(floor);

  // Hook up pose detection to retargeter
  tracker.onPoseDetected = (landmarks) => {
      if (retargeter) {
          retargeter.update(landmarks);
      }
  };

  // 4. Start Loop
  function loop() {
    debug.tick();
    tracker.processFrame(); // Process video
    // render loop handled by World, but we are manually calling render here
    world.render();
    requestAnimationFrame(loop);
  }
  loop();
  
  console.log('System Running.');
}

init();
