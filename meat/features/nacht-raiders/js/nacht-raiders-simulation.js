/* ==========================================================
   1. SIMULATION RUNTIME STATE
========================================================== */

let nachtRaidersSimulationInitialized = false;
let nachtRaidersSimulationIntervalId = null;

/* ==========================================================
   2. SIMULATION SUMMARY
   ----------------------------------------------------------
   Produces a stable result object for future field records,
   visual rendering, offline reports, and debugging.
========================================================== */

function createNachtRaidersSimulationSummary(
  currentTime,
  source
) {
  return {
    source,
    currentTime,
    elapsedMs: 0,
    processedMs: 0,
    remainingMs: 0,
    stepCount: 0,
    distanceTravelled: 0,
    depthGained: 0,

    incidentsGenerated: 0,
    levelsGained: 0,

    rewards:
      createEmptyNachtRaidersRewards(),
   
    wasCapped: false
  };
}

/* ==========================================================
   3. TRAVEL ADVANCEMENT
   ----------------------------------------------------------
   Converts completed simulation steps into travel distance,
   zone-depth progression, and permanent statistics.
========================================================== */

function advanceNachtRaidersTravel(
  nachtRaidersState,
  stepCount
) {
  const startingZoneDepth =
    nachtRaidersState.expedition.zoneDepth;
   
  const distanceTravelled =
    stepCount *
    NACHT_RAIDERS_TRAVEL_SETTINGS.unitsPerStep;

  const totalTravelProgress =
    nachtRaidersState.expedition.travelProgress +
    distanceTravelled;

  const depthGained = Math.floor(
    totalTravelProgress /
    NACHT_RAIDERS_TRAVEL_SETTINGS.unitsPerDepth
  );

  nachtRaidersState.expedition.zoneDepth +=
    depthGained;

  nachtRaidersState.expedition.travelProgress =
    totalTravelProgress %
    NACHT_RAIDERS_TRAVEL_SETTINGS.unitsPerDepth;

  nachtRaidersState.statistics.distanceTravelled +=
    distanceTravelled;

    return {
    startingZoneDepth,
    distanceTravelled,
    depthGained
  };
}

/* ==========================================================
   4. ELAPSED-TIME SIMULATION
   ----------------------------------------------------------
   Processes only complete fixed simulation steps. Any partial
   remainder is retained through lastSimulationAt and credited
   during a later update.

   Offline elapsed time is capped at the configured maximum.
========================================================== */

