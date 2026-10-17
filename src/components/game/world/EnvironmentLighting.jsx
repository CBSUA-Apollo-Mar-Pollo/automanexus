export default function EnvironmentLighting() {
  return (
    <>
      <ambientLight intensity={1.05} />
      <directionalLight
        position={[-42, 48, -28]}
        intensity={2.25}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={180}
        shadow-camera-left={-48}
        shadow-camera-right={48}
        shadow-camera-top={48}
        shadow-camera-bottom={-48}
        shadow-bias={-0.00015}
        shadow-normalBias={0.025}
      />
    </>
  );
}
