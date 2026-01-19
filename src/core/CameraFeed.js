export class CameraFeed {
  constructor(videoElementId) {
    this.video = document.getElementById(videoElementId);
    this.width = 1280;
    this.height = 720;
    this.stream = null;
  }

  async start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Browser API navigator.mediaDevices.getUserMedia not available');
    }

    const constraints = {
      video: {
        width: { ideal: this.width },
        height: { ideal: this.height },
        facingMode: 'user',
        frameRate: { ideal: 30 }
      },
      audio: false,
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      
      return new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.video.play();
          this.width = this.video.videoWidth;
          this.height = this.video.videoHeight;
          console.log(`Camera started: ${this.width}x${this.height}`);
          resolve(this.video);
        };
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      throw error;
    }
  }

  getVideo() {
    return this.video;
  }
}
