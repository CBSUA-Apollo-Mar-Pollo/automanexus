import { BufferGeometry, Color, Float32BufferAttribute } from "three";
import { sampleTerrainHeight } from "./terrainGeometry";

export const POND_CONFIG = {
  x: 0,
  z: 0,
  radius: 20,
  aspectRatio: 0.66,
  borderWidth: 0.85,
  shoreWidth: 1.6,
  waterLevel: 0.17,
  basinDepth: 0.8,
};

const WHITE = new Color("#fffdf4");
const SHORE_COLOR = new Color("#dfc68c");
const SHORE_VARIATION = [
  { frequency: 1, amplitude: 0.07, phase: 1.2, cosine: true },
  { frequency: 2, amplitude: 0.075, phase: 0.5 },
  { frequency: 3, amplitude: 0.045, phase: -1.1 },
  { frequency: 4, amplitude: 0.025, phase: 1.8, cosine: true },
  { frequency: 6, amplitude: 0.012, phase: -0.7 },
];

export function getPondBoundaryRadius(angle, radius = POND_CONFIG.radius) {
  const variation = SHORE_VARIATION.reduce((total, wave) => {
    const phase = angle * wave.frequency + wave.phase;
    return (
      total +
      wave.amplitude * (wave.cosine ? Math.cos(phase) : Math.sin(phase))
    );
  }, 0);
  return radius * (1 + variation);
}

export function getPondBoundaryScaleLimit() {
  return (
    1 +
    SHORE_VARIATION.reduce(
      (total, wave) => total + Math.abs(wave.amplitude),
      0,
    )
  );
}

export function getPondBoundaryPoint(
  angle,
  radius = POND_CONFIG.radius,
  aspectRatio = POND_CONFIG.aspectRatio,
) {
  const boundaryRadius = getPondBoundaryRadius(angle, radius);
  return [
    Math.cos(angle) * boundaryRadius,
    0,
    Math.sin(angle) * boundaryRadius * aspectRatio,
  ];
}

function createGeometry(triangles) {
  const positions = [];
  const colors = [];
  const geometry = new BufferGeometry();

  triangles.forEach(({ points, color }) => {
    const [first, second, third] = points;
    const crossY =
      (second[2] - first[2]) * (third[0] - first[0]) -
      (second[0] - first[0]) * (third[2] - first[2]);
    const orderedPoints = crossY >= 0 ? points : [first, third, second];

    orderedPoints.forEach((point) => {
      positions.push(...point);
      colors.push(color.r, color.g, color.b);
    });
  });

  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function createCircularRing(
  radius,
  aspectRatio,
  innerOffset,
  outerOffset,
  y,
  color,
  segments = 96,
) {
  const triangles = [];

  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    const nextAngle = ((index + 1) / segments) * Math.PI * 2;
    const innerRadius = getPondBoundaryRadius(angle, radius) + innerOffset;
    const nextInnerRadius =
      getPondBoundaryRadius(nextAngle, radius) + innerOffset;
    const outerRadius = getPondBoundaryRadius(angle, radius) + outerOffset;
    const nextOuterRadius =
      getPondBoundaryRadius(nextAngle, radius) + outerOffset;
    const innerStart = [
      Math.cos(angle) * innerRadius,
      y,
      Math.sin(angle) * innerRadius * aspectRatio,
    ];
    const innerEnd = [
      Math.cos(nextAngle) * nextInnerRadius,
      y,
      Math.sin(nextAngle) * nextInnerRadius * aspectRatio,
    ];
    const outerStart = [
      Math.cos(angle) * outerRadius,
      y,
      Math.sin(angle) * outerRadius * aspectRatio,
    ];
    const outerEnd = [
      Math.cos(nextAngle) * nextOuterRadius,
      y,
      Math.sin(nextAngle) * nextOuterRadius * aspectRatio,
    ];
    triangles.push(
      { points: [innerStart, outerStart, innerEnd], color },
      { points: [innerEnd, outerStart, outerEnd], color },
    );
  }

  return triangles;
}

