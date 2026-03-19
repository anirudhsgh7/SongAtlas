import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function App() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    let analyser;
    let dataArray;
    let audioContext;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const setupAudio = async () => {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioContext.createMediaStreamSource(stream);
      
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
      
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
      
        source.connect(analyser);
      } catch (err) {
        console.error("Microphone access denied or failed:", err);
      }
    };

    setupAudio();    

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    const particles = 5000;
    const positions = new Float32Array(particles * 3);

    for (let i = 0; i < particles; i++) {
      let radius;

      if (Math.random() < 0.75) {
    // dense inner core
        radius = Math.cbrt(Math.random()) * 2.2;
      } else {
    // outer halo
        radius = 2.2 + Math.random() * 1.4;
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
    const haloBasePositions = new Float32Array(haloParticles * 3);
    for (let i = 0; i < haloParticles; i++) {
      const radius = 3.2 + Math.random() * 1.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
    
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
    
      haloPositions[i * 3] = x;
      haloPositions[i * 3 + 1] = y;
      haloPositions[i * 3 + 2] = z;
      haloBasePositions[i * 3] = x;
      haloBasePositions[i * 3 + 1] = y;
      haloBasePositions[i * 3 + 2] = z;
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

    let animationId;

    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      let bass = 0;
      let treble = 0;
      let avg = 0;
          
      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
      
        let bassSum = 0;
        let trebleSum = 0;
        let totalSum = 0;
      
        const bassEnd = Math.floor(dataArray.length * 0.15);
        const trebleStart = Math.floor(dataArray.length * 0.6);
      
        for (let i = 0; i < dataArray.length; i++) {
          totalSum += dataArray[i];
        
          if (i < bassEnd) bassSum += dataArray[i];
          if (i > trebleStart) trebleSum += dataArray[i];
        }
      
        bass = bassSum / bassEnd / 255;
        treble = trebleSum / (dataArray.length - trebleStart) / 255;
        avg = totalSum / dataArray.length / 255;
      }
      const t = clock.getElapsedTime();

      const basePulse = 1 + Math.sin(t * 2.0) * 0.02;
      const audioPulse = 1 + bass * 0.35;
          
      stars.scale.set(
        basePulse * audioPulse,
        basePulse * audioPulse,
        basePulse * audioPulse
      );
      
      material.opacity = 0.55 + avg * 0.6;
      haloMaterial.opacity = 0.08 + treble * 0.25;

      stars.rotation.y += 0.0002;
      halo.rotation.y -= 0.00015;
      halo.rotation.x += 0.00008;

      const haloArray = haloGeometry.attributes.position.array;

      for (let i = 0; i < haloParticles; i++) {
        const ix = i * 3;
        const iy = i * 3 + 1;
        const iz = i * 3 + 2;
      
        const baseX = haloBasePositions[ix];
        const baseY = haloBasePositions[iy];
        const baseZ = haloBasePositions[iz];
      
        const distortion = 1 + treble * 0.2 + Math.sin(t * 2 + i * 0.02) * 0.008;
      
        haloArray[ix] = baseX * distortion;
        haloArray[iy] = baseY * distortion;
        haloArray[iz] = baseZ * distortion;
      }

      haloGeometry.attributes.position.needsUpdate = true;    
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
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100vw", height: "100vh" }} />;
}