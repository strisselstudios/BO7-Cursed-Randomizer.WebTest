/* ==========================================================
   1. AUTOMATIC SAVING
   ----------------------------------------------------------
   Saves progress periodically and whenever the page loses
   focus or is about to be closed.
========================================================== */

const AUTOSAVE_INTERVAL = 15000;

setInterval(() => {
  saveGame();
}, AUTOSAVE_INTERVAL);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    saveGame();
  }
});

window.addEventListener("beforeunload", () => {
  saveGame();
});

window.addEventListener("pagehide", () => {
  saveGame();
});
