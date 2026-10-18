import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
} from "three";
import { createSeededRandom } from "./random";

function sampleNoise(grid, cells, x, z, size) {
  const gridX = (x / size) * cells;
  const gridZ = (z / size) * cells;
  const cellX = Math.floor(gridX);
  const cellZ = Math.floor(gridZ);
  const blendX = gridX - cellX;
  const blendZ = gridZ - cellZ;
  const smoothX = blendX * blendX * (3 - 2 * blendX);
  const smoothZ = blendZ * blendZ * (3 - 2 * blendZ);
  const at = (offsetX, offsetZ) =>
    grid[
      ((cellZ + offsetZ + cells) % cells) * cells +
        ((cellX + offsetX + cells) % cells)
    ];
  const top = at(0, 0) + (at(1, 0) - at(0, 0)) * smoothX;
  const bottom = at(0, 1) + (at(1, 1) - at(0, 1)) * smoothX;
  return top + (bottom - top) * smoothZ;
}

function smoothstep(edge0, edge1, value) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function sampleTerrainHeight(x, z) {
  return (
    Math.sin(x * 0.035 + 1.7) * 0.035 +
    Math.cos(z * 0.041 - 0.8) * 0.03 +
    Math.sin((x + z) * 0.025) * 0.025
  );
}

export function createTerrainGeometry({
  size = 260,
  segments = 112,
  seed = 14321,
  heightOverride,
} = {}) {
  const random = createSeededRandom(seed);
  const positions = [];
  const colors = [];
  const normals = [];
  const lightGrass = new Color("#86d56b");
  const deepGrass = new Color("#55a64c");
  const macroCells = 8;
  const macroRandom = createSeededRandom(seed + 7919);
  const macroNoise = Array.from(
    { length: macroCells * macroCells },
    macroRandom,
  );
  const firstTriangleColor = new Color();
  const secondTriangleColor = new Color();
  const vertexCount = segments + 1;
  const vertexHeights = Array.from({ length: vertexCount }, () =>
    Array(vertexCount).fill(0),
  );

  for (let row = 0; row <= segments; row += 1) {
    const z = (row / segments - 0.5) * size;
    for (let column = 0; column <= segments; column += 1) {
      const x = (column / segments - 0.5) * size;
      const baseHeight =
        sampleTerrainHeight(x, z) + (random() - 0.5) * 0.008;
      vertexHeights[row][column] = heightOverride
        ? heightOverride(x, z, baseHeight)
        : baseHeight;
    }
  }

  const point = (row, column) => {
    const x = (column / segments - 0.5) * size;
    const z = (row / segments - 0.5) * size;
    const left = Math.max(column - 1, 0);
    const right = Math.min(column + 1, segments);
    const top = Math.max(row - 1, 0);
    const bottom = Math.min(row + 1, segments);
    const spacing = size / segments;
    const slopeX =
      (vertexHeights[row][right] - vertexHeights[row][left]) /
      ((right - left) * spacing);
    const slopeZ =
      (vertexHeights[bottom][column] - vertexHeights[top][column]) /
      ((bottom - top) * spacing);
    const length = Math.hypot(slopeX, 1, slopeZ);
    return {
      position: [x, vertexHeights[row][column], z],
      normal: [-slopeX / length, 1 / length, -slopeZ / length],
    };
  };
  const addTriangle = (triangle, color) => {
    triangle.forEach(({ position, normal }) => {
      positions.push(...position);
      normals.push(...normal);
      colors.push(color.r, color.g, color.b);
    });
  };

  for (let row = 0; row < segments; row += 1) {
    for (let column = 0; column < segments; column += 1) {
      const topLeft = point(row, column);
      const topRight = point(row, column + 1);
      const bottomLeft = point(row + 1, column);
      const bottomRight = point(row + 1, column + 1);
      const x = ((column + 0.5) / segments - 0.5) * size;
      const z = ((row + 0.5) / segments - 0.5) * size;
      const broadVariation = sampleNoise(
        macroNoise,
        macroCells,
        x,
        z,
        size,
      );
      const lightBlend = smoothstep(0.12, 0.42, broadVariation);
      firstTriangleColor.lerpColors(
        deepGrass,
        lightGrass,
        Math.max(0, Math.min(1, lightBlend + (random() - 0.5) * 0.04)),
      );
      secondTriangleColor.lerpColors(
        deepGrass,
        lightGrass,
        Math.max(0, Math.min(1, lightBlend + (random() - 0.5) * 0.04)),
      );

      if (random() < 0.5) {
        addTriangle([topLeft, bottomLeft, topRight], firstTriangleColor);
        addTriangle([topRight, bottomLeft, bottomRight], secondTriangleColor);
      } else {
        addTriangle([topLeft, bottomLeft, bottomRight], firstTriangleColor);
        addTriangle([topLeft, bottomRight, topRight], secondTriangleColor);
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  return geometry;
}
