import { useMemo } from "react";
import { createTerrainGeometry } from "./terrainGeometry";

export default function Terrain({
  size = 260,
  segments = 112,
  seed = 14321,
  heightOverride,
}) {
  const geometry = useMemo(
    () => createTerrainGeometry({ size, segments, seed, heightOverride }),
    [heightOverride, seed, segments, size],
  );

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial
        vertexColors
        color="#ffffff"
        flatShading={false}
        roughness={1}
      />
    </mesh>
  );
}
