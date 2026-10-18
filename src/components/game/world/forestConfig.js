import { PINE_FOLIAGE_MATERIALS } from "./pineAssets";
import { createSeededRandom } from "./random";

const WORLD_EDGE = 128;
const patchRandom = createSeededRandom(67931);

export const FOREST_PATCHES = Array.from({ length: 9 }, (_, row) =>
  Array.from({ length: 9 }, (_, column) => ({
    x: (column - 4) * 29 + (patchRandom() - 0.5) * 6,
    z: (row - 4) * 29 + (patchRandom() - 0.5) * 6,
    radiusX: 17 + patchRandom() * 2,
    radiusZ: 17 + patchRandom() * 2,
    rotation: patchRandom() * Math.PI * 2,
    groves: patchRandom() < 0.35 ? 6 : 5,
    trees: [17, 24],
    groveRadius: 5.8 + patchRandom() * 1.1,
  })),
).flat();

export function createForestTrees(seed, patches) {
  const random = createSeededRandom(seed);
  const trees = [];

  patches.forEach((patch) => {
    const cosine = Math.cos(patch.rotation ?? 0);
    const sine = Math.sin(patch.rotation ?? 0);
    const groveCenters = [];
    let attempts = 0;

    while (
      groveCenters.length < patch.groves &&
      attempts < patch.groves * 12
    ) {
      attempts += 1;
      const angle = random() * Math.PI * 2;
      const radius = Math.sqrt(random()) * (0.7 + random() * 0.34);
      const localX = Math.cos(angle) * radius * patch.radiusX;
      const localZ = Math.sin(angle) * radius * patch.radiusZ;
      const x = patch.x + localX * cosine - localZ * sine;
      const z = patch.z + localX * sine + localZ * cosine;
      if (Math.abs(x) > WORLD_EDGE || Math.abs(z) > WORLD_EDGE) continue;
      groveCenters.push({ x, z });
    }

    groveCenters.forEach((center) => {
      const treesInGrove =
        patch.trees[0] +
        Math.floor(random() * (patch.trees[1] - patch.trees[0] + 1));
      for (let index = 0; index < treesInGrove; index += 1) {
        const angle = random() * Math.PI * 2;
        const radius = Math.sqrt(random()) * patch.groveRadius;
        const x = center.x + Math.cos(angle) * radius;
        const z = center.z + Math.sin(angle) * radius;
        if (Math.abs(x) > WORLD_EDGE || Math.abs(z) > WORLD_EDGE) continue;
        trees.push({
          x,
          z,
          rotation: random() * Math.PI * 2,
          scale: 0.68 + random() * 0.58,
          shade: Math.floor(random() * PINE_FOLIAGE_MATERIALS.length),
        });
      }
    });
  });

  return trees;
}
