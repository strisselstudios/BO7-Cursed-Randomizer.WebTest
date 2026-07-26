/* ==========================================================
   1. ENEMY REWARDS
========================================================== */

function rollNachtRaidersEnemyRewards(nachtRaidersState, enemy) {
  const rewards = createEmptyNachtRaidersRewards();

  for (const rewardKey of NACHT_RAIDERS_REWARD_KEYS) {
    const rewardRange = enemy.rewards?.[rewardKey];

    if (!rewardRange) continue;

    rewards[rewardKey] = rollNachtRaidersInteger(
      nachtRaidersState,
      rewardRange.minimum,
      rewardRange.maximum
    );
  }

  return rewards;
}

/* ==========================================================
   2. COMBAT PRESENTATION
========================================================== */

function createNachtRaidersCombatPresentation(
  enemy,
  combatResult,
  reconstructedCycle
) {
  const lines = [
    ...enemy.contactLines,
    "Engaged in combat."
  ];

  if (combatResult.outcome === NACHT_RAIDERS_COMBAT_OUTCOME_VICTORY) {
    lines.push(
      ...enemy.victoryLines,
      ">> TARGET TERMINATED",
      `>> DAMAGE DEALT: ${combatResult.damageDealt}`,
      `>> DAMAGE SUSTAINED: ${combatResult.damageTaken}`
    );
  } else if (
    combatResult.outcome ===
    NACHT_RAIDERS_COMBAT_OUTCOME_OPERATIVE_DEATH
  ) {
    lines.push(
      ...enemy.operativeDeathLines,
      `>> DAMAGE DEALT: ${combatResult.damageDealt}`,
      `>> DAMAGE SUSTAINED: ${combatResult.damageTaken}`,
      ">> ECHO INTEGRITY LOST",
      ">> TEMPORAL ANCHOR REACQUIRED",
      ">> OPERATIVE RECONSTRUCTED",
      `>> CYCLE COUNT: ${reconstructedCycle}`
    );
  } else {
    lines.push(
      "Engagement exceeded operational limits.",
      ">> CONTACT DISENGAGED",
      `>> DAMAGE DEALT: ${combatResult.damageDealt}`,
      `>> DAMAGE SUSTAINED: ${combatResult.damageTaken}`
    );
  }

  return {
    title: `HOSTILE CONTACT: ${enemy.designation}`,
    lines
  };
}

/* ==========================================================
   3. COMBAT FIELD RECORDS
========================================================== */

function createNachtRaidersCombatRecord(
  nachtRaidersState,
  enemy,
  combatResult,
  occurredAt,
  source,
  rewards,
  reconstructedCycle
) {
  nachtRaidersState.expedition.eventSequence += 1;

  const eventSequence = nachtRaidersState.expedition.eventSequence;
  const presentation = createNachtRaidersCombatPresentation(
    enemy,
    combatResult,
    reconstructedCycle
  );

  return {
    recordId: `NR-${String(eventSequence).padStart(8, "0")}`,
    sequence: eventSequence,
    occurredAt: Math.max(0, Math.floor(Number(occurredAt) || Date.now())),
    cycle: combatResult.cycle,
    zoneId: combatResult.zoneId,
    zoneDepth: combatResult.zoneDepth,
    eventType: NACHT_RAIDERS_RECORD_TYPE_COMBAT,
    eventId: `combat-${enemy.id}-${combatResult.outcome}`,
    source: typeof source === "string" && source ? source : "simulation",

    presentation,

    tags: [
      NACHT_RAIDERS_COMBAT_RECORD_TAG,
      combatResult.outcome,
      ...enemy.tags
    ],

    rewards: {
      ...rewards
    },

    combat: {
      outcome: combatResult.outcome,
      enemyId: enemy.id,
      enemyName: enemy.name,
      enemyDesignation: enemy.designation,
      assetKey: enemy.assetKey,

      actionCount: combatResult.actionCount,
      durationMs: combatResult.durationMs,

      damageDealt: combatResult.damageDealt,
      damageTaken: combatResult.damageTaken,

      operativeStartingHealth:
        combatResult.operative.startingHealth,

      operativeEndingHealth:
        combatResult.operative.endingHealth,

      operativeMaximumHealth:
        combatResult.operative.maxHealth,

      enemyStartingHealth:
        combatResult.enemy.startingHealth,

      enemyEndingHealth:
        combatResult.enemy.endingHealth,

      enemyMaximumHealth:
        combatResult.enemy.maxHealth
    }
  };
}

/* ==========================================================
   4. COMBAT OUTCOME APPLICATION
========================================================== */

