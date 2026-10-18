import { useMemo } from "react";
import Water from "./Water";
import LakeDetails from "./LakeDetails";
import {
  createPondGeometry,
  getPondBoundaryScaleLimit,
  POND_CONFIG,
} from "./pondGeometry";

export default function Pond() {
  const geometry = useMemo(() => createPondGeometry(), []);
  const waterBounds =
    POND_CONFIG.radius * 2 * getPondBoundaryScaleLimit();

  return (
    <group position={[POND_CONFIG.x, 0, POND_CONFIG.z]}>
      <mesh geometry={geometry.shore} receiveShadow renderOrder={1}>
        <meshStandardMaterial vertexColors roughness={1} flatShading />
      </mesh>
      <mesh geometry={geometry.border} receiveShadow renderOrder={2}>
        <meshStandardMaterial
          vertexColors
          roughness={1}
          flatShading
          emissive="#ffffff"
          emissiveIntensity={0.35}
        />
      </mesh>
      <group position={[0, POND_CONFIG.waterLevel + 0.012, 0]}>
        <Water
          width={waterBounds}
          depth={waterBounds * POND_CONFIG.aspectRatio}
          cellSize={3}
          circleRadius={POND_CONFIG.radius}
          aspectRatio={POND_CONFIG.aspectRatio}
        />
      </group>
      <LakeDetails />
    </group>
  );
}
