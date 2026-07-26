/* ==========================================================
   1. ENEMY ELIGIBILITY
========================================================== */

function isNachtRaidersEnemyEligible(nachtRaidersState, enemy, zoneDepth) {
  if (!enemy) return false;
  if (enemy.weight <= 0) return false;
  if (zoneDepth < NACHT_RAIDERS_ENCOUNTER_SETTINGS.minimumEncounterDepth) return false;
  if (zoneDepth < enemy.minimumDepth || zoneDepth > enemy.maximumDepth) return false;
  if (nachtRaidersState.cycleCount < enemy.minimumCycle) return false;
  if (nachtRaidersState.cycleCount > enemy.maximumCycle) return false;

  if (
    enemy.zoneIds.length > 0 &&
    !enemy.zoneIds.includes(nachtRaidersState.expedition.zoneId)
  ) {
    return false;
  }

  return true;
}

function getEligibleNachtRaidersEnemies(nachtRaidersState, zoneDepth) {
  return getNachtRaidersEnemyDefinitions().filter(
    (enemy) => isNachtRaidersEnemyEligible(
      nachtRaidersState,
      enemy,
      zoneDepth
    )
  );
}

/* ==========================================================
   2. WEIGHTED ENEMY SELECTION
========================================================== */

function selectNachtRaidersEnemy(nachtRaidersState, zoneDepth) {
  const eligibleEnemies = getEligibleNachtRaidersEnemies(
    nachtRaidersState,
    zoneDepth
  );

  const totalWeight = eligibleEnemies.reduce(
    (accumulatedWeight, enemy) => accumulatedWeight + enemy.weight,
    0
  );

  if (totalWeight <= 0) return null;

  let remainingRoll = getNextNachtRaidersRandom(nachtRaidersState) * totalWeight;

  for (const enemy of eligibleEnemies) {
    remainingRoll -= enemy.weight;

    if (remainingRoll < 0) {
      return enemy;
    }
  }

  return eligibleEnemies.at(-1) || null;
}

/* ==========================================================
   3. OPERATIVE COMBAT STATISTICS
========================================================== */

function createNachtRaidersOperativeCombatStats(nachtRaidersState) {
  const operative = nachtRaidersState.operative;
  const levelIndex = Math.max(0, normalizeNachtRaidersInteger(operative.level, 1) - 1);

  const speedBonus = Math.min(
    NACHT_RAIDERS_COMBAT_SETTINGS.operativeMaximumSpeedBonus,
    levelIndex * NACHT_RAIDERS_COMBAT_SETTINGS.operativeSpeedPerLevel
  );

  return {
    actor: NACHT_RAIDERS_COMBAT_ACTOR_OPERATIVE,
    id: "operative",
    name: "OPERATIVE",

    maxHealth: Math.max(1, normalizeNachtRaidersNumber(operative.maxHealth, 100)),
    health: Math.max(
      0,
      Math.min(
        normalizeNachtRaidersNumber(operative.maxHealth, 100),
        normalizeNachtRaidersNumber(operative.health, operative.maxHealth)
      )
    ),

    attack:
      Math.max(1, normalizeNachtRaidersNumber(operative.attack, 10)) +
      levelIndex * NACHT_RAIDERS_COMBAT_SETTINGS.operativeAttackPerLevel,

    defense:
      normalizeNachtRaidersNumber(operative.defense, 2) +
      Math.floor(
        levelIndex /
        NACHT_RAIDERS_COMBAT_SETTINGS.operativeDefenseLevelsPerPoint
      ),

    speed:
      Math.max(0.1, normalizeNachtRaidersNumber(operative.speed, 1)) +
      speedBonus
  };
}

/* ==========================================================
   4. ENEMY COMBAT STATISTICS
========================================================== */

function createNachtRaidersEnemyCombatStats(
  nachtRaidersState,
  enemy,
  zoneDepth
) {
  const normalizedDepth = Math.max(0, normalizeNachtRaidersInteger(zoneDepth));
  const normalizedCycle = Math.max(0, normalizeNachtRaidersInteger(nachtRaidersState.cycleCount));

  const healthMultiplier =
    1 +
    normalizedDepth * NACHT_RAIDERS_COMBAT_SETTINGS.enemyHealthPerDepth +
    normalizedCycle * NACHT_RAIDERS_COMBAT_SETTINGS.enemyHealthPerCycle;

  const attackMultiplier =
    1 +
    normalizedDepth * NACHT_RAIDERS_COMBAT_SETTINGS.enemyAttackPerDepth +
    normalizedCycle * NACHT_RAIDERS_COMBAT_SETTINGS.enemyAttackPerCycle;

  const defenseMultiplier =
    1 +
    normalizedDepth * NACHT_RAIDERS_COMBAT_SETTINGS.enemyDefensePerDepth +
    normalizedCycle * NACHT_RAIDERS_COMBAT_SETTINGS.enemyDefensePerCycle;

  const uncappedSpeedMultiplier =
    1 +
    normalizedDepth * NACHT_RAIDERS_COMBAT_SETTINGS.enemySpeedPerDepth +
    normalizedCycle * NACHT_RAIDERS_COMBAT_SETTINGS.enemySpeedPerCycle;

  const speedMultiplier = Math.min(
    NACHT_RAIDERS_COMBAT_SETTINGS.enemyMaximumSpeedMultiplier,
    uncappedSpeedMultiplier
  );

  const maxHealth = Math.max(
    1,
    Math.round(enemy.stats.maxHealth * healthMultiplier)
  );

  return {
    actor: NACHT_RAIDERS_COMBAT_ACTOR_ENEMY,
    id: enemy.id,
    name: enemy.name,
    designation: enemy.designation,
    assetKey: enemy.assetKey,

    maxHealth,
    health: maxHealth,

    attack: Math.max(
      1,
      Math.round(enemy.stats.attack * attackMultiplier)
    ),

    defense: Math.max(
      0,
      Math.round(enemy.stats.defense * defenseMultiplier)
    ),

    speed: Math.max(
      0.1,
      enemy.stats.speed * speedMultiplier
    )
  };
}

