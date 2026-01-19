import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';

export class PoseTracker {
  constructor(videoElement, canvasElementId) {
    this.video = videoElement;
    this.canvas = document.getElementById(canvasElementId);
    this.ctx = this.canvas.getContext('2d');
    this.results = null;
    this.onPoseDetected = null; // Callback for external consumers (e.g., 3D engine)

    this.pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    this.pose.setOptions({
      modelComplexity: 1, // 0=Lite, 1=Full, 2=Heavy
      smoothLandmarks: true,
      enableSegmentation: false, 
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    
    // Hook for loading status
    this.onStatusChange = null;

    this.pose.onResults(this.handleResults.bind(this));
    
    // Explicitly notify initialization
    setTimeout(() => {
        if(this.onStatusChange) this.onStatusChange("Model Loaded (Assumed)");
    }, 1000);
  }

  handleResults(results) {
    if (!results) {
        if(this.onStatusChange) this.onStatusChange("No Results");
        return;
    }
    this.results = results;
    
    // Notify listeners
    if (this.onPoseDetected && results.poseLandmarks) {
      if(this.onStatusChange) this.onStatusChange(`Tracking ${results.poseLandmarks.length} Points`);
      this.onPoseDetected(results.poseLandmarks);
    } else {
      if(this.onStatusChange) this.onStatusChange("Searching...");
    }
    
    // Draw 2D debug overlay
    this.drawDebug(results);
  }

  drawDebug(results) {
    if(!this.canvas) return;
    
    // Resize canvas to match video
    if (this.canvas.width !== this.video.videoWidth || this.canvas.height !== this.video.videoHeight) {
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
    }

    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Optional: Draw video frame to canvas if we want to see it underneath
    // this.ctx.drawImage(results.image, 0, 0, this.canvas.width, this.canvas.height);

    if (results.poseLandmarks) {
      // Draw Connections
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = '#00FF00'; // Green skeleton
      
      const landmarks = results.poseLandmarks;
      
      for (const [start, end] of POSE_CONNECTIONS) {
        const startPoint = landmarks[start];
        const endPoint = landmarks[end];
        if(startPoint && endPoint) {
            this.ctx.beginPath();
            this.ctx.moveTo(startPoint.x * this.canvas.width, startPoint.y * this.canvas.height);
            this.ctx.lineTo(endPoint.x * this.canvas.width, endPoint.y * this.canvas.height);
            this.ctx.stroke();
        }
      }

      // Draw Points
      this.ctx.fillStyle = '#FF0000';
      for (const landmark of landmarks) {
        this.ctx.beginPath();
        this.ctx.arc(landmark.x * this.canvas.width, landmark.y * this.canvas.height, 4, 0, 2 * Math.PI);
        this.ctx.fill();
      }
    }
    this.ctx.restore();
  }

  async start() {
    // MediaPipe uses a send() method, but for video it's often better to just call it in a loop
    // effectively `camera.start()` from utils calls `send`
    // We will implement our own simplified loop in main or here.
    console.log("Pose tracker ready.");
  }

  async processFrame() {
    if (this.video.readyState >= 2) {
      await this.pose.send({ image: this.video });
    }
  }
}
