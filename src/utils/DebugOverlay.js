export class DebugOverlay {
  constructor() {
    this.div = document.createElement('div');
    this.div.style.position = 'absolute';
    this.div.style.top = '10px';
    this.div.style.left = '10px';
    this.div.style.background = 'rgba(0, 0, 0, 0.7)';
    this.div.style.color = '#0f0';
    this.div.style.fontFamily = 'monospace';
    this.div.style.padding = '10px';
    this.div.style.zIndex = '9999';
    this.div.style.pointerEvents = 'none';
    this.div.style.whiteSpace = 'pre';
    this.div.style.fontSize = '12px';
    document.body.appendChild(this.div);

    this.status = {
      Camera: 'Waiting...',
      MediaPipe: 'Initializing...',
      Landmarks: 'No Data',
      Model: 'Loading...',
      FPS: 0
    };
    
    this.lastTime = performance.now();
    this.frameCount = 0;
    
    this.updateDisplay();
  }

  log(key, value) {
    this.status[key] = value;
    this.updateDisplay();
  }
  
  tick() {
      this.frameCount++;
      const now = performance.now();
      if(now - this.lastTime >= 1000) {
          this.status.FPS = this.frameCount;
          this.frameCount = 0;
          this.lastTime = now;
          this.updateDisplay();
      }
  }

  updateDisplay() {
    let text = "=== SYSTEM STATUS ===\n";
    for (const [k, v] of Object.entries(this.status)) {
      text += `${k.padEnd(12)}: ${v}\n`;
    }
    this.div.textContent = text;
  }
}
