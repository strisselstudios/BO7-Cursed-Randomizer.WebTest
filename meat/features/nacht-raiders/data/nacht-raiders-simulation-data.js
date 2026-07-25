/* ==========================================================
   1. SIMULATION TIMING
   ----------------------------------------------------------
   Defines the fixed authoritative simulation step and the
   maximum amount of elapsed offline time that can be credited.
========================================================== */

const NACHT_RAIDERS_SIMULATION_SETTINGS = Object.freeze({
  stepMs: 10 * 1000,
  activePollMs: 1000,
  maximumOfflineMs: 24 * 60 * 60 * 1000
});

/* ==========================================================
   2. TRAVEL PROGRESSION
   ----------------------------------------------------------
   One simulation step advances one travel unit. Reaching six
   travel units advances the operative one zone depth.
========================================================== */

const NACHT_RAIDERS_TRAVEL_SETTINGS = Object.freeze({
  unitsPerStep: 1,
  unitsPerDepth: 6
});
