/* ==========================================================
   1. MEAT NUMBER LIMIT
   ----------------------------------------------------------
   MEAT remains a normal JavaScript Number until it reaches
   1.79 × 10^308.

   Reaching the exact limit remains displayable. Attempting
   to exceed it activates INFINITE MEAT.
========================================================== */

const MEAT_DISPLAY_LIMIT = 1.79e308;

/* ==========================================================
   2. MEAT VALUE NORMALIZATION
========================================================== */

function clampMeatAmount(value) {
  const numericValue = Number(value);

  if (
    Number.isNaN(numericValue) ||
    numericValue <= 0
  ) {
    return 0;
  }

  if (
    !Number.isFinite(numericValue) ||
    numericValue > MEAT_DISPLAY_LIMIT
  ) {
    return MEAT_DISPLAY_LIMIT;
  }

  return numericValue;
}

/* ==========================================================
   3. CLAMPED ADDITION
========================================================== */

function addClampedMeatValues(
  currentValue,
  amountToAdd
) {
  const current =
    clampMeatAmount(currentValue);

  const amount =
    clampMeatAmount(amountToAdd);

  if (current <= 0) {
    return amount;
  }

  if (amount <= 0) {
    return current;
  }

  if (
    current >= MEAT_DISPLAY_LIMIT ||
    amount >
      MEAT_DISPLAY_LIMIT - current
  ) {
    return MEAT_DISPLAY_LIMIT;
  }

  return current + amount;
}

/* ==========================================================
   4. CLAMPED MULTIPLICATION
   ----------------------------------------------------------
   Prevents intermediate multiplication from becoming the
   JavaScript Infinity value.
========================================================== */

function multiplyClampedMeatValues(
  ...factors
) {
  if (factors.length === 0) {
    return 0;
  }

  let result = 1;

  for (const factor of factors) {
    const numericFactor =
      Number(factor);

    if (
      Number.isNaN(numericFactor) ||
      numericFactor <= 0
    ) {
      return 0;
    }

    if (
      !Number.isFinite(numericFactor)
    ) {
      return MEAT_DISPLAY_LIMIT;
    }

    if (
      result >
      MEAT_DISPLAY_LIMIT /
        numericFactor
    ) {
      return MEAT_DISPLAY_LIMIT;
    }

    result *= numericFactor;
  }

  return clampMeatAmount(result);
}

/* ==========================================================
   5. PRECISION-REMAINDER ACCUMULATION
   ----------------------------------------------------------
   Very small additions can stop changing a huge Number.

   Those additions are retained until their combined value is
   large enough to alter the stored Number.
========================================================== */

function applyMeatIncrement(
  targetKey,
  remainderKey,
  amount
) {
  const currentValue =
    clampMeatAmount(
      gameState[targetKey]
    );

  const currentRemainder =
    clampMeatAmount(
      gameState[remainderKey]
    );

  const normalizedAmount =
    clampMeatAmount(amount);

  gameState[targetKey] =
    currentValue;

  gameState[remainderKey] =
    currentRemainder;

  if (normalizedAmount <= 0) {
    return {
      appliedAmount: 0,
      exceededLimit: false
    };
  }

  /*
   * The exact maximum remains visible until another positive
   * amount attempts to increase it.
   */
  if (
    currentValue >=
    MEAT_DISPLAY_LIMIT
  ) {
    return {
      appliedAmount: 0,
      exceededLimit: true
    };
  }

  const pendingAmount =
    addClampedMeatValues(
      currentRemainder,
      normalizedAmount
    );

  const nextValue =
    currentValue + pendingAmount;

  if (
    !Number.isFinite(nextValue) ||
    nextValue > MEAT_DISPLAY_LIMIT
  ) {
    gameState[targetKey] =
      MEAT_DISPLAY_LIMIT;

    gameState[remainderKey] = 0;

    return {
      appliedAmount:
        MEAT_DISPLAY_LIMIT -
        currentValue,

      exceededLimit: true
    };
  }

  /*
   * Floating-point precision swallowed the increment.
   * Preserve it instead of deleting it.
   */
  if (nextValue === currentValue) {
    gameState[remainderKey] =
      pendingAmount;

    return {
      appliedAmount: 0,
      exceededLimit: false
    };
  }

  gameState[targetKey] =
    nextValue;

  gameState[remainderKey] = 0;

  return {
    appliedAmount:
      nextValue - currentValue,

    exceededLimit: false
  };
}

/* ==========================================================
   6. CENTRAL MEAT AWARD
   ----------------------------------------------------------
   Every click, producer, offline reward and Harvester payout
   will be routed through this function.
========================================================== */

function awardMeat(amount) {
  const normalizedAmount =
    clampMeatAmount(amount);

  if (normalizedAmount <= 0) {
    return 0;
  }

  if (
    gameState.infiniteMeat === true
  ) {
    gameState.meat =
      MEAT_DISPLAY_LIMIT;

    gameState.totalMeat =
      MEAT_DISPLAY_LIMIT;

    gameState.meatRemainder = 0;
    gameState.totalMeatRemainder = 0;

    return normalizedAmount;
  }

  const bankResult =
    applyMeatIncrement(
      "meat",
      "meatRemainder",
      normalizedAmount
    );

  applyMeatIncrement(
    "totalMeat",
    "totalMeatRemainder",
    normalizedAmount
  );

  if (bankResult.exceededLimit) {
    gameState.infiniteMeat = true;

    gameState.meat =
      MEAT_DISPLAY_LIMIT;

    gameState.meatRemainder = 0;
  }

  return normalizedAmount;
}
