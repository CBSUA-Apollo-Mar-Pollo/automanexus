import { useState } from "react";
import { WorldScene } from "./components/game/WorldScene";

function App() {
  const [freeCamera, setFreeCamera] = useState(false);

  return (
    <main className="world-panel">
      <WorldScene freeCamera={freeCamera} />
      <button
        className="camera-toggle"
        type="button"
        aria-pressed={freeCamera}
        onClick={() => setFreeCamera((enabled) => !enabled)}
      >
        Free camera: {freeCamera ? "On" : "Off"}
      </button>
    </main>
  );
}

export default App;
