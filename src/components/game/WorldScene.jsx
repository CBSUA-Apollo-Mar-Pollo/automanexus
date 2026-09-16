import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { LowPolyTreeModel } from "../canvas/models/Low_poly_tree_model";
import { LowPolyTreeModel2 } from "../canvas/models/Low_poly_tree_2";
import { LowPolyTreeModel3 } from "../canvas/models/Low_poly_tree_3";

function FarmTile({ position, resource, harvested }) {
  const treeType =
    Math.abs(Math.round(position[0] * 10) + Math.round(position[2] * 10)) % 3;

  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.95, 0.5, 1.01]} />
        <meshStandardMaterial color="#ffb469" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 0.511, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.86, 0.08, 0.92]} />
        <meshStandardMaterial color="#807C1C" roughness={0.8} flatShading />
      </mesh>
      <group>
        <mesh
          position={[-0.2, 0.12, 0.46]}
          rotation={[0.4, 0.2, 0.5]}
          castShadow
        >
          <dodecahedronGeometry args={[0.09, 0]} />
          <meshStandardMaterial color="#888888" roughness={0.9} flatShading />
        </mesh>
        <mesh
          position={[0.3, 0.08, 0.47]}
          rotation={[0.9, -0.4, 0.1]}
          castShadow
        >
          <dodecahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial color="#999999" roughness={0.9} flatShading />
        </mesh>
        <mesh
          position={[0.47, 0.15, -0.1]}
          rotation={[0.2, 0.8, -0.5]}
          castShadow
        >
          <dodecahedronGeometry args={[0.07, 0]} />
          <meshStandardMaterial color="#7a7a7a" roughness={0.9} flatShading />
        </mesh>
        <mesh
          position={[-0.47, 0.1, 0.15]}
          rotation={[-0.3, 0.5, 0.9]}
          castShadow
        >
          <dodecahedronGeometry args={[0.055, 0]} />
          <meshStandardMaterial color="#8e8e8e" roughness={0.9} flatShading />
        </mesh>
      </group>
      {resource === "tree" && !harvested && (
        <group>
          {treeType === 0 && <LowPolyTreeModel position={[0, 0.55, 0]} />}
          {treeType === 1 && <LowPolyTreeModel2 />}
          {treeType === 2 && <LowPolyTreeModel3 position={[0, 0.55, 0]} />}
        </group>
      )}
    </group>
  );
}

function HarvestEffect({ position }) {
  const effectRef = useRef(null);
  const puffRef = useRef(null);
  const particleGroupRef = useRef(null);
  const elapsedRef = useRef(0);
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 8) * Math.PI * 2;
        return {
          x: Math.cos(angle) * (0.52 + (index % 3) * 0.08),
          y: 0.3 + (index % 3) * 0.12,
          z: Math.sin(angle) * (0.52 + (index % 3) * 0.08),
        };
      }),
    [],
  );

  useFrame((state, delta) => {
    elapsedRef.current = Math.min(0.8, elapsedRef.current + delta);
    const progress = elapsedRef.current / 0.8;

    if (effectRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 14) * 0.25;
      effectRef.current.scale.set(pulse, pulse, pulse);
      effectRef.current.rotation.z += delta * 4;
      effectRef.current.material.opacity = 1 - progress;
    }
    if (puffRef.current) {
      const puffScale = 0.3 + progress * 0.9;
      puffRef.current.scale.set(puffScale, puffScale, puffScale);
      puffRef.current.material.opacity = 0.5 * (1 - progress);
    }
    if (particleGroupRef.current) {
      particleGroupRef.current.children.forEach((particle, index) => {
        const velocity = particles[index];
        particle.position.x = velocity.x * progress;
        particle.position.y =
          velocity.y * progress - progress * progress * 0.12;
        particle.position.z = velocity.z * progress;
        particle.rotation.x += delta * 7;
        particle.rotation.y += delta * 5;
        particle.scale.setScalar(1.3 - progress * 0.7);
        particle.material.opacity = 1 - progress;
      });
    }
  });

  return (
    <group position={[position[0], 0.72, position[2]]}>
      <mesh ref={effectRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.32, 0.06, 8, 24]} />
        <meshStandardMaterial
          color="#f6d365"
          emissive="#f6a623"
          emissiveIntensity={3}
          transparent
          opacity={1}
          depthTest={false}
        />
      </mesh>
      <mesh position={[0, 0.24, 0]}>
        <coneGeometry args={[0.09, 0.5, 6]} />
        <meshStandardMaterial
          color="#fff1a8"
          emissive="#f6a623"
          emissiveIntensity={3}
          transparent
          opacity={1}
          depthTest={false}
        />
      </mesh>
      <mesh ref={puffRef} position={[0, 0.45, 0]} scale={0.3}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial
          color="#f0e7b0"
          emissive="#d9b95d"
          emissiveIntensity={0.8}
          transparent
          opacity={0.5}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      <group ref={particleGroupRef}>
        {particles.map((_, index) => (
          <mesh key={index} scale={1.3}>
            <icosahedronGeometry args={[0.08, 0]} />
            <meshStandardMaterial
              color={index % 2 === 0 ? "#9eb045" : "#e9c46a"}
              emissive="#a3c438"
              emissiveIntensity={1.4}
              transparent
              opacity={1}
              depthTest={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Drone({ position, isHarvesting }) {
  const droneRef = useRef(null);
  const [initialPosition] = useState(() => [position[0], 1.25, position[2]]);
  const targetPosition = useMemo(
    () => ({ x: position[0], y: 1.25, z: position[2] }),
    [position],
  );

  useFrame((state, delta) => {
    if (!droneRef.current) return;
    droneRef.current.position.lerp(targetPosition, Math.min(1, delta * 4.5));
    droneRef.current.position.y += isHarvesting
      ? Math.sin(state.clock.elapsedTime * 16) * delta * 0.8
      : 0;
    droneRef.current.rotation.y += delta * 2;
  });

  return (
    <group ref={droneRef} position={initialPosition}>
      <mesh castShadow>
        <boxGeometry args={[0.24, 0.12, 0.24]} />
        <meshStandardMaterial color="#e9c46a" flatShading />
      </mesh>
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 0.12, 6]} />
        <meshStandardMaterial color="#264653" flatShading />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.18, 0.02, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.035, 0.035, 0.16, 8]} />
          <meshStandardMaterial color="#f4a261" flatShading />
        </mesh>
      ))}
    </group>
  );
}

export function WorldScene({ tiles, route, dronePosition, harvestingTileId }) {
  const harvestTile = tiles.find((tile) => tile.id === harvestingTileId);

  return (
    <Canvas orthographic camera={{ zoom: 110, position: [0, 5, 4.01] }} shadows>
      <OrbitControls enablePan={false} />
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[-120, 60, 50]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      {tiles.map((tile) => (
        <FarmTile
          key={tile.id}
          position={tile.pos}
          resource={tile.resource}
          harvested={tile.harvested}
        />
      ))}
      <Drone
        position={route[0]?.pos ?? dronePosition}
        isHarvesting={harvestingTileId !== null}
      />
      {harvestTile && <HarvestEffect position={harvestTile.pos} />}
    </Canvas>
  );
}
