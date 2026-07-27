/* ==========================================================
   1. PRESENTATION STATES
========================================================== */

const NACHT_RAIDERS_PRESENTATION_STATE_TRAVEL = "travel";
const NACHT_RAIDERS_PRESENTATION_STATE_INCIDENT = "incident";
const NACHT_RAIDERS_PRESENTATION_STATE_COMBAT = "combat";

/* ==========================================================
   2. PRESENTATION EVENT TYPES
========================================================== */

const NACHT_RAIDERS_PRESENTATION_EVENT_INCIDENT = "incident";
const NACHT_RAIDERS_PRESENTATION_EVENT_COMBAT = "combat";

/* ==========================================================
   3. PRESENTATION SETTINGS
   ----------------------------------------------------------
   Controls transient visual playback only. Simulation results,
   rewards, combat outcomes, and saved progress are unaffected.
========================================================== */

const NACHT_RAIDERS_PRESENTATION_SETTINGS = Object.freeze({
  maximumEventsPerSummary: 8,
  maximumQueuedEvents: 24,
  queueGapMs: 300,
  minimumIncidentDurationMs: 1200,
  defaultIncidentDurationMs: 3600
});
