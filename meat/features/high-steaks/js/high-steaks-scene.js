/* ==========================================================
   1. HIGH STEAKS SCENE STATES
========================================================== */

const HIGH_STEAKS_SCENE_STATES = Object.freeze(["lobby", "table", "reveal", "results"]);

HighSteaks.applySceneState = function applySceneState(sceneState) {
  if (!highSteaksScene) return;

  const normalizedState = HIGH_STEAKS_SCENE_STATES.includes(sceneState) ? sceneState : "table";
  highSteaksScene.dataset.highSteaksSceneState = normalizedState;
};

/* ==========================================================
   2. PROTOTYPE SCENE INITIALIZATION
========================================================== */

HighSteaks.initializePrototypeScene = function initializePrototypeScene() {
  HighSteaks.prototypeState = HighSteaks.createPlaceholderState();
  HighSteaks.renderPrototype();
};

/* ==========================================================
   3. SCENE LIFECYCLE EVENTS
========================================================== */

document.addEventListener("high-steaks:opened", HighSteaks.initializePrototypeScene);
