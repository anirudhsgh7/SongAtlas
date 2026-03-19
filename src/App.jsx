import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function App() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;

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
    mount.appendChild(renderer.domElement);

    const particles = 5000;
    const positions = new Float32Array(particles * 3);

    for (let i = 0; i < particles; i++) {
      let radius;

      if (Math.random() < 0.75) {
    // dense inner core
        radius = Math.cbrt(Math.random()) * 1.4;
      } else {
    // outer halo
        radius = 1.4 + Math.random() * 1.0;
      }

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      const squash = 0.85 + Math.random() * 0.3;
      const twist = 0.9 + Math.random() * 0.25;

      positions[i * 3] = x * squash;
      positions[i * 3 + 1] = y * twist;
      positions[i * 3 + 2] = z;
}

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x88ccff,
      size: 0.02,
      transparent: true,
      opacity: 0.9,
    });

    const stars = new THREE.Points(geometry, material);
    scene.add(stars);
    
    const haloParticles = 2500;
    const haloPositions = new Float32Array(haloParticles * 3);

    for (let i = 0; i < haloParticles; i++) {
      const radius = 2.2 + Math.random() * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
    
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
    
      haloPositions[i * 3] = x;
      haloPositions[i * 3 + 1] = y;
      haloPositions[i * 3 + 2] = z;
    }

    const haloGeometry = new THREE.BufferGeometry();
    haloGeometry.setAttribute("position", new THREE.BufferAttribute(haloPositions, 3));

    const haloMaterial = new THREE.PointsMaterial({
      color: 0x66b8ff,
      size: 0.012,
      transparent: true,
      opacity: 0.18,
    });

    const halo = new THREE.Points(haloGeometry, haloMaterial);
    scene.add(halo);

    const flareGroup = new THREE.Group();

function createFlareArc(radius = 2.1, arcLength = 1.0, height = 0.8, pointsCount = 180) {
  const flarePositions = new Float32Array(pointsCount * 3);

  const baseAngle = Math.random() * Math.PI * 2;
  const tilt = (Math.random() - 0.5) * 0.8;

  for (let i = 0; i < pointsCount; i++) {
    const t = i / (pointsCount - 1);
    const angle = baseAngle + (t - 0.5) * arcLength;

    const r = radius + Math.sin(t * Math.PI) * height;

    let x = Math.cos(angle) * r;
    let y = Math.sin(angle) * r;
    let z = Math.sin(t * Math.PI) * 0.4;

    const cosTilt = Math.cos(tilt);
    const sinTilt = Math.sin(tilt);

    const yTilted = y * cosTilt - z * sinTilt;
    const zTilted = y * sinTilt + z * cosTilt;

    flarePositions[i * 3] = x;
    flarePositions[i * 3 + 1] = yTilted;
    flarePositions[i * 3 + 2] = zTilted;
  }

  const flareGeometry = new THREE.BufferGeometry();
  flareGeometry.setAttribute("position", new THREE.BufferAttribute(flarePositions, 3));

  const flareMaterial = new THREE.PointsMaterial({
    color: 0x9fd8ff,
    size: 0.018,
    transparent: true,
    opacity: 0.45,
  });

  const flare = new THREE.Points(flareGeometry, flareMaterial);
  flare.userData = { flareGeometry, flareMaterial };
  return flare;
}

for (let i = 0; i < 3; i++) {
  flareGroup.add(
    createFlareArc(
      2.0 + Math.random() * 0.3,
      0.8 + Math.random() * 0.8,
      0.5 + Math.random() * 0.9,
      140
    )
  );
}

scene.add(flareGroup);

    let animationId;

    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const t = clock.getElapsedTime();
      const pulse = 1 + Math.sin(t * 2.0) * 0.03;

      stars.scale.set(pulse, pulse, pulse);
      stars.rotation.y += 0.0002;
      halo.rotation.y -= 0.00015;
      halo.rotation.x += 0.00008;
      flareGroup.rotation.y += 0.0006;
      flareGroup.rotation.x += 0.0002;
      renderer.render(scene, camera);
};

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      material.dispose();
      haloGeometry.dispose();
      haloMaterial.dispose();
      flareGroup.children.forEach((child) => {
      child.userData.flareGeometry.dispose();
      child.userData.flareMaterial.dispose();
    });
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100vw", height: "100vh" }} />;
}