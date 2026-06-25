import React from "react";

export function Platform({
  position = [0, 0, 0],
  size = [5, 0.5, 5],
  color = "#3b82f6",
}) {
  return (
    <mesh position={position} receiveShadow>
      {/* BoxGeometry defines width, height, and depth */}
      <boxGeometry args={size} />
      {/* MeshStandardMaterial reacts realistically to scene lighting */}
      <meshLambertMaterial color={0xbaf455} flatShading />
    </mesh>
  );
}
