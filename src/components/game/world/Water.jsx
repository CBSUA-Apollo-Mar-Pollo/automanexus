import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, Color, DoubleSide } from "three";
import {
  getPondBoundaryPoint,
  getPondBoundaryRadius,
} from "./pondGeometry";

const DEFAULT_PALETTE = {
  shallow: "#3b8ef6",
  mid: "#1f6fe6",
  deep: "#1a4fc2",
};
const COLOR_JITTER = 0.04;

function hashCell(x, z) {
  const value = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function smoothstep(edge0, edge1, value) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function cross2D(first, second, third) {
  return (
    (second[0] - first[0]) * (third[2] - first[2]) -
    (second[2] - first[2]) * (third[0] - first[0])
  );
}

function pointInTriangle(point, first, second, third) {
  return (
    cross2D(first, second, point) >= -1e-8 &&
    cross2D(second, third, point) >= -1e-8 &&
    cross2D(third, first, point) >= -1e-8
  );
}

function triangulateBoundary(boundary) {
  const indices = Array.from({ length: boundary.length }, (_, index) => index);
  const signedArea = boundary.reduce((area, point, index) => {
    const next = boundary[(index + 1) % boundary.length];
    return area + point[0] * next[2] - next[0] * point[2];
  }, 0);
  if (signedArea < 0) indices.reverse();

  const triangles = [];
  while (indices.length > 3) {
    let earFound = false;

    for (let index = 0; index < indices.length; index += 1) {
      const previousIndex = indices[(index + indices.length - 1) % indices.length];
      const currentIndex = indices[index];
      const nextIndex = indices[(index + 1) % indices.length];
      const previous = boundary[previousIndex];
      const current = boundary[currentIndex];
      const next = boundary[nextIndex];

      if (cross2D(previous, current, next) <= 1e-8) continue;

      const containsVertex = indices.some((candidateIndex) => {
        if (
          candidateIndex === previousIndex ||
          candidateIndex === currentIndex ||
          candidateIndex === nextIndex
        ) {
          return false;
        }
        return pointInTriangle(boundary[candidateIndex], previous, current, next);
      });
      if (containsVertex) continue;

      triangles.push([previous, current, next]);
      indices.splice(index, 1);
      earFound = true;
      break;
    }

    if (!earFound) {
      throw new Error("Unable to triangulate the pond water boundary.");
    }
  }

  triangles.push(indices.map((index) => boundary[index]));
  return triangles;
}

function clipTriangleToBoundary(points, boundary) {
  let polygon = points;

  for (
    let segment = 0;
    segment < boundary.length && polygon.length > 0;
    segment += 1
  ) {
    const start = boundary[segment];
    const end = boundary[(segment + 1) % boundary.length];
    const startX = start[0];
    const startZ = start[2];
    const edgeX = end[0] - startX;
    const edgeZ = end[2] - startZ;
    const clipped = [];

    for (let index = 0; index < polygon.length; index += 1) {
      const current = polygon[index];
      const previous = polygon[(index + polygon.length - 1) % polygon.length];
      const currentSide =
        edgeX * (current[2] - startZ) - edgeZ * (current[0] - startX);
      const previousSide =
        edgeX * (previous[2] - startZ) - edgeZ * (previous[0] - startX);
      const currentInside = currentSide >= -1e-8;
      const previousInside = previousSide >= -1e-8;

      if (currentInside !== previousInside) {
        const blend = previousSide / (previousSide - currentSide);
        clipped.push([
          previous[0] + (current[0] - previous[0]) * blend,
          0,
          previous[2] + (current[2] - previous[2]) * blend,
        ]);
      }
      if (currentInside) clipped.push(current);
    }

    polygon = clipped;
  }

  return polygon;
}

function createWaterGeometry(
  width,
  depth,
  cellSize,
  palette,
  circleRadius,
  aspectRatio,
) {
  const segmentsX = Math.max(1, Math.round(width / cellSize));
  const segmentsZ = Math.max(1, Math.round(depth / cellSize));
  const boundarySegments = 96;
  const boundary = Array.from({ length: boundarySegments }, (_, segment) => {
    const angle = (segment / boundarySegments) * Math.PI * 2;
    return getPondBoundaryPoint(angle, circleRadius, aspectRatio);
  });
  const boundaryTriangles = triangulateBoundary(boundary);
  const positions = [];
  const colors = [];
  const shallow = new Color(palette.shallow);
  const mid = new Color(palette.mid);
  const deep = new Color(palette.deep);
  const color = new Color();
  const hsl = { h: 0, s: 0, l: 0 };

  const appendTriangle = (triangle, tileColor) => {
    for (let vertex = 1; vertex < triangle.length - 1; vertex += 1) {
      [triangle[0], triangle[vertex], triangle[vertex + 1]].forEach((point) => {
        positions.push(...point);
        colors.push(tileColor.r, tileColor.g, tileColor.b);
      });
    }
  };

  for (let row = 0; row < segmentsZ; row += 1) {
    const z0 = depth / 2 - (row / segmentsZ) * depth;
    const z1 = depth / 2 - ((row + 1) / segmentsZ) * depth;
    for (let column = 0; column < segmentsX; column += 1) {
      const x0 = -width / 2 + (column / segmentsX) * width;
      const x1 = -width / 2 + ((column + 1) / segmentsX) * width;
      const centerX = (x0 + x1) / 2;
      const centerZ = (z0 + z1) / 2;
      const normalizedZ = centerZ / aspectRatio;
      const angle = Math.atan2(normalizedZ, centerX);
      const radialDepth = Math.max(
        0,
        Math.min(
          1,
          1 -
            Math.hypot(centerX, normalizedZ) /
              getPondBoundaryRadius(angle, circleRadius),
        ),
      );
      const lowFrequency =
        (Math.sin(centerX * 0.17 + 0.4) +
          Math.sin(centerZ * 0.21 - 1.2) +
          Math.sin((centerX + centerZ) * 0.12 + 2.1)) /
        3;
      const depthFactor = Math.max(
        0,
        Math.min(
          1,
          radialDepth + smoothstep(0.35, 0.85, lowFrequency) * 0.16,
        ),
      );

      if (depthFactor < 0.55) {
        color.lerpColors(shallow, mid, smoothstep(0, 0.55, depthFactor));
      } else {
        color.lerpColors(mid, deep, smoothstep(0.55, 1, depthFactor));
      }

      color.getHSL(hsl);
      hsl.l = Math.max(
        0,
        Math.min(
          1,
          hsl.l + (hashCell(centerX, centerZ) - 0.5) * 2 * COLOR_JITTER,
        ),
      );
      color.setHSL(hsl.h, hsl.s, hsl.l);

      const topLeft = [x0, 0, z0];
      const topRight = [x1, 0, z0];
      const bottomLeft = [x0, 0, z1];
      const bottomRight = [x1, 0, z1];
      const triangles =
        (row + column) % 2 === 0
          ? [
              [topLeft, bottomLeft, topRight],
              [topRight, bottomLeft, bottomRight],
            ]
          : [
              [topLeft, bottomLeft, bottomRight],
              [topLeft, bottomRight, topRight],
            ];

      triangles.forEach((triangle) => {
        boundaryTriangles.forEach((boundaryTriangle) => {
          const clippedTriangle = clipTriangleToBoundary(
            triangle,
            boundaryTriangle,
          );
          if (clippedTriangle.length >= 3) {
            appendTriangle(clippedTriangle, color);
          }
        });
      });
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(positions), 3),
  );
  geometry.setAttribute("color", new BufferAttribute(new Float32Array(colors), 3));
  return geometry;
}

function waveHeight(x, z, time) {
  return (
    Math.sin(x * 0.42 + time * 1.1) * 0.55 +
    Math.cos(z * 0.48 - time * 0.85) * 0.3 +
    Math.sin((x + z) * 0.28 + time * 0.7) * 0.15
  );
}

export default function Water({
  width = 30,
  depth = 20,
  cellSize = 3,
  palette = DEFAULT_PALETTE,
  waveAmplitude = 0,
  circleRadius = Math.min(width, depth) / 2,
  aspectRatio = 1,
}) {
  const geometry = useMemo(
    () =>
      createWaterGeometry(
        width,
        depth,
        cellSize,
        palette,
        circleRadius,
        aspectRatio,
      ),
    [aspectRatio, cellSize, circleRadius, depth, palette, width],
  );

  useFrame(({ clock }) => {
    if (waveAmplitude === 0) return;

    const positions = geometry.getAttribute("position");
    const time = clock.elapsedTime;
    for (let index = 0; index < positions.count; index += 1) {
      const x = positions.getX(index);
      const z = positions.getZ(index);
      positions.setY(index, waveHeight(x, z, time) * waveAmplitude);
    }
    positions.needsUpdate = true;
  });

  return (
    <mesh geometry={geometry} receiveShadow renderOrder={3}>
      <meshBasicMaterial
        vertexColors
        side={DoubleSide}
        toneMapped={false}
        opacity={1}
        transparent={false}
      />
    </mesh>
  );
}
