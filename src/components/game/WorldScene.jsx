import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import EnvironmentLighting from "./world/EnvironmentLighting";
import Forest from "./world/Forest";
import Terrain from "./world/Terrain";

export function WorldScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      orthographic
      camera={{
        zoom: 20,
        position: [15, 27, 19],
        near: 0.1,
        far: 500,
      }}
      shadows
    >
      <color attach="background" args={["#80c966"]} />
      <OrbitControls
        enableDamping
        enablePan={false}
        minPolarAngle={0.3}
        maxPolarAngle={1.25}
        minZoom={20}
        maxZoom={46}
      />
      <EnvironmentLighting />
      <Terrain />
      <Forest />
    </Canvas>
  );
}
