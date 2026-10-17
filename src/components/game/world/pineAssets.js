import { ConeGeometry, CylinderGeometry, MeshStandardMaterial } from "three";

export const PINE_TRUNK_GEOMETRY = new CylinderGeometry(0.09, 0.14, 0.68, 5);
export const PINE_FOLIAGE_GEOMETRIES = [
  new ConeGeometry(0.76, 1.28, 6),
  new ConeGeometry(0.59, 1.12, 6),
  new ConeGeometry(0.41, 0.94, 6),
];
export const PINE_FOLIAGE_HEIGHTS = [0.77, 1.36, 1.92];

export const PINE_TRUNK_MATERIAL = new MeshStandardMaterial({
  color: "#563a26",
  roughness: 1,
  flatShading: true,
});

export const PINE_FOLIAGE_MATERIALS = [
  "#236b40",
  "#287749",
  "#2d824e",
  "#358b54",
  "#317447",
  "#3b9258",
].map(
  (color) =>
    new MeshStandardMaterial({
      color,
      roughness: 1,
      flatShading: true,
    }),
);
