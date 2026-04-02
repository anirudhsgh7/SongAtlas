# 3D Audio Visualizer with Spotify Integration

A real-time, browser-based 3D audio visualizer that converts audio signals into dynamic particle-based animations using modern web technologies.

## Features

- Real-time audio visualization using the Web Audio API  
- 3D particle system built with Three.js  
- Frequency-based animation (bass, mid, treble response)  
- Spotify Web Playback SDK integration (currently under debugging)  
- Fast development setup using Vite  

## Tech Stack

- Frontend: React, JavaScript  
- 3D Rendering: Three.js  
- Audio Processing: Web Audio API  
- Streaming Integration: Spotify Web Playback SDK  
- Build Tool: Vite  

## How It Works

- Audio input is captured (microphone or playback source)  
- Web Audio API analyzes frequency data via an analyser node  
- Frequency values are mapped to visual parameters (particle movement, scale, etc.)  
- Three.js renders a real-time 3D particle system reacting to audio  

## Known Issues

- Spotify playback stops after ~10 seconds (likely due to device/authentication constraints in the Web Playback SDK)  
- Stability improvements are in progress  
