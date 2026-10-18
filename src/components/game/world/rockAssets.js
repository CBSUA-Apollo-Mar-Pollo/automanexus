import { DodecahedronGeometry, MeshStandardMaterial } from "three";

export const LOW_POLY_ROCK_GEOMETRY = new DodecahedronGeometry(1, 0);

export const LOW_POLY_ROCK_MATERIALS = [
  "#9b6845",
  "#ae7952",
  "#80563d",
  "#c08a5c",
].map(
  (color) =>
    new MeshStandardMaterial({
      color,
      roughness: 1,
      flatShading: true,
    }),
);
