/* ==========================================================
   1. SIMULATION RUNTIME STATE
========================================================== */

let nachtRaidersSimulationInitialized = false;
let nachtRaidersSimulationIntervalId = null;

/* ==========================================================
   2. SIMULATION SUMMARY
========================================================== */

function createNachtRaidersSimulationSummary(currentTime, source) {
  return {
    source,
    currentTime,

    elapsedMs: 0,
    processedMs: 0,
    remainingMs: 0,

    stepCount: 0,
    distanceTravelled: 0,
    depthGained: 0,
    endingZoneDepth: 0,

    incidentsGenerated: 0,

    encounterRolls: 0,
    encountersGenerated: 0,
    victories: 0,
    deaths: 0,
    stalemates: 0,

    levelsGained: 0,
    reportsCreated: 0,

    rewards: createEmptyNachtRaidersRewards(),
    lastEncounter: null,
    presentationEvents: [],

    wasCapped: false
  };
}

/* ==========================================================
   3. TRAVEL ADVANCEMENT
   ----------------------------------------------------------
   Calculates every completed depth without immediately changing
   zone depth. Depth events can therefore be processed in order,
   including deaths that reset the expedition.
========================================================== */

function advanceNachtRaidersTravel(
  nachtRaidersState,
  stepCount
) {
  const unitsPerStep =
    NACHT_RAIDERS_TRAVEL_SETTINGS.unitsPerStep;

  const unitsPerDepth =
    NACHT_RAIDERS_TRAVEL_SETTINGS.unitsPerDepth;

  const startingTravelProgress =
    nachtRaidersState.expedition.travelProgress;

  const distanceTravelled =
    stepCount * unitsPerStep;

  const depthCompletionStepOffsets = [];

  let travelProgress =
    startingTravelProgress;

  for (
    let stepIndex = 1;
    stepIndex <= stepCount;
    stepIndex += 1
  ) {
    travelProgress += unitsPerStep;

    while (travelProgress >= unitsPerDepth) {
      travelProgress -= unitsPerDepth;
      depthCompletionStepOffsets.push(stepIndex);
    }
  }

  nachtRaidersState.statistics.distanceTravelled +=
    distanceTravelled;

  return {
    startingTravelProgress,
    endingTravelProgress: travelProgress,
    distanceTravelled,
    completedDepthCount:
      depthCompletionStepOffsets.length,
    depthCompletionStepOffsets
  };
}

/* ==========================================================
   4. DEPTH EVENT PROCESSING
   ----------------------------------------------------------
   Processes each completed depth chronologically. Incidents and
   encounters share the same authoritative travel timeline.
========================================================== */

function processNachtRaidersCompletedDepths(
  nachtRaidersState,
  travelResult,
  startTime,
  endTime,
  source
) {
  const result = {
    incidentsGenerated: 0,

    encounterRolls: 0,
    encountersGenerated: 0,
    victories: 0,
    deaths: 0,
    stalemates: 0,

    levelsGained: 0,
    reportsCreated: 0,

    rewards: createEmptyNachtRaidersRewards(),
    lastEncounter: null,
    presentationEvents: []
  };

  for (
    const stepOffset of
    travelResult.depthCompletionStepOffsets
  ) {
    nachtRaidersState.expedition.zoneDepth += 1;

    const zoneDepth =
      nachtRaidersState.expedition.zoneDepth;

    const occurredAt = Math.min(
      endTime,
      startTime +
        stepOffset *
        NACHT_RAIDERS_SIMULATION_SETTINGS.stepMs
    );

    const incidentResult =
      generateNachtRaidersTravelIncidents(
        nachtRaidersState,
        {
          completedDepthCount: 1,
          startingZoneDepth: zoneDepth - 1,
          startTime: occurredAt,
          endTime: occurredAt,
          source
        }
      );

    result.incidentsGenerated +=
      incidentResult.incidentsGenerated;

    result.levelsGained +=
      incidentResult.levelsGained;

    result.reportsCreated +=
      incidentResult.reportsCreated;

    combineNachtRaidersRewards(
      result.rewards,
      incidentResult.rewards
    );

   for (const record of incidentResult.records || []) {
      appendNachtRaidersPresentationEvent(
        result.presentationEvents,
        createNachtRaidersIncidentPresentationEvent(record)
      );
    }

    const encounterResult =
      generateNachtRaidersEncounter(
        nachtRaidersState,
        {
          zoneDepth,
          occurredAt,
          source
        }
      );

    result.encounterRolls +=
      encounterResult.encounterRolls;

    result.encountersGenerated +=
      encounterResult.encountersGenerated;

    result.victories +=
      encounterResult.victories;

    result.deaths +=
      encounterResult.deaths;

    result.stalemates +=
      encounterResult.stalemates;

    result.levelsGained +=
      encounterResult.levelsGained;

    result.reportsCreated +=
      encounterResult.reportsCreated;

    combineNachtRaidersRewards(
      result.rewards,
      encounterResult.rewards
    );

   if (encounterResult.lastEncounter) {
      result.lastEncounter =
        encounterResult.lastEncounter;

      appendNachtRaidersPresentationEvent(
        result.presentationEvents,
        createNachtRaidersCombatPresentationEvent(
          encounterResult.lastEncounter,
          occurredAt
        )
      );
    }
  }

  nachtRaidersState.expedition.travelProgress =
    travelResult.endingTravelProgress;

  return result;
}