/* ==========================================================
   5. DAMAGE RESOLUTION
========================================================== */

function rollNachtRaidersCombatDamage(
  nachtRaidersState,
  attacker,
  defender
) {
  const baseDamage = Math.max(
    NACHT_RAIDERS_COMBAT_SETTINGS.minimumDamage,
    attacker.attack - defender.defense
  );

  const variance = rollNachtRaidersDecimal(
    nachtRaidersState,
    NACHT_RAIDERS_COMBAT_SETTINGS.damageVarianceMinimum,
    NACHT_RAIDERS_COMBAT_SETTINGS.damageVarianceMaximum
  );

  return Math.max(
    NACHT_RAIDERS_COMBAT_SETTINGS.minimumDamage,
    Math.round(baseDamage * variance)
  );
}

/* ==========================================================
   6. COMBAT ACTION CREATION
========================================================== */

function createNachtRaidersCombatAction(
  sequence,
  occurredAtSeconds,
  attacker,
  defender,
  damage
) {
  return {
    sequence,
    occurredAtMs: Math.round(occurredAtSeconds * 1000),
    actor: attacker.actor,
    actorId: attacker.id,
    target: defender.actor,
    targetId: defender.id,
    damage,
    targetHealth: defender.health
  };
}

/* ==========================================================
   7. COMBAT RESOLUTION
   ----------------------------------------------------------
   Actions are scheduled according to combatant speed. Faster
   combatants can act more frequently. The complete action list
   can later drive sprite animation without recalculating combat.
========================================================== */

function resolveNachtRaidersCombat(
  nachtRaidersState,
  enemy,
  zoneDepth
) {
  if (!enemy) return null;

  const operative = createNachtRaidersOperativeCombatStats(nachtRaidersState);
  const hostile = createNachtRaidersEnemyCombatStats(
    nachtRaidersState,
    enemy,
    zoneDepth
  );

  const operativeStartingHealth = operative.health;
  const enemyStartingHealth = hostile.health;

  const operativeActionInterval = 1 / operative.speed;
  const enemyActionInterval = 1 / hostile.speed;

  let operativeNextActionAt = operativeActionInterval;
  let enemyNextActionAt = enemyActionInterval;

  let damageDealt = 0;
  let damageTaken = 0;

  const actions = [];

  while (
    operative.health > 0 &&
    hostile.health > 0 &&
    actions.length < NACHT_RAIDERS_COMBAT_SETTINGS.maximumActions
  ) {
    const operativeActsNext = operativeNextActionAt <= enemyNextActionAt;

    const attacker = operativeActsNext
      ? operative
      : hostile;

    const defender = operativeActsNext
      ? hostile
      : operative;

    const occurredAtSeconds = operativeActsNext
      ? operativeNextActionAt
      : enemyNextActionAt;

    const damage = rollNachtRaidersCombatDamage(
      nachtRaidersState,
      attacker,
      defender
    );

    defender.health = Math.max(0, defender.health - damage);

    if (operativeActsNext) {
      damageDealt += damage;
      operativeNextActionAt += operativeActionInterval;
    } else {
      damageTaken += damage;
      enemyNextActionAt += enemyActionInterval;
    }

    actions.push(
      createNachtRaidersCombatAction(
        actions.length + 1,
        occurredAtSeconds,
        attacker,
        defender,
        damage
      )
    );
  }

  let outcome = NACHT_RAIDERS_COMBAT_OUTCOME_STALEMATE;

  if (hostile.health <= 0) {
    outcome = NACHT_RAIDERS_COMBAT_OUTCOME_VICTORY;
  } else if (operative.health <= 0) {
    outcome = NACHT_RAIDERS_COMBAT_OUTCOME_OPERATIVE_DEATH;
  }

  const finalAction = actions.at(-1) || null;

  return {
    outcome,
    zoneId: nachtRaidersState.expedition.zoneId,
    zoneDepth: Math.max(0, normalizeNachtRaidersInteger(zoneDepth)),
    cycle: nachtRaidersState.cycleCount,

    actionCount: actions.length,
    durationMs: finalAction?.occurredAtMs || 0,

    damageDealt,
    damageTaken,

    operative: {
      id: operative.id,
      name: operative.name,
      startingHealth: operativeStartingHealth,
      endingHealth: operative.health,
      maxHealth: operative.maxHealth,
      attack: operative.attack,
      defense: operative.defense,
      speed: operative.speed
    },

    enemy: {
      id: hostile.id,
      name: hostile.name,
      designation: hostile.designation,
      assetKey: hostile.assetKey,
      startingHealth: enemyStartingHealth,
      endingHealth: hostile.health,
      maxHealth: hostile.maxHealth,
      attack: hostile.attack,
      defense: hostile.defense,
      speed: hostile.speed
    },

    actions
  };
}
