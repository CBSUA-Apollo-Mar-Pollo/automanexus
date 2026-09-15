import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import Editor from "@monaco-editor/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { LowPolyTreeModel } from "./components/canvas/models/Low_poly_tree_model";
import { LowPolyTreeModel2 } from "./components/canvas/models/Low_poly_tree_2";
import { LowPolyTreeModel3 } from "./components/canvas/models/Low_poly_tree_3";
import {
  runAutomationProgram,
  starterPrograms,
} from "./game/automationRuntime";

function FarmTile({ position, resource, harvested }) {
  const treeType =
    Math.abs(Math.round(position[0] * 10) + Math.round(position[2] * 10)) % 3;

  return (
    <group position={position}>
      {/* Soil base */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.95, 0.5, 1.01]} />
        <meshStandardMaterial color="#ffb469" roughness={0.9} flatShading />
      </mesh>

      {/* Grass top */}
      <mesh position={[0, 0.511, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.86, 0.08, 0.92]} />
        <meshStandardMaterial color="#807C1C" roughness={0.8} flatShading />
      </mesh>

      {/* --- Rock Decorations --- */}
      <group>
        <mesh
          position={[-0.2, 0.12, 0.46]}
          rotation={[0.4, 0.2, 0.5]}
          castShadow
        >
          <dodecahedronGeometry args={[0.09, 0]} />
          <meshStandardMaterial color="#888888" roughness={0.9} flatShading />
        </mesh>
        <mesh
          position={[0.3, 0.08, 0.47]}
          rotation={[0.9, -0.4, 0.1]}
          castShadow
        >
          <dodecahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial color="#999999" roughness={0.9} flatShading />
        </mesh>
        <mesh
          position={[0.47, 0.15, -0.1]}
          rotation={[0.2, 0.8, -0.5]}
          castShadow
        >
          <dodecahedronGeometry args={[0.07, 0]} />
          <meshStandardMaterial color="#7a7a7a" roughness={0.9} flatShading />
        </mesh>
        <mesh
          position={[-0.47, 0.1, 0.15]}
          rotation={[-0.3, 0.5, 0.9]}
          castShadow
        >
          <dodecahedronGeometry args={[0.055, 0]} />
          <meshStandardMaterial color="#8e8e8e" roughness={0.9} flatShading />
        </mesh>
      </group>

      {resource === "tree" && !harvested && (
        <group
        /* Stays dead center at X:0 and Z:0, only adjusts Y dynamically */
        >
          {treeType === 0 && <LowPolyTreeModel position={[0, 0.55, 0]} />}
          {treeType === 1 && <LowPolyTreeModel2 />}
          {treeType === 2 && <LowPolyTreeModel3 position={[0, 0.55, 0]} />}
        </group>
      )}
    </group>
  );
}
function HarvestEffect({ position }) {
  const effectRef = useRef(null);
  const puffRef = useRef(null);
  const particleGroupRef = useRef(null);
  const elapsedRef = useRef(0);
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 8) * Math.PI * 2;
        return {
          x: Math.cos(angle) * (0.52 + (index % 3) * 0.08),
          y: 0.3 + (index % 3) * 0.12,
          z: Math.sin(angle) * (0.52 + (index % 3) * 0.08),
        };
      }),
    [],
  );

  useFrame((state, delta) => {
    elapsedRef.current = Math.min(0.8, elapsedRef.current + delta);
    const progress = elapsedRef.current / 0.8;

    if (effectRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 14) * 0.25;
      effectRef.current.scale.set(pulse, pulse, pulse);
      effectRef.current.rotation.z += delta * 4;
      effectRef.current.material.opacity = 1 - progress;
    }

    if (puffRef.current) {
      const puffScale = 0.3 + progress * 0.9;
      puffRef.current.scale.set(puffScale, puffScale, puffScale);
      puffRef.current.material.opacity = 0.5 * (1 - progress);
    }

    if (particleGroupRef.current) {
      particleGroupRef.current.children.forEach((particle, index) => {
        const velocity = particles[index];
        particle.position.x = velocity.x * progress;
        particle.position.y =
          velocity.y * progress - progress * progress * 0.12;
        particle.position.z = velocity.z * progress;
        particle.rotation.x += delta * 7;
        particle.rotation.y += delta * 5;
        particle.scale.setScalar(1.3 - progress * 0.7);
        particle.material.opacity = 1 - progress;
      });
    }
  });

  return (
    <group position={[position[0], 0.72, position[2]]}>
      <mesh ref={effectRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.32, 0.06, 8, 24]} />
        <meshStandardMaterial
          color="#f6d365"
          emissive="#f6a623"
          emissiveIntensity={3}
          transparent
          opacity={1}
          depthTest={false}
        />
      </mesh>
      <mesh position={[0, 0.24, 0]}>
        <coneGeometry args={[0.09, 0.5, 6]} />
        <meshStandardMaterial
          color="#fff1a8"
          emissive="#f6a623"
          emissiveIntensity={3}
          transparent
          opacity={1}
          depthTest={false}
        />
      </mesh>
      <mesh ref={puffRef} position={[0, 0.45, 0]} scale={0.3}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial
          color="#f0e7b0"
          emissive="#d9b95d"
          emissiveIntensity={0.8}
          transparent
          opacity={0.5}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      <group ref={particleGroupRef}>
        {particles.map((_, index) => (
          <mesh key={index} scale={1.3}>
            <icosahedronGeometry args={[0.08, 0]} />
            <meshStandardMaterial
              color={index % 2 === 0 ? "#9eb045" : "#e9c46a"}
              emissive="#a3c438"
              emissiveIntensity={1.4}
              transparent
              opacity={1}
              depthTest={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Drone({ position, isHarvesting }) {
  const droneRef = useRef(null);
  const [initialPosition] = useState(() => [position[0], 1.25, position[2]]);
  const targetPosition = useMemo(
    () => ({ x: position[0], y: 1.25, z: position[2] }),
    [position],
  );
  useFrame((state, delta) => {
    if (!droneRef.current) return;

    droneRef.current.position.lerp(targetPosition, Math.min(1, delta * 4.5));
    droneRef.current.position.y += isHarvesting
      ? Math.sin(state.clock.elapsedTime * 16) * delta * 0.8
      : 0;
    droneRef.current.rotation.y += delta * 2;
  });

  return (
    <group ref={droneRef} position={initialPosition}>
      <mesh castShadow>
        <boxGeometry args={[0.24, 0.12, 0.24]} />
        <meshStandardMaterial color="#e9c46a" flatShading />
      </mesh>
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 0.12, 6]} />
        <meshStandardMaterial color="#264653" flatShading />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.18, 0.02, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.035, 0.035, 0.16, 8]} />
          <meshStandardMaterial color="#f4a261" flatShading />
        </mesh>
      ))}
    </group>
  );
}

