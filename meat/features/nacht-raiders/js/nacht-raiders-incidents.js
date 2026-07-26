/* ==========================================================
   1. DETERMINISTIC RANDOM GENERATOR
   ----------------------------------------------------------
   The generator state is saved with the expedition. Active and
   offline simulation therefore use the same random sequence.
========================================================== */

function getNextNachtRaidersRandom(
  nachtRaidersState
) {
  const currentState =
    normalizeNachtRaidersInteger(
      nachtRaidersState.expedition.rngState,
      nachtRaidersState.expedition.seed
    ) || 1;

  const nextState = (
    Math.imul(
      currentState,
      1664525
    ) +
    1013904223
  ) >>> 0;

  nachtRaidersState.expedition.rngState =
    nextState || 1;

  return nextState / 4294967296;
}

function rollNachtRaidersInteger(
  nachtRaidersState,
  minimum,
  maximum
) {
  const normalizedMinimum =
    Math.ceil(
      Number(minimum) || 0
    );

  const normalizedMaximum =
    Math.max(
      normalizedMinimum,
      Math.floor(
        Number(maximum) ||
        normalizedMinimum
      )
    );

  const range =
    normalizedMaximum -
    normalizedMinimum +
    1;

  return (
    normalizedMinimum +
    Math.floor(
      getNextNachtRaidersRandom(
        nachtRaidersState
      ) * range
    )
  );
}

/* ==========================================================
   2. WEIGHTED INCIDENT SELECTION
========================================================== */

function selectNachtRaidersTravelIncident(
  nachtRaidersState
) {
  const totalWeight =
    NACHT_RAIDERS_TRAVEL_INCIDENTS.reduce(
      (
        accumulatedWeight,
        incident
      ) =>
        accumulatedWeight +
        Math.max(
          0,
          Number(incident.weight) || 0
        ),
      0
    );

  if (totalWeight <= 0) {
    return null;
  }

  let remainingRoll =
    getNextNachtRaidersRandom(
      nachtRaidersState
    ) * totalWeight;

  for (
    const incident of
    NACHT_RAIDERS_TRAVEL_INCIDENTS
  ) {
    remainingRoll -= Math.max(
      0,
      Number(incident.weight) || 0
    );

    if (remainingRoll < 0) {
      return incident;
    }
  }

  return (
    NACHT_RAIDERS_TRAVEL_INCIDENTS.at(-1) ||
    null
  );
}

/* ==========================================================
   3. INCIDENT REWARDS
========================================================== */

function createEmptyNachtRaidersRewards() {
  return {
    xp: 0,
    salvage: 0,
    aetherResidue: 0,
    fieldData: 0,
    relicFragments: 0
  };
}

function rollNachtRaidersIncidentRewards(
  nachtRaidersState,
  incident
) {
  const rolledRewards =
    createEmptyNachtRaidersRewards();

  for (
    const rewardKey of
    NACHT_RAIDERS_REWARD_KEYS
  ) {
    const rewardRange =
      incident.rewards?.[rewardKey];

    if (!rewardRange) {
      continue;
    }

    rolledRewards[rewardKey] =
      rollNachtRaidersInteger(
        nachtRaidersState,
        rewardRange.minimum,
        rewardRange.maximum
      );
  }

  return rolledRewards;
}

function applyNachtRaidersIncidentRewards(
  nachtRaidersState,
  rewards
) {
  nachtRaidersState.operative.xp +=
    rewards.xp;

  nachtRaidersState.resources.salvage +=
    rewards.salvage;

  nachtRaidersState.resources
    .aetherResidue +=
      rewards.aetherResidue;

  nachtRaidersState.resources.fieldData +=
    rewards.fieldData;

  nachtRaidersState.resources
    .relicFragments +=
      rewards.relicFragments;
}

function combineNachtRaidersRewards(
  totalRewards,
  addedRewards
) {
  for (
    const rewardKey of
    NACHT_RAIDERS_REWARD_KEYS
  ) {
    totalRewards[rewardKey] +=
      addedRewards[rewardKey];
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
  rewards
) {
  nachtRaidersState.expedition.eventSequence +=
    1;

  const eventSequence =
    nachtRaidersState.expedition.eventSequence;

  return {
    recordId:
      `NR-${String(
        eventSequence
      ).padStart(
        8,
        "0"
      )}`,

    sequence:
      eventSequence,

    occurredAt:
      Math.max(
        0,
        Math.floor(
          Number(occurredAt) ||
          Date.now()
        )
      ),

    cycle:
      nachtRaidersState.cycleCount,

    zoneId:
      nachtRaidersState.expedition.zoneId,

    zoneDepth:
      Math.max(
        0,
        Math.floor(
          Number(zoneDepth) || 0
        )
      ),

    eventType:
      incident.type,

    eventId:
      incident.id,

    rewards: {
      ...rewards
    }
  };
}

function appendNachtRaidersPendingRecord(
  nachtRaidersState,
  record
) {
  const pendingEntries =
    nachtRaidersState.fieldRecords
      .pendingEntries;

  pendingEntries.push(record);

  const excessEntryCount =
    pendingEntries.length -
    NACHT_RAIDERS_PENDING_RECORD_LIMIT;

  if (excessEntryCount > 0) {
    pendingEntries.splice(
      0,
      excessEntryCount
    );
  }
}

/* ==========================================================
   5. TRAVEL INCIDENT GENERATION
   ----------------------------------------------------------
   One incident is generated for every newly completed depth.
   Incident timestamps are distributed across the processed
   simulation interval.
========================================================== */

function generateNachtRaidersTravelIncidents(
  nachtRaidersState,
  options = {}
) {
  const incidentCount = Math.max(
    0,
    Math.floor(
      Number(options.incidentCount) || 0
    )
  );

  const startingZoneDepth = Math.max(
    0,
    Math.floor(
      Number(options.startingZoneDepth) || 0
    )
  );

  const startTime = Math.max(
    0,
    Math.floor(
      Number(options.startTime) || 0
    )
  );

  const endTime = Math.max(
    startTime,
    Math.floor(
      Number(options.endTime) ||
      startTime
    )
  );

  const result = {
    incidentsGenerated: 0,
    rewards:
      createEmptyNachtRaidersRewards()
  };

  if (incidentCount <= 0) {
    return result;
  }

  const timestampSpacing =
    (
      endTime -
      startTime
    ) /
    (
      incidentCount +
      1
    );

  for (
    let incidentIndex = 0;
    incidentIndex < incidentCount;
    incidentIndex += 1
  ) {
    const incident =
      selectNachtRaidersTravelIncident(
        nachtRaidersState
      );

    if (!incident) {
      continue;
    }

    const rewards =
      rollNachtRaidersIncidentRewards(
        nachtRaidersState,
        incident
      );

    applyNachtRaidersIncidentRewards(
      nachtRaidersState,
      rewards
    );

    combineNachtRaidersRewards(
      result.rewards,
      rewards
    );

    const occurredAt = Math.floor(
      startTime +
      timestampSpacing *
        (
          incidentIndex +
          1
        )
    );

    const record =
      createNachtRaidersIncidentRecord(
        nachtRaidersState,
        incident,
        startingZoneDepth +
          incidentIndex +
          1,
        occurredAt,
        rewards
      );

    appendNachtRaidersPendingRecord(
      nachtRaidersState,
      record
    );

    result.incidentsGenerated += 1;
  }

  return result;
}
