import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

export class World {
  constructor(canvasElementId) {
    this.canvas = document.getElementById(canvasElementId);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Fallback Sky Blue
    // this.scene.fog = new THREE.Fog(0x111111, 10, 50); // Removed dark fog

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
    this.camera.position.set(0, 1.5, 4);
    
    // Renderer - M2 Optimized
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false, // Opaque for sky
      powerPreference: "high-performance" // Critical for M2
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    // Environment (PMREM for chrome reflections of the sky)
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    // Scene environment set later in setupNature

    // Post Processing
    this.composer = new EffectComposer(this.renderer);
    
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.5;
    bloomPass.strength = 0.8; // High glow for futuristic look
    bloomPass.radius = 0.5;
    this.composer.addPass(bloomPass);

    // Controls
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.target.set(0, 1, 0);

    // Lights & Nature
    this.setupNature();

    // Resize
    window.addEventListener('resize', this.onResize.bind(this));

    // Objects
    this.objects = [];
  }

  setupNature() {
    // 1. SKY
    this.sky = new Sky();
    this.sky.scale.setScalar(450000);
    this.scene.add(this.sky);

    const sunPosition = new THREE.Vector3();
    const uniforms = this.sky.material.uniforms;
    uniforms['turbidity'].value = 10;
    uniforms['rayleigh'].value = 3;
    uniforms['mieCoefficient'].value = 0.005;
    uniforms['mieDirectionalG'].value = 0.7;

    // Sun Logic
    const phi = THREE.MathUtils.degToRad(90 - 20); // Elevation
    const theta = THREE.MathUtils.degToRad(180); // Azimuth
    sunPosition.setFromSphericalCoords(1, phi, theta);
    uniforms['sunPosition'].value.copy(sunPosition);

    // 2. LIGHTS
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // Bright ambient
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048; // High res shadows for M2
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0001;
    this.scene.add(dirLight);

    // Update Environment for reflections (Chrome needs this!)
    this.scene.environment = this.pmremGenerator.fromScene(this.scene).texture;
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
  }

  add(object) {
    this.scene.add(object);
    this.objects.push(object);
  }

  render() {
    this.controls.update();
    // this.renderer.render(this.scene, this.camera);
    this.composer.render();
  }
}
