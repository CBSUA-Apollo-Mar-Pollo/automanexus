import { PINE_FOLIAGE_MATERIALS } from "./pineAssets";
import { createSeededRandom } from "./random";

export const FOREST_PATCHES = [
  {
    x: -14,
    z: -14,
    radiusX: 19,
    radiusZ: 18,
    rotation: 0.3,
    groves: 10,
    trees: [13, 20],
    groveRadius: 4.2,
  },
  {
    x: 14,
    z: -14,
    radiusX: 18,
    radiusZ: 19,
    rotation: -0.2,
    groves: 10,
    trees: [13, 20],
    groveRadius: 4.2,
  },
  {
    x: -14,
    z: 14,
    radiusX: 19,
    radiusZ: 18,
    rotation: -0.35,
    groves: 10,
    trees: [14, 21],
    groveRadius: 4.4,
  },
  {
    x: 14,
    z: 14,
    radiusX: 18,
    radiusZ: 19,
    rotation: 0.42,
    groves: 10,
    trees: [13, 20],
    groveRadius: 4.2,
  },
  {
    x: -66,
    z: -12,
    radiusX: 18,
    radiusZ: 15,
    rotation: -0.2,
    groves: 7,
    trees: [10, 17],
    groveRadius: 3.7,
  },
  {
    x: 70,
    z: 12,
    radiusX: 20,
    radiusZ: 16,
    rotation: 0.25,
    groves: 7,
    trees: [10, 18],
    groveRadius: 3.9,
  },
  {
    x: -14,
    z: 76,
    radiusX: 14,
    radiusZ: 20,
    rotation: 0.3,
    groves: 6,
    trees: [9, 15],
    groveRadius: 3.1,
  },
  {
    x: 17,
    z: -78,
    radiusX: 16,
    radiusZ: 21,
    rotation: -0.25,
    groves: 6,
    trees: [9, 15],
    groveRadius: 3.1,
  },
  {
    x: -79,
    z: 73,
    radiusX: 22,
    radiusZ: 16,
    rotation: 0.15,
    groves: 8,
    trees: [11, 18],
    groveRadius: 4,
  },
  {
    x: 85,
    z: -72,
    radiusX: 22,
    radiusZ: 19,
    rotation: -0.3,
    groves: 8,
    trees: [10, 18],
    groveRadius: 3.9,
  },
];

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
      if (Math.hypot(x, z) < 9) continue;
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
        if (Math.hypot(x, z) < 7) continue;
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
