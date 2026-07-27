/* ==========================================================
   1. ENVIRONMENT RUNTIME STATE
========================================================== */

let activeNachtRaidersEnvironmentId = null;
let activeNachtRaidersZoneId = null;

/* ==========================================================
   2. ENVIRONMENT LAYER ELEMENTS
========================================================== */

function getNachtRaidersEnvironmentLayerElements() {
  return new Map([
    [NACHT_RAIDERS_ENVIRONMENT_LAYER_SKY, nachtRaidersEnvironmentSky],
    [NACHT_RAIDERS_ENVIRONMENT_LAYER_FAR, nachtRaidersEnvironmentFar],
    [NACHT_RAIDERS_ENVIRONMENT_LAYER_MIDDLE, nachtRaidersEnvironmentMiddle],
    [NACHT_RAIDERS_ENVIRONMENT_LAYER_NEAR, nachtRaidersEnvironmentNear],
    [NACHT_RAIDERS_ENVIRONMENT_LAYER_GROUND, nachtRaidersEnvironmentGround]
  ]);
}

/* ==========================================================
   3. ENVIRONMENT LAYER RESET
========================================================== */

function resetNachtRaidersEnvironmentLayer(layerElement) {
  if (!layerElement) return;

  const activeFallbackClass =
    layerElement.dataset.environmentFallbackClass;

  if (activeFallbackClass) {
    layerElement.classList.remove(activeFallbackClass);
  }

  layerElement.dataset.environmentFallbackClass = "";
  layerElement.classList.remove("is-scrolling", "has-environment-source");
  layerElement.hidden = true;

  layerElement.style.removeProperty("background-image");
  layerElement.style.removeProperty("background-repeat");
  layerElement.style.removeProperty("background-size");
  layerElement.style.removeProperty("background-position-x");
  layerElement.style.removeProperty("background-position-y");
  layerElement.style.removeProperty("opacity");
  layerElement.style.removeProperty("--nacht-raiders-environment-scroll-duration");
  layerElement.style.removeProperty("--nacht-raiders-environment-scroll-distance");
}

/* ==========================================================
   4. ENVIRONMENT LAYER APPLICATION
========================================================== */

function applyNachtRaidersEnvironmentLayer(layerDefinition) {
  const layerElement =
    getNachtRaidersEnvironmentLayerElements().get(
      layerDefinition?.slot
    );

  if (!layerElement || !layerDefinition) return false;

  resetNachtRaidersEnvironmentLayer(layerElement);

  layerElement.hidden = false;
  layerElement.style.backgroundRepeat = layerDefinition.backgroundRepeat;
  layerElement.style.backgroundSize = layerDefinition.backgroundSize;
  layerElement.style.backgroundPositionX =
    layerDefinition.backgroundPositionX;

  layerElement.style.backgroundPositionY =
    layerDefinition.backgroundPositionY;

  layerElement.style.opacity = String(layerDefinition.opacity);

  if (layerDefinition.src) {
    layerElement.style.backgroundImage =
      `url(${JSON.stringify(layerDefinition.src)})`;

    layerElement.classList.add("has-environment-source");
  } else if (layerDefinition.fallbackClass) {
    layerElement.classList.add(layerDefinition.fallbackClass);
    layerElement.dataset.environmentFallbackClass =
      layerDefinition.fallbackClass;
  }

  if (layerDefinition.scrollDurationMs > 0) {
    layerElement.style.setProperty(
      "--nacht-raiders-environment-scroll-duration",
      `${layerDefinition.scrollDurationMs}ms`
    );

    layerElement.style.setProperty(
      "--nacht-raiders-environment-scroll-distance",
      `${-layerDefinition.scrollDistancePx}px`
    );

    layerElement.classList.add("is-scrolling");
  }

  return true;
}

/* ==========================================================
   5. ZONE DISPLAY
========================================================== */

function getNachtRaidersZoneDisplayLabel(zoneId) {
  const zoneDefinition =
    resolveNachtRaidersZoneDefinition(zoneId);

  return zoneDefinition?.label || String(zoneId || "UNKNOWN").toUpperCase();
}

function updateNachtRaidersZoneDisplay(zoneDefinition) {
  if (!zoneDefinition) return;

  if (nachtRaidersGameHeading) {
    nachtRaidersGameHeading.textContent = zoneDefinition.heading;
  }

  if (nachtRaidersGameZone) {
    nachtRaidersGameZone.textContent = zoneDefinition.label;
  }
}

/* ==========================================================
   6. COMPLETE ENVIRONMENT RENDERING
========================================================== */

function renderNachtRaidersEnvironment(zoneId, options = {}) {
  const zoneDefinition =
    resolveNachtRaidersZoneDefinition(zoneId);

  if (!zoneDefinition) return false;

  const environmentDefinition =
    getNachtRaidersEnvironmentDefinition(
      zoneDefinition.environmentId
    );

  if (!environmentDefinition || !nachtRaidersEnvironment) {
    return false;
  }

  updateNachtRaidersZoneDisplay(zoneDefinition);

  const force = options.force === true;

  if (
    !force &&
    activeNachtRaidersZoneId === zoneDefinition.id &&
    activeNachtRaidersEnvironmentId === environmentDefinition.id
  ) {
    return true;
  }

  const layerElements =
    getNachtRaidersEnvironmentLayerElements();

  for (const layerElement of layerElements.values()) {
    resetNachtRaidersEnvironmentLayer(layerElement);
  }

  nachtRaidersEnvironment.dataset.zoneId = zoneDefinition.id;
  nachtRaidersEnvironment.dataset.environmentId =
    environmentDefinition.id;

  nachtRaidersEnvironment.style.backgroundColor =
    environmentDefinition.backgroundColor;

  for (const layerDefinition of environmentDefinition.layers) {
    applyNachtRaidersEnvironmentLayer(layerDefinition);
  }

  activeNachtRaidersZoneId = zoneDefinition.id;
  activeNachtRaidersEnvironmentId = environmentDefinition.id;

  document.dispatchEvent(
    new CustomEvent("nacht-raiders:environment-rendered", {
      detail: {
        zoneId: zoneDefinition.id,
        environmentId: environmentDefinition.id
      }
    })
  );

  return true;
}

/* ==========================================================
   7. ENVIRONMENT INVALIDATION
========================================================== */

function invalidateNachtRaidersEnvironment() {
  activeNachtRaidersZoneId = null;
  activeNachtRaidersEnvironmentId = null;
}
