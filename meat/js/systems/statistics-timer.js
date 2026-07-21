/* ==========================================================
   1. STATISTICS TIMER
   ----------------------------------------------------------
   Refreshes the displayed run time once per second without
   unnecessarily redrawing the rest of the interface.
========================================================== */

setInterval(() => {
  runTimeStat.textContent = formatRunTime(
    Date.now() - gameState.runStartedAt
  );
}, 1000);
