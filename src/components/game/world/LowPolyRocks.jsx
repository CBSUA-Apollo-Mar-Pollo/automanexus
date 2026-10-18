import { useLayoutEffect, useMemo, useRef } from "react";
import { Object3D } from "three";
import { sampleTerrainHeight } from "./terrainGeometry";
import {
  LOW_POLY_ROCK_GEOMETRY,
  LOW_POLY_ROCK_MATERIALS,
} from "./rockAssets";
import { createRockInstances, ROCK_PATCHES } from "./rockConfig";

function RockInstances({ rocks, materialIndex }) {
  const meshRef = useRef(null);
  const selectedRocks = useMemo(
    () => rocks.filter((rock) => rock.material === materialIndex),
    [materialIndex, rocks],
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const instance = new Object3D();
    selectedRocks.forEach((rock, index) => {
      instance.position.set(
        rock.x,
        sampleTerrainHeight(rock.x, rock.z) + rock.scale.y * 0.72,
        rock.z,
      );
      instance.rotation.set(0, rock.rotation, 0);
      instance.scale.set(rock.scale.x, rock.scale.y, rock.scale.z);
      instance.updateMatrix();
      mesh.setMatrixAt(index, instance.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [selectedRocks]);

  if (selectedRocks.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[
        LOW_POLY_ROCK_GEOMETRY,
        LOW_POLY_ROCK_MATERIALS[materialIndex],
        selectedRocks.length,
      ]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  );
}

export default function LowPolyRocks({ seed = 49127, patches = ROCK_PATCHES }) {
  const rocks = useMemo(
    () => createRockInstances(seed, patches),
    [patches, seed],
  );

  return (
    <group>
      {LOW_POLY_ROCK_MATERIALS.map((_, materialIndex) => (
        <RockInstances
          key={materialIndex}
          rocks={rocks}
          materialIndex={materialIndex}
        />
      ))}
    </group>
  );
}
