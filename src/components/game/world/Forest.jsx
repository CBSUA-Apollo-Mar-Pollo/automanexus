import { useLayoutEffect, useMemo, useRef } from "react";
import { Object3D } from "three";
import {
  PINE_FOLIAGE_GEOMETRIES,
  PINE_FOLIAGE_HEIGHTS,
  PINE_FOLIAGE_MATERIALS,
  PINE_TRUNK_GEOMETRY,
  PINE_TRUNK_MATERIAL,
} from "./pineAssets";
import { FOREST_PATCHES, createForestTrees } from "./forestConfig";
import { isInsidePondShore } from "./pondGeometry";
import { sampleTerrainHeight } from "./terrainGeometry";

function PineInstances({ trees, shade, tier }) {
  const meshRef = useRef(null);
  const selectedTrees = useMemo(
    () => trees.filter((tree) => tree.shade === shade),
    [shade, trees],
  );
  const geometry =
    tier === -1 ? PINE_TRUNK_GEOMETRY : PINE_FOLIAGE_GEOMETRIES[tier];
  const material =
    tier === -1
      ? PINE_TRUNK_MATERIAL
      : PINE_FOLIAGE_MATERIALS[
          (shade + tier) % PINE_FOLIAGE_MATERIALS.length
        ];

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const instance = new Object3D();
    selectedTrees.forEach((tree, index) => {
      const terrainHeight = sampleTerrainHeight(tree.x, tree.z);
      instance.position.set(
        tree.x,
        terrainHeight + (tier === -1 ? 0.34 : PINE_FOLIAGE_HEIGHTS[tier]),
        tree.z,
      );
      instance.rotation.set(0, tree.rotation, 0);
      instance.scale.setScalar(tree.scale);
      instance.updateMatrix();
      mesh.setMatrixAt(index, instance.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [selectedTrees, tier]);

  if (selectedTrees.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, selectedTrees.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  );
}

export default function Forest({
  seed = 80521,
  patches = FOREST_PATCHES,
}) {
  const trees = useMemo(
    () =>
      createForestTrees(seed, patches).filter(
        (tree) => !isInsidePondShore(tree.x, tree.z, 2.5),
      ),
    [patches, seed],
  );

  return (
    <group>
      {Array.from({ length: PINE_FOLIAGE_MATERIALS.length }, (_, shade) => (
        <PineInstances key={shade} trees={trees} shade={shade} tier={-1} />
      ))}
      {Array.from({ length: PINE_FOLIAGE_MATERIALS.length }, (_, shade) =>
        PINE_FOLIAGE_GEOMETRIES.map((_, tier) => (
          <PineInstances
            key={`${shade}-${tier}`}
            trees={trees}
            shade={shade}
            tier={tier}
          />
        )),
      )}
    </group>
  );
}
