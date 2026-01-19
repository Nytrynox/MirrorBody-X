import { Pane } from 'tweakpane';

export class UIControls {
  constructor(world, avatar) {
    this.pane = new Pane({ container: document.getElementById('gui-container') });
    this.world = world;
    this.avatar = avatar;

    this.setupParams();
  }

  setupParams() {
    const PARAMS = {
      bloomStrength: 0.8,
      bloomThreshold: 0.5,
      bloomRadius: 0.5,
      roughness: 0.05,
      metalness: 1.0,
      avatarX: 1.5
    };

    const f1 = this.pane.addFolder({ title: 'Visual FX' });
    
    f1.addBinding(PARAMS, 'bloomStrength', { min: 0, max: 3 }).on('change', (ev) => {
        // Access bloom pass (index 1 in passes)
        this.world.composer.passes[1].strength = ev.value;
    });
    
    f1.addBinding(PARAMS, 'bloomRadius', { min: 0, max: 1 }).on('change', (ev) => {
        this.world.composer.passes[1].radius = ev.value;
    });

    const f2 = this.pane.addFolder({ title: 'Mirror Material' });
    
    f2.addBinding(PARAMS, 'roughness', { min: 0, max: 1 }).on('change', (ev) => {
        this.updateMaterial('roughness', ev.value);
    });
    
    f2.addBinding(PARAMS, 'metalness', { min: 0, max: 1 }).on('change', (ev) => {
        this.updateMaterial('metalness', ev.value);
    });
    
    f2.addBinding(PARAMS, 'avatarX', { min: -2, max: 2 }).on('change', (ev) => {
        if(this.avatar.model) {
            this.avatar.model.position.x = ev.value;
        }
    });
  }
  
  updateMaterial(prop, value) {
      if(!this.avatar.model) return;
      this.avatar.model.traverse((child) => {
          if(child.isMesh && child.material) {
              child.material[prop] = value;
          }
      });
  }
}