function simulateNachtRaidersToTime(
  currentTime = Date.now(),
  source = "manual"
) {
  const normalizedCurrentTime = Math.floor(
    Number(currentTime)
  );

  const summary =
    createNachtRaidersSimulationSummary(
      normalizedCurrentTime,
      source
    );

  if (
    !Number.isFinite(normalizedCurrentTime) ||
    normalizedCurrentTime <= 0
  ) {
    return summary;
  }

  const nachtRaidersState =
    ensureNachtRaidersFeatureState();

  if (
    !nachtRaidersState.hasStarted ||
    nachtRaidersState.status !==
      NACHT_RAIDERS_STATUS_RUNNING
  ) {
    return summary;
  }

  const savedSimulationTime = Number(
    nachtRaidersState.expedition.lastSimulationAt
  );

  if (
    !Number.isFinite(savedSimulationTime) ||
    savedSimulationTime <= 0 ||
    savedSimulationTime > normalizedCurrentTime
  ) {
    nachtRaidersState.expedition.lastSimulationAt =
      normalizedCurrentTime;

    return summary;
  }

  const elapsedMs = Math.max(
    0,
    normalizedCurrentTime - savedSimulationTime
  );

  summary.elapsedMs = elapsedMs;

  if (elapsedMs <= 0) {
    return summary;
  }

  const earliestCreditedTime = Math.max(
    savedSimulationTime,
    normalizedCurrentTime -
      NACHT_RAIDERS_SIMULATION_SETTINGS
        .maximumOfflineMs
  );

  summary.wasCapped =
    earliestCreditedTime > savedSimulationTime;

  const creditedElapsedMs =
    normalizedCurrentTime - earliestCreditedTime;

  const stepCount = Math.floor(
    creditedElapsedMs /
    NACHT_RAIDERS_SIMULATION_SETTINGS.stepMs
  );

  if (stepCount <= 0) {
    if (summary.wasCapped) {
      nachtRaidersState.expedition.lastSimulationAt =
        earliestCreditedTime;
    }

    summary.remainingMs =
      creditedElapsedMs;

    return summary;
  }

  const processedMs =
    stepCount *
    NACHT_RAIDERS_SIMULATION_SETTINGS.stepMs;

  nachtRaidersState.expedition.lastSimulationAt =
    earliestCreditedTime + processedMs;

  nachtRaidersState.statistics.totalSimulationMs +=
    processedMs;

  const travelResult =
    advanceNachtRaidersTravel(
      nachtRaidersState,
      stepCount
    );

  const incidentResult =
    generateNachtRaidersTravelIncidents(
      nachtRaidersState,
      {
         completedDepthCount:
          travelResult.depthGained,

        startingZoneDepth:
          travelResult.startingZoneDepth,

        startTime:
          earliestCreditedTime,

        endTime:
          nachtRaidersState.expedition
            .lastSimulationAt
      }
    );

  summary.processedMs = processedMs;
  summary.remainingMs =
    normalizedCurrentTime -
    nachtRaidersState.expedition.lastSimulationAt;

  summary.stepCount = stepCount;
  summary.distanceTravelled =
    travelResult.distanceTravelled;
   
  summary.depthGained =
    travelResult.depthGained;

  summary.incidentsGenerated =
    incidentResult.incidentsGenerated;

  summary.levelsGained =
    incidentResult.levelsGained;

  summary.rewards = {
    ...incidentResult.rewards
  };

  document.dispatchEvent(
    new CustomEvent(
      "nacht-raiders:simulation-completed",
      {
        detail: {
          ...summary
        }
      }
    )
  );

  return summary;
}

/* ==========================================================
   5. ACTIVE SIMULATION LOOP
   ----------------------------------------------------------
   Polls once per second while the page is active. Progress is
   still resolved only in fixed ten-second simulation steps.
========================================================== */

function startNachtRaidersSimulationLoop() {
  if (nachtRaidersSimulationIntervalId !== null) {
    return false;
  }

  nachtRaidersSimulationIntervalId =
    window.setInterval(
      () => {
        simulateNachtRaidersToTime(
          Date.now(),
          "active"
        );
      },
      NACHT_RAIDERS_SIMULATION_SETTINGS.activePollMs
    );

  return true;
}

function initializeNachtRaidersSimulation() {
  if (nachtRaidersSimulationInitialized) {
    return null;
  }

  nachtRaidersSimulationInitialized = true;

  const initialSummary =
    simulateNachtRaidersToTime(
      Date.now(),
      "initial-load"
    );

  startNachtRaidersSimulationLoop();

  return initialSummary;
}

/* ==========================================================
   6. PAGE-LIFECYCLE INTEGRATION
   ----------------------------------------------------------
   Captures progress before suspension and processes elapsed
   time when the browser becomes visible again.
========================================================== */

document.addEventListener(
  "visibilitychange",
  () => {
    const source =
      document.visibilityState === "hidden"
        ? "visibility-hidden"
        : "visibility-return";

    const summary =
      simulateNachtRaidersToTime(
        Date.now(),
        source
      );

    if (
      document.visibilityState === "visible" &&
      summary.processedMs > 0
    ) {
      saveGame();
    }
  }
);

window.addEventListener(
  "pagehide",
  () => {
    simulateNachtRaidersToTime(
      Date.now(),
      "pagehide"
    );
  }
);

window.addEventListener(
  "beforeunload",
  () => {
    simulateNachtRaidersToTime(
      Date.now(),
      "beforeunload"
    );
  }
);
