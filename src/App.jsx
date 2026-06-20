import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Model } from "./components/canvas/models/Rice_plant";

function App() {
  return (
    <div className="h-screen">
      <Canvas orthographic={true} shadows={true}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} />

        <Model position={[0, 0, 0]} scale={2} />

        <Environment preset="forest" />

        <OrbitControls />
      </Canvas>
    </div>
  );
}

export default App;
