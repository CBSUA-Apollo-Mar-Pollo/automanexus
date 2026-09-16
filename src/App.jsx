import Editor from "@monaco-editor/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { WorldScene } from "./components/game/WorldScene";
import {
  runAutomationProgram,
  starterPrograms,
} from "./game/automationRuntime";

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
          <WorldScene
            tiles={tiles}
            route={route}
            dronePosition={dronePosition}
            harvestingTileId={harvestingTileId}
          />
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
