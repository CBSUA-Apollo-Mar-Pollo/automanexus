import { useEffect, useMemo, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import EnvironmentLighting from "./world/EnvironmentLighting";
import Forest from "./world/Forest";
import LowPolyRocks from "./world/LowPolyRocks";
import Pond from "./world/Pond";
import { createPondHeightOverride } from "./world/pondGeometry";
import Terrain from "./world/Terrain";

function CameraControls({ freeCamera }) {
  const controlsRef = useRef(null);
  const pressedKeys = useRef(new Set());
  const { camera } = useThree();

  useEffect(() => {
    if (freeCamera) return;

    camera.up.set(0, 1, 0);
    camera.position.set(15, 27, 19);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [camera, freeCamera]);

  useEffect(() => {
    const keys = pressedKeys.current;
    if (freeCamera) {
      keys.clear();
      return undefined;
    }

    const isTypingTarget = (target) =>
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if (!["w", "a", "s", "d"].includes(key) || isTypingTarget(event.target)) {
        return;
      }
      event.preventDefault();
      keys.add(key);
    };
    const handleKeyUp = (event) => {
      keys.delete(event.key.toLowerCase());
    };
    const clearPressedKeys = () => keys.clear();

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", clearPressedKeys);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", clearPressedKeys);
      keys.clear();
    };
  }, [freeCamera]);

  useFrame((_, delta) => {
    if (freeCamera || pressedKeys.current.size === 0 || !controlsRef.current) {
      return;
    }

    const controls = controlsRef.current;
    const forward = new Vector3(
      controls.target.x - camera.position.x,
      0,
      controls.target.z - camera.position.z,
    ).normalize();
    const right = new Vector3(-forward.z, 0, forward.x);
    const movement = new Vector3();
    const keys = pressedKeys.current;

    if (keys.has("w")) movement.add(forward);
    if (keys.has("s")) movement.sub(forward);
    if (keys.has("d")) movement.add(right);
    if (keys.has("a")) movement.sub(right);

    if (movement.lengthSq() === 0) return;
    movement.normalize().multiplyScalar(24 * delta);
    controls.target.add(movement);
    camera.position.add(movement);
    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={freeCamera}
      enableDamping
      enablePan={freeCamera}
      minPolarAngle={0.3}
      maxPolarAngle={1.25}
      minZoom={20}
      maxZoom={46}
    />
  );
}

export function WorldScene({ freeCamera = false }) {
  const pondHeightOverride = useMemo(() => createPondHeightOverride(), []);

  return (
    <Canvas
      flat
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
      <CameraControls freeCamera={freeCamera} />
      <EnvironmentLighting />
      <Terrain heightOverride={pondHeightOverride} />
      <Forest />
      <Pond />
      <LowPolyRocks />
    </Canvas>
  );
}
