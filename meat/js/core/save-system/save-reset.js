/* ==========================================================
   1. PERMANENT GAME RESET
   ----------------------------------------------------------
   Deletes the active save, quarantined recovery data, and every
   persistent trust record before creating a completely new game.
========================================================== */

function resetGameState() {
  try {
    localStorage.removeItem(MEAT_SAVE_KEY);
    clearInvalidLocalSaveBackup();
    setLocalSaveWritesBlocked(false);

    gameState = createDefaultGameState();
    calculateMeatPerSecond();

    return saveGame();
  } catch (error) {
    console.error("MEAT.exe could not be reset:", error);
    return false;
  }
}
