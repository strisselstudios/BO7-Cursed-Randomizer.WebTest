/* ==========================================================
   LOCAL SAVE SYSTEM
   ----------------------------------------------------------
   Loads and saves MEAT.exe progress using localStorage.
========================================================== */

function loadGame() {
  const savedData = localStorage.getItem(MEAT_SAVE_KEY);

  if (!savedData) {
    gameState = createDefaultGameState();
    return;
  }

  try {
    const parsedSave = JSON.parse(savedData);
    gameState = migrateGameState(parsedSave);
    calculateMeatPerSecond();
  } catch (error) {
    console.error("MEAT.exe save could not be loaded:", error);
    gameState = createDefaultGameState();
  }
}

function saveGame() {
  gameState.lastSavedAt = Date.now();

  try {
    localStorage.setItem(MEAT_SAVE_KEY, JSON.stringify(gameState));
    return true;
  } catch (error) {
    console.error("MEAT.exe save could not be stored:", error);
    return false;
  }
}
