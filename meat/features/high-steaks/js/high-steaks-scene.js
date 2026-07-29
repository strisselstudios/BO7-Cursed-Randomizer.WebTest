/* ==========================================================
   1. HIGH STEAKS SCENE STATES
========================================================== */

const HIGH_STEAKS_SCENE_STATES =
  Object.freeze([
    "lobby",
    "table",
    "reveal",
    "results"
  ]);

/* ==========================================================
   2. TABLE SCENE STATE
========================================================== */

HighSteaks.applySceneState =
  function applySceneState(
    sceneState
  ) {
    if (!highSteaksScene) return;

    const normalizedState =
      HIGH_STEAKS_SCENE_STATES
        .includes(
          sceneState
        )
        ? sceneState
        : "lobby";

    highSteaksScene.dataset
      .highSteaksSceneState =
      normalizedState;
  };

/* ==========================================================
   3. WINDOW-OPEN INITIALIZATION
========================================================== */

HighSteaks.initializeScene =
  function initializeScene() {
    HighSteaks.showLobby();
  };

/* ==========================================================
   4. SCENE LIFECYCLE
========================================================== */

document.addEventListener(
  "high-steaks:opened",
  HighSteaks.initializeScene
);