/* ==========================================================
   5. ELAPSED-TIME SIMULATION
========================================================== */

function simulateNachtRaidersToTime(
  currentTime = Date.now(),
  source = "manual"
) {
  const normalizedCurrentTime =
    Math.floor(Number(currentTime));

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

  const savedSimulationTime =
    Number(
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

  const elapsedMs =
    Math.max(
      0,
      normalizedCurrentTime -
        savedSimulationTime
    );

  summary.elapsedMs = elapsedMs;

  if (elapsedMs <= 0) {
    return summary;
  }

  const earliestCreditedTime =
    Math.max(
      savedSimulationTime,
      normalizedCurrentTime -
        NACHT_RAIDERS_SIMULATION_SETTINGS
          .maximumOfflineMs
    );

  summary.wasCapped =
    earliestCreditedTime >
    savedSimulationTime;

  const creditedElapsedMs =
    normalizedCurrentTime -
    earliestCreditedTime;

  const stepCount =
    Math.floor(
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
    earliestCreditedTime +
    processedMs;

  nachtRaidersState.statistics.totalSimulationMs +=
    processedMs;

  const travelResult =
    advanceNachtRaidersTravel(
      nachtRaidersState,
      stepCount
    );

  const depthResult =
    processNachtRaidersCompletedDepths(
      nachtRaidersState,
      travelResult,
      earliestCreditedTime,
      nachtRaidersState.expedition.lastSimulationAt,
      source
    );

  summary.processedMs =
    processedMs;

  summary.remainingMs =
    normalizedCurrentTime -
    nachtRaidersState.expedition.lastSimulationAt;

  summary.stepCount =
    stepCount;

  summary.distanceTravelled =
    travelResult.distanceTravelled;

  summary.depthGained =
    travelResult.completedDepthCount;

  summary.endingZoneDepth =
    nachtRaidersState.expedition.zoneDepth;

  summary.incidentsGenerated =
    depthResult.incidentsGenerated;

  summary.encounterRolls =
    depthResult.encounterRolls;

  summary.encountersGenerated =
    depthResult.encountersGenerated;

  summary.victories =
    depthResult.victories;

  summary.deaths =
    depthResult.deaths;

  summary.stalemates =
    depthResult.stalemates;

  summary.levelsGained =
    depthResult.levelsGained;

  summary.rewards = {
    ...depthResult.rewards
  };

  summary.lastEncounter =
    depthResult.lastEncounter;


  summary.presentationEvents = [
    ...depthResult.presentationEvents
  ];
	
  const shouldFinalizePartialReport =
    source ===
      NACHT_RAIDERS_REPORT_REASON_INITIAL_LOAD ||
    source ===
      NACHT_RAIDERS_REPORT_REASON_VISIBILITY_RETURN;

  const reportResult =
    finalizeNachtRaidersPendingReports(
      nachtRaidersState,
      {
        force:
          shouldFinalizePartialReport,

        reason:
          source,

        createdAt:
          normalizedCurrentTime
      }
    );

  summary.reportsCreated =
    depthResult.reportsCreated +
    reportResult.reportsCreated;

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
   6. ACTIVE SIMULATION LOOP
========================================================== */

function startNachtRaidersSimulationLoop() {
  if (
    nachtRaidersSimulationIntervalId !==
    null
  ) {
    return false;
  }

  nachtRaidersSimulationIntervalId =
    window.setInterval(
      () => {
        simulateNachtRaidersToTime(
          Date.now(),
          NACHT_RAIDERS_REPORT_REASON_ACTIVE
        );
      },
      NACHT_RAIDERS_SIMULATION_SETTINGS
        .activePollMs
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
      NACHT_RAIDERS_REPORT_REASON_INITIAL_LOAD
    );

  startNachtRaidersSimulationLoop();

  return initialSummary;
}

/* ==========================================================
   7. PAGE-LIFECYCLE INTEGRATION
========================================================== */

document.addEventListener(
  "visibilitychange",
  () => {
    const source =
      document.visibilityState === "hidden"
        ? "visibility-hidden"
        : NACHT_RAIDERS_REPORT_REASON_VISIBILITY_RETURN;

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
