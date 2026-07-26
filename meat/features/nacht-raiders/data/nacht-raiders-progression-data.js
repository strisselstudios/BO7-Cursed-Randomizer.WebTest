/* ==========================================================
   1. LEVEL PROGRESSION SETTINGS
   ----------------------------------------------------------
   XP required from level L to level L + 1:

   baseXp
   + linearXp * (L - 1)
   + quadraticXp * (L - 1)²
========================================================== */

const NACHT_RAIDERS_LEVEL_SETTINGS = Object.freeze({
  maximumLevel: 100,
  baseXp: 50,
  linearXp: 25,
  quadraticXp: 5
});

/* ==========================================================
   2. LEVEL NORMALIZATION
========================================================== */

function normalizeNachtRaidersLevel(level) {
  const numericLevel = Math.floor(Number(level));

  if (!Number.isFinite(numericLevel)) {
    return 1;
  }

  return Math.min(
    NACHT_RAIDERS_LEVEL_SETTINGS.maximumLevel,
    Math.max(1, numericLevel)
  );
}

/* ==========================================================
   3. XP REQUIREMENTS
========================================================== */

function getNachtRaidersXpRequiredForNextLevel(level) {
  const normalizedLevel = normalizeNachtRaidersLevel(level);

  if (normalizedLevel >= NACHT_RAIDERS_LEVEL_SETTINGS.maximumLevel) {
    return 0;
  }

  const progressionIndex = normalizedLevel - 1;

  return Math.floor(
    NACHT_RAIDERS_LEVEL_SETTINGS.baseXp +
    NACHT_RAIDERS_LEVEL_SETTINGS.linearXp * progressionIndex +
    NACHT_RAIDERS_LEVEL_SETTINGS.quadraticXp * progressionIndex * progressionIndex
  );
}

function getNachtRaidersCumulativeXpForLevel(level) {
  const targetLevel = normalizeNachtRaidersLevel(level);
  let requiredXp = 0;

  for (let currentLevel = 1; currentLevel < targetLevel; currentLevel += 1) {
    requiredXp += getNachtRaidersXpRequiredForNextLevel(currentLevel);
  }

  return requiredXp;
}

/* ==========================================================
   4. LEVEL DERIVATION
   ----------------------------------------------------------
   XP is stored cumulatively. Level is repaired from total XP,
   preventing skipped, duplicated, or lost level-ups.
========================================================== */

function getNachtRaidersLevelFromXp(totalXp) {
  const normalizedXp = Math.max(0, Math.floor(Number(totalXp) || 0));
  let remainingXp = normalizedXp;
  let level = 1;

  while (level < NACHT_RAIDERS_LEVEL_SETTINGS.maximumLevel) {
    const requiredXp = getNachtRaidersXpRequiredForNextLevel(level);

    if (remainingXp < requiredXp) {
      break;
    }

    remainingXp -= requiredXp;
    level += 1;
  }

  return level;
}

function synchronizeNachtRaidersOperativeLevel(nachtRaidersState) {
  const previousLevel = normalizeNachtRaidersLevel(
    nachtRaidersState.operative.level
  );

  const currentLevel = getNachtRaidersLevelFromXp(
    nachtRaidersState.operative.xp
  );

  nachtRaidersState.operative.level = currentLevel;

  return {
    previousLevel,
    currentLevel,
    levelsGained: Math.max(0, currentLevel - previousLevel)
  };
}

/* ==========================================================
   5. LEVEL PROGRESS
========================================================== */

function getNachtRaidersLevelProgress(totalXp) {
  const normalizedXp = Math.max(0, Math.floor(Number(totalXp) || 0));
  const level = getNachtRaidersLevelFromXp(normalizedXp);
  const levelStartXp = getNachtRaidersCumulativeXpForLevel(level);
  const xpIntoLevel = Math.max(0, normalizedXp - levelStartXp);
  const xpRequired = getNachtRaidersXpRequiredForNextLevel(level);

  return {
    level,
    totalXp: normalizedXp,
    levelStartXp,
    xpIntoLevel,
    xpRequired,
    xpRemaining: Math.max(0, xpRequired - xpIntoLevel),
    progress: xpRequired > 0 ? Math.min(1, xpIntoLevel / xpRequired) : 1,
    isMaximumLevel: level >= NACHT_RAIDERS_LEVEL_SETTINGS.maximumLevel
  };
}
