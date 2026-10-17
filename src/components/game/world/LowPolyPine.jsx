import {
  PINE_FOLIAGE_GEOMETRIES,
  PINE_FOLIAGE_HEIGHTS,
  PINE_FOLIAGE_MATERIALS,
  PINE_TRUNK_GEOMETRY,
  PINE_TRUNK_MATERIAL,
} from "./pineAssets";

export default function LowPolyPine({
  position = [0, 0, 0],
  rotation = 0,
  scale = 1,
  shade = 0,
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh
        geometry={PINE_TRUNK_GEOMETRY}
        material={PINE_TRUNK_MATERIAL}
        position={[0, 0.34, 0]}
        castShadow
      />
      {PINE_FOLIAGE_GEOMETRIES.map((geometry, tier) => (
        <mesh
          key={tier}
          geometry={geometry}
          material={
            PINE_FOLIAGE_MATERIALS[
              (shade + tier) % PINE_FOLIAGE_MATERIALS.length
            ]
          }
          position={[0, PINE_FOLIAGE_HEIGHTS[tier], 0]}
          castShadow
        />
      ))}
    </group>
  );
}
