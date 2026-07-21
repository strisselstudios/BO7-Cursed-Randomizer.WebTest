/* ==========================================================
   1. PASSIVE PRODUCTION
   ----------------------------------------------------------
   Produces MEAT continuously while the game is visible.

   Hidden and suspended time is excluded here because offline
   production handles it separately.
========================================================== */

const GAME_TICK_RATE = 100;

let previousProductionTime =
  performance.now();

function runProductionTick(
  currentTime
) {
  const elapsedSeconds =
    Math.min(
      (
        currentTime -
        previousProductionTime
      ) / 1000,
      1
    );

  previousProductionTime =
    currentTime;

  if (
    !document.hidden &&
    gameState.meatPerSecond > 0
  ) {
    const producedMeat =
      harvestProducerMeat(
        elapsedSeconds
      );

    if (producedMeat > 0) {
      updateResourceDisplay();
      updateProducerDisplay();
    }
  }

  setTimeout(
    () => {
      runProductionTick(
        performance.now()
      );
    },
    GAME_TICK_RATE
  );
}

document.addEventListener(
  "visibilitychange",
  () => {
    previousProductionTime =
      performance.now();
  }
);

runProductionTick(
  performance.now()
);
