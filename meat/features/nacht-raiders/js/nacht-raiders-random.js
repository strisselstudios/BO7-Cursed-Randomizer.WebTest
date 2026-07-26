/* ==========================================================
   1. DETERMINISTIC RANDOM STATE
   ----------------------------------------------------------
   Advances the expedition's saved random state. Offline and
   active simulations therefore produce the same results.
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

/* ==========================================================
   2. RANDOM INTEGER RANGES
========================================================== */

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
   3. RANDOM DECIMAL RANGES
========================================================== */

function rollNachtRaidersDecimal(nachtRaidersState, minimum, maximum) {
  const normalizedMinimum = Number(minimum);
  const normalizedMaximum = Number(maximum);

  const rangeMinimum = Number.isFinite(normalizedMinimum)
    ? normalizedMinimum
    : 0;

  const rangeMaximum = Number.isFinite(normalizedMaximum)
    ? Math.max(rangeMinimum, normalizedMaximum)
    : rangeMinimum;

  return rangeMinimum + getNextNachtRaidersRandom(nachtRaidersState) * (
    rangeMaximum - rangeMinimum
  );
}
