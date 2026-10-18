import { LOW_POLY_ROCK_MATERIALS } from "./rockAssets";
import { createSeededRandom } from "./random";
import { isInsidePondShore } from "./pondGeometry";

const WORLD_EDGE = 108;
const ROCK_PATCH_RANDOM = createSeededRandom(49127);

export const ROCK_PATCHES = Array.from({ length: 7 }, (_, row) =>
  Array.from({ length: 7 }, (_, column) => ({
    x: (column - 3) * 30 + (ROCK_PATCH_RANDOM() - 0.5) * 10,
    z: (row - 3) * 30 + (ROCK_PATCH_RANDOM() - 0.5) * 10,
    stones: ROCK_PATCH_RANDOM() < 0.35 ? 5 : 4,
    radius: 4 + ROCK_PATCH_RANDOM() * 2,
    variation: ROCK_PATCH_RANDOM(),
  })),
)
  .flat()
  .filter((patch) => patch.variation > 0.55);

export function createRockInstances(seed, patches = ROCK_PATCHES) {
  const random = createSeededRandom(seed);
  const rocks = [];

  patches.forEach((patch) => {
    const count = patch.stones + Math.floor(random() * 3);
    for (let index = 0; index < count; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = Math.sqrt(random()) * patch.radius;
      const x = patch.x + Math.cos(angle) * distance;
      const z = patch.z + Math.sin(angle) * distance;
      if (Math.abs(x) > WORLD_EDGE || Math.abs(z) > WORLD_EDGE) continue;
      if (isInsidePondShore(x, z, 1)) continue;

      const width = 0.55 + random() * 0.75;
      rocks.push({
        x,
        z,
        rotation: random() * Math.PI * 2,
        scale: {
          x: width,
          y: 0.55 + random() * 0.9,
          z: 0.5 + random() * 0.7,
        },
        material: Math.floor(random() * LOW_POLY_ROCK_MATERIALS.length),
      });
    }
  });

  return rocks;
}
