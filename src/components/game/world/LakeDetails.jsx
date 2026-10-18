import {
  DodecahedronGeometry,
  DoubleSide,
  MeshStandardMaterial,
  Shape,
  ShapeGeometry,
} from "three";
import { POND_CONFIG } from "./pondGeometry";

const LILY_PAD_SHAPE = new Shape();
LILY_PAD_SHAPE.absarc(0, 0, 1, 0.35, Math.PI * 2 - 0.35, false);
LILY_PAD_SHAPE.lineTo(0, 0);
LILY_PAD_SHAPE.closePath();

const LILY_PAD_GEOMETRY = new ShapeGeometry(LILY_PAD_SHAPE, 12);
const FROG_BODY_GEOMETRY = new DodecahedronGeometry(0.42, 0);
const FROG_HEAD_GEOMETRY = new DodecahedronGeometry(0.3, 0);
const FROG_EYE_GEOMETRY = new DodecahedronGeometry(0.095, 0);
const FROG_PUPIL_GEOMETRY = new DodecahedronGeometry(0.045, 0);
const FROG_LEG_GEOMETRY = new DodecahedronGeometry(0.19, 0);
const LILY_PAD_MATERIALS = ["#397d42", "#4d9147", "#5b9b4c"].map(
  (color) =>
    new MeshStandardMaterial({
      color,
      roughness: 1,
      flatShading: true,
      side: DoubleSide,
    }),
);
const FROG_MATERIAL = new MeshStandardMaterial({
  color: "#65a844",
  roughness: 1,
  flatShading: true,
});
const FROG_BELLY_MATERIAL = new MeshStandardMaterial({
  color: "#a9c96b",
  roughness: 1,
  flatShading: true,
});
const FROG_EYE_MATERIAL = new MeshStandardMaterial({
  color: "#f6f0d8",
  roughness: 1,
  flatShading: true,
});
const FROG_PUPIL_MATERIAL = new MeshStandardMaterial({
  color: "#252b23",
  roughness: 1,
  flatShading: true,
});

const LILY_PADS = [
  { x: -7, z: -1.8, scale: 1.1, rotation: 0.3, material: 0 },
  { x: -3.7, z: -3.2, scale: 0.84, rotation: 2.4, material: 1 },
  { x: 4.2, z: -2.5, scale: 0.95, rotation: 1.1, material: 2 },
  { x: 7.3, z: 1.1, scale: 1.08, rotation: 3.4, material: 1 },
  { x: 2.1, z: 4.1, scale: 0.8, rotation: 4.7, material: 0 },
];
const FROGS = [
  { x: -7, z: -1.8, rotation: -0.5, scale: 0.8 },
  { x: 4.2, z: -2.5, rotation: 1.7, scale: 0.72 },
];

function LilyPad({ pad }) {
  return (
    <mesh
      geometry={LILY_PAD_GEOMETRY}
      material={LILY_PAD_MATERIALS[pad.material]}
      position={[pad.x, POND_CONFIG.waterLevel + 0.045, pad.z]}
      rotation={[-Math.PI / 2, 0, pad.rotation]}
      scale={pad.scale}
      receiveShadow
      castShadow
    />
  );
}

function Frog({ frog }) {
  const { x, z, rotation, scale } = frog;
  const y = POND_CONFIG.waterLevel + 0.18;

  return (
    <group position={[x, y, z]} rotation={[0, rotation, 0]} scale={scale}>
      <mesh
        geometry={FROG_BODY_GEOMETRY}
        material={FROG_MATERIAL}
        position={[0, 0.12, 0]}
        scale={[1.15, 0.68, 1.35]}
        castShadow
      />
      <mesh
        geometry={FROG_HEAD_GEOMETRY}
        material={FROG_MATERIAL}
        position={[0, 0.33, 0.36]}
        scale={[1.12, 0.92, 0.92]}
        castShadow
      />
      <mesh
        geometry={FROG_BODY_GEOMETRY}
        material={FROG_BELLY_MATERIAL}
        position={[0, 0.04, -0.16]}
        scale={[0.72, 0.3, 0.82]}
      />
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh
            geometry={FROG_EYE_GEOMETRY}
            material={FROG_EYE_MATERIAL}
            position={[side * 0.19, 0.6, 0.48]}
            castShadow
          />
          <mesh
            geometry={FROG_PUPIL_GEOMETRY}
            material={FROG_PUPIL_MATERIAL}
            position={[side * 0.19, 0.62, 0.55]}
          />
          <mesh
            geometry={FROG_LEG_GEOMETRY}
            material={FROG_MATERIAL}
            position={[side * 0.38, -0.02, 0.28]}
            rotation={[0.15, 0, side * -0.35]}
            scale={[1.15, 0.55, 0.75]}
          />
        </group>
      ))}
    </group>
  );
}

export default function LakeDetails() {
  return (
    <group>
      {LILY_PADS.map((pad) => (
        <LilyPad key={`${pad.x}-${pad.z}`} pad={pad} />
      ))}
      {FROGS.map((frog) => (
        <Frog key={`${frog.x}-${frog.z}`} frog={frog} />
      ))}
    </group>
  );
}
