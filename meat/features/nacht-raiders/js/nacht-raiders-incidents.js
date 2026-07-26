/* ==========================================================
   1. DETERMINISTIC RANDOM GENERATOR
   ----------------------------------------------------------
   The generator state is saved with the expedition. Active and
   offline simulation therefore use the same random sequence.
========================================================== */

function getNextNachtRaidersRandom(nachtRaidersState) {
  const currentState = normalizeNachtRaidersInteger(
    nachtRaidersState.expedition.rngState,
    nachtRaidersState.expedition.seed
  ) || 1;

  const nextState = (
    Math.imul(currentState, 1664525) +
    1013904223
  ) >>> 0;

  nachtRaidersState.expedition.rngState = nextState || 1;

  return nextState / 4294967296;
}

function rollNachtRaidersInteger(nachtRaidersState, minimum, maximum) {
  const normalizedMinimum = Math.ceil(Number(minimum) || 0);
  const normalizedMaximum = Math.max(
    normalizedMinimum,
    Math.floor(Number(maximum) || normalizedMinimum)
  );

  const range = normalizedMaximum - normalizedMinimum + 1;

  return normalizedMinimum + Math.floor(
    getNextNachtRaidersRandom(nachtRaidersState) * range
  );
}

/* ==========================================================
   2. INCIDENT ELIGIBILITY AND WEIGHTED SELECTION
========================================================== */

function isNachtRaidersTravelIncidentEligible(nachtRaidersState, incident, zoneDepth) {
  if (incident.pool !== NACHT_RAIDERS_INCIDENT_POOL_TRAVEL) return false;
  if (zoneDepth < incident.minimumDepth || zoneDepth > incident.maximumDepth) return false;
  if (nachtRaidersState.cycleCount < incident.minimumCycle || nachtRaidersState.cycleCount > incident.maximumCycle) return false;

  if (
    incident.zoneIds.length > 0 &&
    !incident.zoneIds.includes(nachtRaidersState.expedition.zoneId)
  ) {
    return false;
  }

  if (
    incident.doctrines.length > 0 &&
    !incident.doctrines.includes(nachtRaidersState.doctrine)
  ) {
    return false;
  }

  return incident.weight > 0;
}

function selectNachtRaidersTravelIncident(nachtRaidersState, zoneDepth) {
  const eligibleIncidents = getNachtRaidersIncidentDefinitions(
    NACHT_RAIDERS_INCIDENT_POOL_TRAVEL
  ).filter((incident) =>
    isNachtRaidersTravelIncidentEligible(
      nachtRaidersState,
      incident,
      zoneDepth
    )
  );

  const totalWeight = eligibleIncidents.reduce(
    (accumulatedWeight, incident) => accumulatedWeight + incident.weight,
    0
  );

  if (totalWeight <= 0) return null;

  let remainingRoll = getNextNachtRaidersRandom(nachtRaidersState) * totalWeight;

  for (const incident of eligibleIncidents) {
    remainingRoll -= incident.weight;
    if (remainingRoll < 0) return incident;
  }

  return eligibleIncidents.at(-1) || null;
}

/* ==========================================================
   3. INCIDENT REWARDS
========================================================== */

function rollNachtRaidersIncidentRewards(nachtRaidersState, incident) {
  const rolledRewards = createEmptyNachtRaidersRewards();

  for (const rewardKey of NACHT_RAIDERS_REWARD_KEYS) {
    const rewardRange = incident.rewards?.[rewardKey];
    if (!rewardRange) continue;

    rolledRewards[rewardKey] = rollNachtRaidersInteger(
      nachtRaidersState,
      rewardRange.minimum,
      rewardRange.maximum
    );
  }

  return rolledRewards;
}

function applyNachtRaidersRewardValue(nachtRaidersState, rewardKey, rewardAmount) {
  const definition = getNachtRaidersRewardDefinition(rewardKey);
  if (!definition) return false;

  const targetState = nachtRaidersState[definition.target];

  if (!targetState || typeof targetState !== "object" || Array.isArray(targetState)) {
    return false;
  }

  const normalizedAmount = Math.max(0, Math.floor(Number(rewardAmount) || 0));
  const currentValue = Math.max(0, Number(targetState[definition.property]) || 0);

  targetState[definition.property] = currentValue + normalizedAmount;

  return true;
}

function applyNachtRaidersIncidentRewards(nachtRaidersState, rewards) {
  for (const rewardKey of NACHT_RAIDERS_REWARD_KEYS) {
    applyNachtRaidersRewardValue(
      nachtRaidersState,
      rewardKey,
      rewards[rewardKey]
    );
  }

  return synchronizeNachtRaidersOperativeLevel(nachtRaidersState);
}

