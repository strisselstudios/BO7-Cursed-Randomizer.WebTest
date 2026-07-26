/* ==========================================================
   1. COMBAT OUTCOMES
========================================================== */

const NACHT_RAIDERS_COMBAT_OUTCOME_VICTORY = "victory";
const NACHT_RAIDERS_COMBAT_OUTCOME_OPERATIVE_DEATH = "operative-death";
const NACHT_RAIDERS_COMBAT_OUTCOME_STALEMATE = "stalemate";

/* ==========================================================
   2. COMBAT ACTORS
========================================================== */

const NACHT_RAIDERS_COMBAT_ACTOR_OPERATIVE = "operative";
const NACHT_RAIDERS_COMBAT_ACTOR_ENEMY = "enemy";

/* ==========================================================
   3. COMBAT FIELD RECORDS
========================================================== */

const NACHT_RAIDERS_RECORD_TYPE_COMBAT = "combat";
const NACHT_RAIDERS_COMBAT_RECORD_TAG = "hostile-contact";

/* ==========================================================
   4. COMBAT SETTINGS
   ----------------------------------------------------------
   Centralizes damage, action limits, level scaling, and enemy
   scaling. Future balancing should occur here.
========================================================== */

const NACHT_RAIDERS_COMBAT_SETTINGS = Object.freeze({
  minimumDamage: 1,
  maximumActions: 200,

  damageVarianceMinimum: 0.9,
  damageVarianceMaximum: 1.1,

  operativeAttackPerLevel: 1,
  operativeDefenseLevelsPerPoint: 5,
  operativeSpeedPerLevel: 0.01,
  operativeMaximumSpeedBonus: 0.5,

  enemyHealthPerDepth: 0.04,
  enemyAttackPerDepth: 0.025,
  enemyDefensePerDepth: 0.015,
  enemySpeedPerDepth: 0.005,

  enemyHealthPerCycle: 0.08,
  enemyAttackPerCycle: 0.05,
  enemyDefensePerCycle: 0.03,
  enemySpeedPerCycle: 0.01,

  enemyMaximumSpeedMultiplier: 1.75
});

/* ==========================================================
   5. COMBAT PLAYBACK SETTINGS
   ----------------------------------------------------------
   Controls visual replay speed without altering the underlying
   deterministic combat result.
========================================================== */

const NACHT_RAIDERS_COMBAT_PLAYBACK_SETTINGS = Object.freeze({
  timeScale: 0.7,
  actionCueMs: 220,
  outcomeHoldMs: 1400
});
