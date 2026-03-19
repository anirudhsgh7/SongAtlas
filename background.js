import * as THREE from "three";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.z = 6;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const particles = 2000;
const positions = new Float32Array(particles * 3);

for (let i = 0; i < particles; i++) {

  const radius = Math.random() * 5;
  const angle = radius * 2;

  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const z = (Math.random() - 0.5) * 2;

  positions[i * 3] = x;
  positions[i * 3 + 1] = y;
  positions[i * 3 + 2] = z;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positions, 3)
);

const material = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.03
});

const stars = new THREE.Points(geometry, material);
scene.add(stars);

function animate() {
  requestAnimationFrame(animate);

  stars.rotation.y += 0.0008;

  renderer.render(scene, camera);
}

animate();