function combineNachtRaidersRewards(totalRewards, addedRewards) {
  for (const rewardKey of NACHT_RAIDERS_REWARD_KEYS) {
    totalRewards[rewardKey] =
      Math.max(0, Number(totalRewards[rewardKey]) || 0) +
      Math.max(0, Number(addedRewards[rewardKey]) || 0);
  }

  return totalRewards;
}

/* ==========================================================
   4. FIELD RECORD CREATION
========================================================== */

function createNachtRaidersIncidentRecord(
  nachtRaidersState,
  incident,
  zoneDepth,
  occurredAt,
  rewards,
  source
) {
  nachtRaidersState.expedition.eventSequence += 1;

  const eventSequence = nachtRaidersState.expedition.eventSequence;

  return {
    recordId: `NR-${String(eventSequence).padStart(8, "0")}`,
    sequence: eventSequence,
    occurredAt: Math.max(0, Math.floor(Number(occurredAt) || Date.now())),
    cycle: nachtRaidersState.cycleCount,
    zoneId: nachtRaidersState.expedition.zoneId,
    zoneDepth: Math.max(0, Math.floor(Number(zoneDepth) || 0)),
    eventType: incident.type,
    eventId: incident.id,
    source: typeof source === "string" && source ? source : "simulation",

    presentation: {
      title: incident.title,
      lines: [...incident.lines]
    },

    tags: [...incident.tags],

    rewards: {
      ...rewards
    }
  };
}

function appendNachtRaidersPendingRecord(nachtRaidersState, record) {
  const pendingEntries = nachtRaidersState.fieldRecords.pendingEntries;

  pendingEntries.push(record);

  const excessEntryCount = pendingEntries.length - NACHT_RAIDERS_PENDING_RECORD_LIMIT;

  if (excessEntryCount > 0) {
    pendingEntries.splice(0, excessEntryCount);
  }
}

/* ==========================================================
   5. TRAVEL INCIDENT GENERATION
   ----------------------------------------------------------
   Each completed depth performs one deterministic incident
   roll. The global chance determines whether an incident
   occurs. Eligible definitions then compete by weight.
========================================================== */

function generateNachtRaidersTravelIncidents(nachtRaidersState, options = {}) {
  const completedDepthCount = Math.max(
    0,
    Math.floor(Number(options.completedDepthCount ?? options.incidentCount) || 0)
  );

  const startingZoneDepth = Math.max(
    0,
    Math.floor(Number(options.startingZoneDepth) || 0)
  );

  const startTime = Math.max(
    0,
    Math.floor(Number(options.startTime) || 0)
  );

  const endTime = Math.max(
    startTime,
    Math.floor(Number(options.endTime) || startTime)
  );

  const source =
    typeof options.source === "string" && options.source
      ? options.source
      : NACHT_RAIDERS_REPORT_REASON_ACTIVE;

  const result = {
    incidentRolls: 0,
    incidentsGenerated: 0,
    levelsGained: 0,
    rewards: createEmptyNachtRaidersRewards()
  };

  if (completedDepthCount <= 0) return result;

  const timestampSpacing =
    (endTime - startTime) /
    (completedDepthCount + 1);

  for (let depthIndex = 0; depthIndex < completedDepthCount; depthIndex += 1) {
    const zoneDepth = startingZoneDepth + depthIndex + 1;

    result.incidentRolls += 1;

    const occurrenceRoll = getNextNachtRaidersRandom(nachtRaidersState);

    if (occurrenceRoll >= NACHT_RAIDERS_INCIDENT_SETTINGS.chancePerCompletedDepth) {
      continue;
    }

    const incident = selectNachtRaidersTravelIncident(
      nachtRaidersState,
      zoneDepth
    );

    if (!incident) continue;

    const rewards = rollNachtRaidersIncidentRewards(
      nachtRaidersState,
      incident
    );

    const levelResult = applyNachtRaidersIncidentRewards(
      nachtRaidersState,
      rewards
    );

    combineNachtRaidersRewards(result.rewards, rewards);

    const occurredAt = Math.floor(
      startTime + timestampSpacing * (depthIndex + 1)
    );

    const record = createNachtRaidersIncidentRecord(
      nachtRaidersState,
      incident,
      zoneDepth,
      occurredAt,
      rewards,
      source
    );

    appendNachtRaidersPendingRecord(nachtRaidersState, record);

    finalizeNachtRaidersPendingReports(
      nachtRaidersState,
      {
        force: false,
        reason: source || NACHT_RAIDERS_REPORT_REASON_AUTOMATIC_SEGMENT,
        createdAt: occurredAt
      }
    );

    result.incidentsGenerated += 1;
    result.levelsGained += levelResult.levelsGained;
  }

  return result;
}
