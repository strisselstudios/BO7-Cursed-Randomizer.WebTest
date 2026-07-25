/* ==========================================================
   PERMANENT GAME RESET
   ----------------------------------------------------------
   Deletes the stored save and replaces the current state with
   a completely new game.
========================================================== */

function resetGameState() {
  try {
    localStorage.removeItem(MEAT_SAVE_KEY);
    gameState = createDefaultGameState();
    calculateMeatPerSecond();
    return saveGame();
  } catch (error) {
    console.error("MEAT.exe could not be reset:", error);
    return false;
  }
}
