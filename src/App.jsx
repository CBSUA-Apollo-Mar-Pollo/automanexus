import { Environment, OrbitControls, Sky } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { RicePlantModel } from "./components/canvas/models/Rice_plant_model";
import { Platform } from "./components/platform";
import React, { useMemo } from "react";

// A single low-poly tile with a green top and brown base
const pseudoRandom = (x, z, seed) => {
  const val = Math.sin(x * 12.9898 + z * 78.233 + seed) * 43758.5453123;
  return val - Math.floor(val);
};

function FarmTile({ position }) {
  return (
    <group position={position}>
      {/* Soil base */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.95, 0.5, 1.01]} />
        <meshStandardMaterial color="#ffb469" roughness={0.9} flatShading />
      </mesh>

      {/* Grass top */}
      <mesh position={[0, 0.525, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.05, 0.94]} />
        <meshStandardMaterial color="#807C1C" roughness={0.8} flatShading />
      </mesh>

      {/* --- Rock Decorations Sticking Out of the Sides --- */}
      <group>
        {/* Rock 1: Front side, slightly left */}
        <mesh
          position={[-0.2, 0.12, 0.46]}
          rotation={[0.4, 0.2, 0.5]}
          castShadow
        >
          <dodecahedronGeometry args={[0.09, 0]} />
          <meshStandardMaterial color="#888888" roughness={0.9} flatShading />
        </mesh>

        {/* Rock 2: Front side, further right and lower */}
        <mesh
          position={[0.3, 0.08, 0.47]}
          rotation={[0.9, -0.4, 0.1]}
          castShadow
        >
          <dodecahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial color="#999999" roughness={0.9} flatShading />
        </mesh>

        {/* Rock 3: Right side */}
        <mesh
          position={[0.47, 0.15, -0.1]}
          rotation={[0.2, 0.8, -0.5]}
          castShadow
        >
          <dodecahedronGeometry args={[0.07, 0]} />
          <meshStandardMaterial color="#7a7a7a" roughness={0.9} flatShading />
        </mesh>

        {/* Rock 4: Left side */}
        <mesh
          position={[-0.47, 0.1, 0.15]}
          rotation={[-0.3, 0.5, 0.9]}
          castShadow
        >
          <dodecahedronGeometry args={[0.055, 0]} />
          <meshStandardMaterial color="#8e8e8e" roughness={0.9} flatShading />
        </mesh>
      </group>
    </group>
  );
}

// A simple low-poly tree clone
function LowPolyTree({ position }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 0.6, 5]} />
        <meshStandardMaterial color="#78350f" flatShading />
      </mesh>
      {/* Foliage (Dodecahedron gives that low-poly crystal shape) */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <dodecahedronGeometry args={[0.25]} />
        <meshStandardMaterial color="#4d7c0f" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

function App() {
  const gridSize = 4; // 4x4 layout like the image
  const tiles = [];

  // Generate grid positions
  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      // 1. SQUEEZE COLUMNS: Pulling X spacing inward to close the vertical gaps
      const posX = (x - (gridSize - 1) / 2) * 0.96;

      // Keep rows exactly as they are since they are already flush
      const posZ = (z - (gridSize - 1) / 2) * 1.0;

      tiles.push([posX, 0, posZ]);
    }
  }

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#7a92a3" }}>
      {/* orthographic makes it look isometric and flat like the image */}
      <Canvas
        orthographic
        camera={{ zoom: 110, position: [0, 5, 4.01] }}
        shadows
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 15, -5]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />

        {/* Render the Grid */}
        {tiles.map((pos, idx) => (
          <FarmTile key={`tile-${idx}`} position={pos} />
        ))}

        {/* Scatter a few trees on top */}
        <LowPolyTree position={[-1.5, 0.5, -1.5]} />
        <LowPolyTree position={[0.5, 0.5, 1.5]} />
        <LowPolyTree position={[1.5, 0.5, -0.5]} />
      </Canvas>
    </div>
  );
}

export default App;
