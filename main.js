// ----------------------------
// THREE.JS SETUP
// ----------------------------
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("threeCanvas"),
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x111111);

camera.position.z = 5;

// Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

// Grid
const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);

// ----------------------------
// VOXEL FUNCTION
// ----------------------------
function addVoxel(x, y, z) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);

  cube.position.set(
    Math.round(x),
    Math.round(y),
    Math.round(z)
  );

  scene.add(cube);
}

// ----------------------------
// RENDER LOOP
// ----------------------------
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// ----------------------------
// MEDIAPIPE HAND TRACKING
// ----------------------------

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

// Detect results
hands.onResults((results) => {
  if (results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];

    if (isPinching(landmarks)) {
      const x = (landmarks[8].x - 0.5) * 10;
      const y = (0.5 - landmarks[8].y) * 10;
      const z = 0;

      addVoxel(x, y, z);
    }
  }
});

// Camera
const cameraUtils = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 640,
  height: 480
});
cameraUtils.start();

// ----------------------------
// PINCH DETECTION
// ----------------------------
function isPinching(landmarks) {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];

  const distance = Math.sqrt(
    Math.pow(thumbTip.x - indexTip.x, 2) +
    Math.pow(thumbTip.y - indexTip.y, 2)
  );

  return distance < 0.05;
}