function applyNachtRaidersCombatOutcome(
  nachtRaidersState,
  enemy,
  combatResult
) {
  const result = {
    rewards: createEmptyNachtRaidersRewards(),
    levelsGained: 0,
    reconstructedCycle: nachtRaidersState.cycleCount
  };

  nachtRaidersState.statistics.encounters += 1;
  nachtRaidersState.statistics.damageDealt += combatResult.damageDealt;
  nachtRaidersState.statistics.damageTaken += combatResult.damageTaken;

  nachtRaidersState.operative.health = Math.max(
    0,
    combatResult.operative.endingHealth
  );

  if (combatResult.outcome === NACHT_RAIDERS_COMBAT_OUTCOME_VICTORY) {
    nachtRaidersState.statistics.victories += 1;

    result.rewards = rollNachtRaidersEnemyRewards(
      nachtRaidersState,
      enemy
    );

    const levelResult = applyNachtRaidersIncidentRewards(
      nachtRaidersState,
      result.rewards
    );

    result.levelsGained = levelResult.levelsGained;

    return result;
  }

  if (
    combatResult.outcome ===
    NACHT_RAIDERS_COMBAT_OUTCOME_OPERATIVE_DEATH
  ) {
    nachtRaidersState.statistics.deaths += 1;
    nachtRaidersState.statistics.reconstructions += 1;

    nachtRaidersState.cycleCount += 1;
    result.reconstructedCycle = nachtRaidersState.cycleCount;

    nachtRaidersState.expedition.zoneDepth = 0;
    nachtRaidersState.expedition.travelProgress = 0;
    nachtRaidersState.expedition.currentEncounter = null;

    nachtRaidersState.operative.health =
      nachtRaidersState.operative.maxHealth;

    return result;
  }

  nachtRaidersState.statistics.stalemates += 1;

  return result;
}

/* ==========================================================
   5. ENCOUNTER RESULT
========================================================== */

function createEmptyNachtRaidersEncounterResult() {
  return {
    encounterRolls: 0,
    encountersGenerated: 0,
    victories: 0,
    deaths: 0,
    stalemates: 0,
    levelsGained: 0,
    reportsCreated: 0,
    rewards: createEmptyNachtRaidersRewards(),
    lastEncounter: null
  };
}

/* ==========================================================
   6. ENCOUNTER GENERATION
   ----------------------------------------------------------
   Supports ordinary random encounters and forced encounters
   for future bosses, scripted events, and debugging.
========================================================== */

function generateNachtRaidersEncounter(
  nachtRaidersState,
  options = {}
) {
  const result = createEmptyNachtRaidersEncounterResult();

  const zoneDepth = Math.max(
    0,
    Math.floor(Number(options.zoneDepth) || 0)
  );

  const occurredAt = Math.max(
    0,
    Math.floor(Number(options.occurredAt) || Date.now())
  );

  const source =
    typeof options.source === "string" && options.source
      ? options.source
      : NACHT_RAIDERS_REPORT_REASON_ACTIVE;

  const forceEncounter = options.force === true;

  if (
    zoneDepth <
    NACHT_RAIDERS_ENCOUNTER_SETTINGS.minimumEncounterDepth
  ) {
    return result;
  }

  const eligibleEnemies = getEligibleNachtRaidersEnemies(
    nachtRaidersState,
    zoneDepth
  );

  if (eligibleEnemies.length === 0) {
    return result;
  }

  result.encounterRolls = 1;

  if (
    !forceEncounter &&
    getNextNachtRaidersRandom(nachtRaidersState) >=
      NACHT_RAIDERS_ENCOUNTER_SETTINGS.chancePerCompletedDepth
  ) {
    return result;
  }

  let enemy = null;

  if (typeof options.enemyId === "string" && options.enemyId) {
    const requestedEnemy = getNachtRaidersEnemyDefinition(
      options.enemyId
    );

    enemy =
      requestedEnemy &&
      isNachtRaidersEnemyEligible(
        nachtRaidersState,
        requestedEnemy,
        zoneDepth
      )
        ? requestedEnemy
        : null;
  } else {
    enemy = selectNachtRaidersEnemy(
      nachtRaidersState,
      zoneDepth
    );
  }

  if (!enemy) {
    return result;
  }

  const combatResult = resolveNachtRaidersCombat(
    nachtRaidersState,
    enemy,
    zoneDepth
  );

  if (!combatResult) {
    return result;
  }

  nachtRaidersState.expedition.currentEncounter = {
    enemyId: enemy.id,
    zoneDepth,
    startedAt: occurredAt,
    outcome: combatResult.outcome
  };

  const outcomeResult = applyNachtRaidersCombatOutcome(
    nachtRaidersState,
    enemy,
    combatResult
  );

  const record = createNachtRaidersCombatRecord(
    nachtRaidersState,
    enemy,
    combatResult,
    occurredAt,
    source,
    outcomeResult.rewards,
    outcomeResult.reconstructedCycle
  );

  appendNachtRaidersPendingRecord(
    nachtRaidersState,
    record
  );

  const reportResult = finalizeNachtRaidersPendingReports(
    nachtRaidersState,
    {
      force: false,
      reason: source,
      createdAt: occurredAt
    }
  );

  nachtRaidersState.expedition.currentEncounter = null;

  result.encountersGenerated = 1;
  result.levelsGained = outcomeResult.levelsGained;
  result.reportsCreated = reportResult.reportsCreated;
  result.rewards = {
    ...outcomeResult.rewards
  };

  result.victories =
    combatResult.outcome ===
    NACHT_RAIDERS_COMBAT_OUTCOME_VICTORY
      ? 1
      : 0;

  result.deaths =
    combatResult.outcome ===
    NACHT_RAIDERS_COMBAT_OUTCOME_OPERATIVE_DEATH
      ? 1
      : 0;

  result.stalemates =
    combatResult.outcome ===
    NACHT_RAIDERS_COMBAT_OUTCOME_STALEMATE
      ? 1
      : 0;

  result.lastEncounter = combatResult;

  return result;
}
