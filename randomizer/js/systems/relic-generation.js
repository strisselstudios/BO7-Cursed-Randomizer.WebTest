/* ==========================================================
   1. ENABLED MAP / RELIC READERS
   ----------------------------------------------------------
   Reads enabled configuration options.
========================================================== */

function getEnabledRelics() {
  const enabled = [];

  document.querySelectorAll(".relic-checkbox:checked").forEach((box) => {
    const name = box.parentElement.textContent.trim();

    for (const category in relicData) {
      if (relicData[category].includes(name)) {
        enabled.push({
          name,
          category,
          value: relicValues[category]
        });
      }
    }
  });

  return enabled;
}

function getEnabledMaps() {
  return Array.from(document.querySelectorAll(".map-checkbox:checked")).map((box) => {
    return box.parentElement.textContent.trim();
  });
}

function getRandomMap() {
  const maps = getEnabledMaps();

  if (maps.length === 0) {
    return null;
  }

  return maps[Math.floor(Math.random() * maps.length)];
}


/* ==========================================================
   2. TIER VALUE LOGIC
   ----------------------------------------------------------
   Determines the required relic value target.
========================================================== */

function getTargetValue() {
  if (tierButton.dataset.value === "tier1") return 3;
  if (tierButton.dataset.value === "tier2") return 6;
  if (tierButton.dataset.value === "tier3") return 9;
  if (tierButton.dataset.value === "tier3hard") return 9;

  return 3;
}


/* ==========================================================
   3. RANDOMIZATION HELPERS
   ----------------------------------------------------------
   Shared utility functions for relic generation.
========================================================== */

function shuffleArray(array) {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function findRandomCombination(relics, target) {
  const allCombinations = [];
  const maxCombinations = 500;
  const shuffledRelics = shuffleArray(relics);

  function backtrack(startIndex, total, currentCombo) {
    if (allCombinations.length >= maxCombinations) return;

    if (total === target) {
      allCombinations.push([...currentCombo]);
      return;
    }

    if (total > target) return;

    for (let i = startIndex; i < shuffledRelics.length; i++) {
      currentCombo.push(shuffledRelics[i]);
      backtrack(i + 1, total + shuffledRelics[i].value, currentCombo);
      currentCombo.pop();
    }
  }

  backtrack(0, 0, []);

  if (allCombinations.length === 0) {
    return null;
  }

  return allCombinations[Math.floor(Math.random() * allCombinations.length)];
}

function sortRelicsByOriginalOrder(relics) {
  const order = [
    ...relicData.grim,
    ...relicData.sinister,
    ...relicData.wicked
  ];

  relics.sort((a, b) => {
    return order.indexOf(a.name) - order.indexOf(b.name);
  });

  return relics;
}


/* ==========================================================
   4. TIER 3 HARD LOGIC
   ----------------------------------------------------------
   Generates Tier 3 HARD relic combinations.
========================================================== */

function findTier3HardCombination(relics) {
  const baseCombo = findRandomCombination(relics, 9);

  if (!baseCombo) {
    return null;
  }

  const baseNames = new Set(baseCombo.map((relic) => relic.name));

  const remainingRelics = shuffleArray(
    relics.filter((relic) => !baseNames.has(relic.name))
  );

  const extraCount = Math.floor(Math.random() * (remainingRelics.length + 1));
  const extras = remainingRelics.slice(0, extraCount);

  return [...baseCombo, ...extras];
}
