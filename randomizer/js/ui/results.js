/* ==========================================================
   1. FINAL RESULT GENERATOR
   ----------------------------------------------------------
   Creates the final map and relic output HTML.
========================================================== */

function generateRelics() {
  const relics = getEnabledRelics();

  if (relics.length === 0) {
    return null;
  }

  let result;

  if (tierButton.dataset.value === "tier3hard") {
    result = findTier3HardCombination(relics);
  } else {
    const target = getTargetValue();
    result = findRandomCombination(relics, target);
  }

  if (!result) {
    return null;
  }

  result = sortRelicsByOriginalOrder(result);

  const selectedMap = getRandomMap();

  let html = "";

  if (selectedMap !== null) {
  html += `
    <div class="map-output">
      <div class="output-heading">Map:</div>
      <div class="map-name">${selectedMap}</div>
    </div>
  `;
  } else {
   html += `
     <div class="map-output map-placeholder"></div>
   `;
  }

  html += `<div class="output-heading">Relics:</div>`;

html += `<div class="relic-grid">`;

result.forEach((relic, index) => {
  const isLastRow = index >= result.length - (result.length % 3 || 3);
  const leftovers = result.length % 3;

  let extraClass = "";

  if (isLastRow && leftovers === 1) {
    extraClass = " relic-center";
  }

  if (isLastRow && leftovers === 2) {
    extraClass =
      index === result.length - 2
        ? " relic-left"
        : " relic-right";
  }

  html += `<div class="relic-item${extraClass}">${relic.name}</div>`;
});

html += `</div>`;

  return html;
}