export function isInsidePondShore(x, z, margin = 0) {
  const clearance =
    POND_CONFIG.radius * getPondBoundaryScaleLimit() +
    POND_CONFIG.borderWidth +
    POND_CONFIG.shoreWidth +
    margin;
  return Math.hypot(x - POND_CONFIG.x, z - POND_CONFIG.z) < clearance;
}

export function createPondHeightOverride(config = POND_CONFIG) {
  const {
    x,
    z,
    radius,
    aspectRatio,
    borderWidth,
    shoreWidth,
    waterLevel,
    basinDepth,
  } = config;
  const transition = (start, end, amount) => {
    const blend = (amount - start) / (end - start);
    const smoothBlend = Math.max(0, Math.min(1, blend));
    const easedBlend = smoothBlend * smoothBlend * (3 - 2 * smoothBlend);
    return easedBlend;
  };
  const floorHeight = waterLevel - basinDepth;

  return (worldX, worldZ, terrainHeight) => {
    const offsetX = worldX - x;
    const offsetZ = worldZ - z;
    const normalizedZ = offsetZ / aspectRatio;
    const angle = Math.atan2(normalizedZ, offsetX);
    const edgeDistance =
      Math.hypot(offsetX, normalizedZ) - getPondBoundaryRadius(angle, radius);
    if (edgeDistance <= 0) return floorHeight;
    if (edgeDistance < borderWidth) {
      return (
        floorHeight +
        (waterLevel - floorHeight) *
          transition(0, borderWidth, edgeDistance)
      );
    }
    if (edgeDistance < borderWidth + shoreWidth) {
      return (
        waterLevel +
        (terrainHeight - waterLevel) *
          transition(borderWidth, borderWidth + shoreWidth, edgeDistance)
      );
    }
    return terrainHeight;
  };
}

function createShoreGeometry(config) {
  const {
    x: centerX,
    z: centerZ,
    radius,
    aspectRatio,
    borderWidth,
    shoreWidth,
  } = config;
  const perimeterSegments = 96;
  const radialSegments = 6;
  const innerRadius = radius + borderWidth;
  const outerRadius = innerRadius + shoreWidth;
  const heightOverride = createPondHeightOverride(config);
  const rings = Array.from({ length: radialSegments + 1 }, (_, radialIndex) => {
    const blend = radialIndex / radialSegments;
    return Array.from({ length: perimeterSegments }, (_, segment) => {
      const angle = (segment / perimeterSegments) * Math.PI * 2;
      const ringRadius =
        getPondBoundaryRadius(angle, radius) +
        innerRadius -
        radius +
        (outerRadius - innerRadius) * blend;
      const localX = Math.cos(angle) * ringRadius;
      const localZ = Math.sin(angle) * ringRadius * aspectRatio;
      const worldX = centerX + localX;
      const worldZ = centerZ + localZ;
      const terrainHeight = sampleTerrainHeight(worldX, worldZ);
      const height =
        heightOverride(worldX, worldZ, terrainHeight) + 0.008;
      return [localX, height, localZ];
    });
  });
  const triangles = [];

  for (let radialIndex = 0; radialIndex < radialSegments; radialIndex += 1) {
    for (let segment = 0; segment < perimeterSegments; segment += 1) {
      const next = (segment + 1) % perimeterSegments;
      const innerStart = rings[radialIndex][segment];
      const innerEnd = rings[radialIndex][next];
      const outerStart = rings[radialIndex + 1][segment];
      const outerEnd = rings[radialIndex + 1][next];
      triangles.push(
        { points: [innerStart, outerStart, innerEnd], color: SHORE_COLOR },
        { points: [innerEnd, outerStart, outerEnd], color: SHORE_COLOR },
      );
    }
  }

  return createGeometry(triangles);
}

export function createPondGeometry(config = POND_CONFIG) {
  const { radius, aspectRatio, borderWidth, waterLevel } = config;
  const border = createCircularRing(
    radius,
    aspectRatio,
    0,
    borderWidth,
    waterLevel,
    WHITE,
  );
  return {
    border: createGeometry(border),
    shore: createShoreGeometry(config),
  };
}
