// ============================
// THREE.JS SETUP
// ============================

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("threeCanvas"),
  alpha: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);

camera.position.z = 5;

// Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

// Grid
const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  handCanvas.width = window.innerWidth;
  handCanvas.height = window.innerHeight;
});

// ============================
// ADD VOXEL
// ============================

function addVoxel(x, y, z) {
  const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);

  cube.position.set(
    Math.round(x),
    Math.round(y),
    Math.round(z)
  );

  scene.add(cube);
}

// ============================
// RENDER LOOP
// ============================

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// ============================
// HAND SKELETON CANVAS
// ============================

const handCanvas = document.getElementById("handCanvas");
const handCtx = handCanvas.getContext("2d");

handCanvas.width = window.innerWidth;
handCanvas.height = window.innerHeight;

// ============================
// MEDIAPIPE HAND TRACKING
// ============================

const videoElement = document.querySelector(".input_video");

const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  }
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

let lastPinchTime = 0;

hands.onResults((results) => {

  handCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);

  if (results.multiHandLandmarks.length > 0) {

    const landmarks = results.multiHandLandmarks[0];

    drawSkeleton(landmarks);

    if (isPinching(landmarks)) {

      const now = Date.now();

      if (now - lastPinchTime > 500) {
        const x = (landmarks[8].x - 0.5) * 10;
        const y = (0.5 - landmarks[8].y) * 10;
        const z = 0;

        addVoxel(x, y, z);
        lastPinchTime = now;
      }
    }
  }
});

// Start camera
const cameraUtils = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 640,
  height: 480
});

cameraUtils.start();

// ============================
// PINCH DETECTION
// ============================

function isPinching(landmarks) {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];

  const distance = Math.sqrt(
    Math.pow(thumbTip.x - indexTip.x, 2) +
    Math.pow(thumbTip.y - indexTip.y, 2)
  );

  return distance < 0.05;
}

// ============================
// DRAW SKELETON
// ============================

function drawSkeleton(landmarks) {

  const connections = [
    [0,1],[1,2],[2,3],[3,4],
    [0,5],[5,6],[6,7],[7,8],
    [0,9],[9,10],[10,11],[11,12],
    [0,13],[13,14],[14,15],[15,16],
    [0,17],[17,18],[18,19],[19,20]
  ];

  handCtx.strokeStyle = "lime";
  handCtx.lineWidth = 3;

  connections.forEach(([start, end]) => {
    const x1 = landmarks[start].x * window.innerWidth;
    const y1 = landmarks[start].y * window.innerHeight;

    const x2 = landmarks[end].x * window.innerWidth;
    const y2 = landmarks[end].y * window.innerHeight;

    handCtx.beginPath();
    handCtx.moveTo(x1, y1);
    handCtx.lineTo(x2, y2);
    handCtx.stroke();
  });

  landmarks.forEach(point => {
    const x = point.x * window.innerWidth;
    const y = point.y * window.innerHeight;

    handCtx.beginPath();
    handCtx.arc(x, y, 6, 0, 2 * Math.PI);
    handCtx.fillStyle = "red";
    handCtx.fill();
  });
}