const getRunningCodeDecorations = (code) =>
  code
    .split("\n")
    .map((line, index) => ({ line, lineNumber: index + 1 }))
    .filter(({ line }) => line.includes("drone."))
    .map(({ lineNumber }) => ({
      range: {
        startLineNumber: lineNumber,
        startColumn: 1,
        endLineNumber: lineNumber,
        endColumn: 1,
      },
      options: {
        isWholeLine: true,
        className: "running-code-line",
        glyphMarginClassName: "running-code-glyph",
      },
    }));

function App() {
  const initialTiles = useMemo(() => {
    const gridSize = 4;
    const tiles = [];

    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        tiles.push({
          id: `${x}-${z}`,
          pos: [
            (x - (gridSize - 1) / 2) * 0.9,
            0,
            (z - (gridSize - 1) / 2) * 1.0,
          ],
          resource: "tree",
          harvested: false,
        });
      }
    }

    return tiles;
  }, []);
  const [tiles, setTiles] = useState(initialTiles);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(starterPrograms.javascript);
  const [dronePosition, setDronePosition] = useState([0, 0, 0]);
  const [messages, setMessages] = useState([
    "Drone ready. Write a program and run it.",
  ]);
  const [route, setRoute] = useState([]);
  const [harvestingTileId, setHarvestingTileId] = useState(null);
  const [isEditorMinimized, setIsEditorMinimized] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const editorRef = useRef(null);
  const decorationsRef = useRef([]);
  const panelRef = useRef(null);
  const dragRef = useRef(null);
  const [panelPosition, setPanelPosition] = useState(null);
  const harvestedCount = tiles.filter((tile) => tile.harvested).length;
  const isCodeRunning = route.length > 0 || harvestingTileId !== null;

  const selectLanguage = (nextLanguage) => {
    setLanguage(nextLanguage);
    setCode(starterPrograms[nextLanguage]);
    setMessages([
      `${nextLanguage === "python" ? "Python" : "JavaScript"} program loaded.`,
    ]);
  };

  const runProgram = () => {
    if (route.length > 0) return;

    const result = runAutomationProgram({ code, language, tiles });
    const nextRoute = result.harvestedIds
      .map((id) => tiles.find((tile) => tile.id === id))
      .filter(Boolean);

    if (nextRoute.length === 0) {
      setMessages(result.messages);
      return;
    }

    setRoute(nextRoute);
    setMessages([
      `Route started: ${nextRoute.length} tile${nextRoute.length === 1 ? "" : "s"}.`,
    ]);
  };

  const resetWorld = () => {
    setRoute([]);
    setHarvestingTileId(null);
    setTiles(initialTiles);
    setDronePosition([0, 0, 0]);
    setMessages(["World reset. The resources are ready for another run."]);
  };

  useEffect(() => {
    if (route.length === 0) {
      return undefined;
    }

    const nextTile = route[0];
    let harvestTimer;
    const arrivalTimer = window.setTimeout(() => {
      setDronePosition(nextTile.pos);
      setHarvestingTileId(nextTile.id);
      harvestTimer = window.setTimeout(() => {
        setTiles((currentTiles) =>
          currentTiles.map((tile) =>
            tile.id === nextTile.id ? { ...tile, harvested: true } : tile,
          ),
        );
        setHarvestingTileId(null);
        setMessages((currentMessages) =>
          [
            `Drone harvested tree at tile ${nextTile.id}.`,
            ...currentMessages,
          ].slice(0, 4),
        );
        setRoute((currentRoute) => currentRoute.slice(1));
      }, 800);
    }, 900);

    return () => {
      window.clearTimeout(arrivalTimer);
      if (harvestTimer) window.clearTimeout(harvestTimer);
    };
  }, [route]);

  useEffect(() => {
    if (!editorReady || !editorRef.current) return;

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      isCodeRunning ? getRunningCodeDecorations(code) : [],
    );
  }, [code, editorReady, isCodeRunning]);

  const startPanelDrag = (event) => {
    if (event.button !== 0 || event.target.closest("button")) return;

    const panel = panelRef.current;
    if (!panel) return;

    const bounds = panel.getBoundingClientRect();
    const movePanel = (moveEvent) => {
      const maxLeft = window.innerWidth - bounds.width;
      const maxTop = window.innerHeight - bounds.height;
      const left = Math.min(
        Math.max(0, moveEvent.clientX - dragRef.current.offsetX),
        Math.max(0, maxLeft),
      );
      const top = Math.min(
        Math.max(0, moveEvent.clientY - dragRef.current.offsetY),
        Math.max(0, maxTop),
      );

      setPanelPosition({ left, top });
    };
    const stopPanelDrag = () => {
      document.removeEventListener("pointermove", movePanel);
      document.removeEventListener("pointerup", stopPanelDrag);
      dragRef.current = null;
    };

    dragRef.current = {
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
      movePanel,
      stopPanelDrag,
    };
    setPanelPosition({ left: bounds.left, top: bounds.top });
    document.addEventListener("pointermove", movePanel);
    document.addEventListener("pointerup", stopPanelDrag);
  };

  useEffect(() => {
    return () => {
      if (!dragRef.current) return;
      document.removeEventListener("pointermove", dragRef.current.movePanel);
      document.removeEventListener("pointerup", dragRef.current.stopPanelDrag);
    };
  }, []);

  const resourceStats = [
    { icon: "ORE", amount: "9k" },
    { icon: "LOG", amount: "10.1k" },
    { icon: "SEED", amount: "6.1k" },
    { icon: "PUM", amount: "3.26k" },
    { icon: "GEM", amount: "3.32k" },
    { icon: "RUB", amount: "2.3k" },
    { icon: "BOX", amount: "616" },
    { icon: "KIT", amount: "155" },
  ];

  return (
    <div className="game-shell">
      <header className="topbar">
        <div className="resource-strip">
          {resourceStats.map((stat) => (
            <div className="resource-item" key={stat.icon}>
              <span
                className={`resource-icon resource-${stat.icon.toLowerCase()}`}
              >
                {stat.icon}
              </span>
              <strong>{stat.amount}</strong>
            </div>
          ))}
        </div>
        <nav className="top-actions" aria-label="Game controls">
          <button aria-label="Add building">+</button>
          <button aria-label="Information">i</button>
          <button aria-label="Toggle layout">::</button>
        </nav>
      </header>
      <section className="world-panel">
        <div className="world-heading">
          <div>
            <p className="eyebrow">AUTOMA NEXUS / FIELD 01</p>
            <h1>Program the harvest.</h1>
          </div>
          <div className="resource-counter">
            <strong>{harvestedCount}</strong> / {tiles.length} gathered
          </div>
        </div>
        <div className="canvas-wrap">
          <Canvas
            orthographic
            camera={{ zoom: 110, position: [0, 5, 4.01] }}
            shadows
          >
            <OrbitControls enablePan={false} />
            <ambientLight intensity={0.6} />
            <directionalLight
              position={[-120, 60, 50]}
              intensity={1.5}
              castShadow
              shadow-mapSize={[2048, 2048]}
            />
            {tiles.map((tile) => (
              <FarmTile
                key={tile.id}
                position={tile.pos}
                resource={tile.resource}
                harvested={tile.harvested}
              />
            ))}
            <Drone
              position={route[0]?.pos ?? dronePosition}
              isHarvesting={harvestingTileId !== null}
            />
            {harvestingTileId && (
              <HarvestEffect
                position={
                  tiles.find((tile) => tile.id === harvestingTileId)?.pos ?? [
                    0, 0, 0,
                  ]
                }
              />
            )}
          </Canvas>
        </div>
        <div className="legend">
          <span>
            <i className="dot tree-dot" /> Tree
          </span>
          <span>
            <i className="dot drone-dot" /> Drone
          </span>
        </div>
      </section>

      <aside
        ref={panelRef}
        className="control-panel"
        style={
          panelPosition
            ? {
                left: panelPosition.left,
                top: panelPosition.top,
                right: "auto",
              }
            : undefined
        }
      >
        <div className="panel-header" onPointerDown={startPanelDrag}>
          <div>
            <p className="eyebrow">CROPS / PROGRAM</p>
            <h2>harvester_01</h2>
          </div>
          <div className="window-buttons">
            <button
              aria-label={
                isEditorMinimized ? "Restore editor" : "Minimize editor"
              }
              onClick={() => setIsEditorMinimized((minimized) => !minimized)}
            >
              {isEditorMinimized ? "+" : "-"}
            </button>
            <button aria-label="Close editor">x</button>
          </div>
        </div>
        {!isEditorMinimized && (
          <>
            <p className="instruction">
              Give the drone a target. Use a loop to harvest every matching
              tree.
            </p>
            <div
              className="language-switcher"
              role="group"
              aria-label="Programming language"
            >
              <button
                className={language === "javascript" ? "active" : ""}
                onClick={() => selectLanguage("javascript")}
              >
                JavaScript
              </button>
              <button
                className={language === "python" ? "active" : ""}
                onClick={() => selectLanguage("python")}
              >
                Python
              </button>
            </div>
            <div className="editor-frame">
              <Editor
                height="260px"
                language={language}
                theme="vs-dark"
                value={code}
                onMount={(editor) => {
                  editorRef.current = editor;
                  setEditorReady(true);
                }}
                onChange={(value) => setCode(value || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  padding: { top: 14 },
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
            <div className="api-note">
              <span>API</span> `drone.findNearest` / `drone.find_nearest` then
              `drone.harvest`
            </div>
            <div className="action-row">
              <button className="run-button" onClick={runProgram}>
                Run program <span>Ctrl + Enter</span>
              </button>
              <button className="reset-button" onClick={resetWorld}>
                Reset
              </button>
            </div>
            <div className="console-output">
              <div className="output-label">RUN LOG</div>
              {messages.map((message, index) => (
                <p key={`${message}-${index}`}>{message}</p>
              ))}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export default App;
