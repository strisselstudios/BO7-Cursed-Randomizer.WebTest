/* ==========================================================
   1. ENVIRONMENT LAYER SLOTS
========================================================== */

const NACHT_RAIDERS_ENVIRONMENT_LAYER_SKY = "sky";
const NACHT_RAIDERS_ENVIRONMENT_LAYER_FAR = "far";
const NACHT_RAIDERS_ENVIRONMENT_LAYER_MIDDLE = "middle";
const NACHT_RAIDERS_ENVIRONMENT_LAYER_NEAR = "near";
const NACHT_RAIDERS_ENVIRONMENT_LAYER_GROUND = "ground";

const NACHT_RAIDERS_ENVIRONMENT_LAYER_SLOTS = Object.freeze([
  NACHT_RAIDERS_ENVIRONMENT_LAYER_SKY,
  NACHT_RAIDERS_ENVIRONMENT_LAYER_FAR,
  NACHT_RAIDERS_ENVIRONMENT_LAYER_MIDDLE,
  NACHT_RAIDERS_ENVIRONMENT_LAYER_NEAR,
  NACHT_RAIDERS_ENVIRONMENT_LAYER_GROUND
]);

const NACHT_RAIDERS_ENVIRONMENT_REPEAT_MODES = Object.freeze([
  "repeat",
  "repeat-x",
  "repeat-y",
  "no-repeat"
]);

/* ==========================================================
   2. ENVIRONMENT AND ZONE REGISTRIES
========================================================== */

const nachtRaidersEnvironmentDefinitions = [];
const nachtRaidersEnvironmentDefinitionsById = new Map();

const nachtRaidersZoneDefinitions = [];
const nachtRaidersZoneDefinitionsById = new Map();

/* ==========================================================
   3. ENVIRONMENT NORMALIZATION
========================================================== */

function normalizeNachtRaidersEnvironmentString(value, fallback = "") {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : fallback;
}

function normalizeNachtRaidersEnvironmentOpacity(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? Math.min(1, Math.max(0, numericValue))
    : 1;
}

function normalizeNachtRaidersEnvironmentLayer(definition) {
  if (!definition || typeof definition !== "object" || Array.isArray(definition)) {
    return null;
  }

  const slot = normalizeNachtRaidersEnvironmentString(definition.slot);

  if (!NACHT_RAIDERS_ENVIRONMENT_LAYER_SLOTS.includes(slot)) {
    return null;
  }

  const requestedRepeat = normalizeNachtRaidersEnvironmentString(
    definition.backgroundRepeat,
    "no-repeat"
  );

  const backgroundRepeat = NACHT_RAIDERS_ENVIRONMENT_REPEAT_MODES.includes(
    requestedRepeat
  )
    ? requestedRepeat
    : "no-repeat";

  return Object.freeze({
    slot,
    src: normalizeNachtRaidersEnvironmentString(definition.src),
    fallbackClass: normalizeNachtRaidersEnvironmentString(definition.fallbackClass),
    opacity: normalizeNachtRaidersEnvironmentOpacity(definition.opacity),

    backgroundSize: normalizeNachtRaidersEnvironmentString(
      definition.backgroundSize,
      "cover"
    ),

    backgroundPositionX: normalizeNachtRaidersEnvironmentString(
      definition.backgroundPositionX,
      "center"
    ),

    backgroundPositionY: normalizeNachtRaidersEnvironmentString(
      definition.backgroundPositionY,
      "bottom"
    ),

    backgroundRepeat,

    scrollDurationMs: Math.max(
      0,
      Math.floor(Number(definition.scrollDurationMs) || 0)
    ),

    scrollDistancePx: Math.max(
      1,
      Math.floor(Number(definition.scrollDistancePx) || 1)
    )
  });
}

function normalizeNachtRaidersEnvironmentDefinition(definition) {
  if (!definition || typeof definition !== "object" || Array.isArray(definition)) {
    return null;
  }

  const id = normalizeNachtRaidersEnvironmentString(definition.id);

  if (!id) return null;

  const normalizedLayers = [];
  const registeredSlots = new Set();

  for (const layerDefinition of definition.layers || []) {
    const normalizedLayer = normalizeNachtRaidersEnvironmentLayer(layerDefinition);

    if (!normalizedLayer || registeredSlots.has(normalizedLayer.slot)) {
      continue;
    }

    normalizedLayers.push(normalizedLayer);
    registeredSlots.add(normalizedLayer.slot);
  }

  return Object.freeze({
    id,

    label: normalizeNachtRaidersEnvironmentString(
      definition.label,
      id.toUpperCase()
    ),

    backgroundColor: normalizeNachtRaidersEnvironmentString(
      definition.backgroundColor,
      "#010401"
    ),

    layers: Object.freeze(normalizedLayers)
  });
}

function normalizeNachtRaidersZoneDefinition(definition) {
  if (!definition || typeof definition !== "object" || Array.isArray(definition)) {
    return null;
  }

  const id = normalizeNachtRaidersEnvironmentString(definition.id);
  const environmentId = normalizeNachtRaidersEnvironmentString(
    definition.environmentId
  );

  if (!id || !environmentId) return null;

  return Object.freeze({
    id,

    label: normalizeNachtRaidersEnvironmentString(
      definition.label,
      id.toUpperCase()
    ),

    heading: normalizeNachtRaidersEnvironmentString(
      definition.heading,
      definition.label || id.toUpperCase()
    ),

    environmentId
  });
}

/* ==========================================================
   4. ENVIRONMENT REGISTRATION
========================================================== */

function registerNachtRaidersEnvironments(definitions) {
  if (!Array.isArray(definitions)) {
    console.error("Nacht Raiders environment registration requires an array.");
    return 0;
  }

  let registeredCount = 0;

  for (const definition of definitions) {
    const normalizedDefinition =
      normalizeNachtRaidersEnvironmentDefinition(definition);

    if (!normalizedDefinition) {
      console.error("Invalid Nacht Raiders environment definition:", definition);
      continue;
    }

    if (nachtRaidersEnvironmentDefinitionsById.has(normalizedDefinition.id)) {
      console.error(`Duplicate Nacht Raiders environment ID: ${normalizedDefinition.id}`);
      continue;
    }

    nachtRaidersEnvironmentDefinitions.push(normalizedDefinition);
    nachtRaidersEnvironmentDefinitionsById.set(
      normalizedDefinition.id,
      normalizedDefinition
    );

    registeredCount += 1;
  }

  return registeredCount;
}

/* ==========================================================
   5. ZONE REGISTRATION
========================================================== */

function registerNachtRaidersZones(definitions) {
  if (!Array.isArray(definitions)) {
    console.error("Nacht Raiders zone registration requires an array.");
    return 0;
  }

  let registeredCount = 0;

  for (const definition of definitions) {
    const normalizedDefinition =
      normalizeNachtRaidersZoneDefinition(definition);

    if (!normalizedDefinition) {
      console.error("Invalid Nacht Raiders zone definition:", definition);
      continue;
    }

    if (nachtRaidersZoneDefinitionsById.has(normalizedDefinition.id)) {
      console.error(`Duplicate Nacht Raiders zone ID: ${normalizedDefinition.id}`);
      continue;
    }

    nachtRaidersZoneDefinitions.push(normalizedDefinition);
    nachtRaidersZoneDefinitionsById.set(
      normalizedDefinition.id,
      normalizedDefinition
    );

    registeredCount += 1;
  }

  return registeredCount;
}

/* ==========================================================
   6. ENVIRONMENT LOOKUP
========================================================== */

function getNachtRaidersEnvironmentDefinition(environmentId) {
  return nachtRaidersEnvironmentDefinitionsById.get(environmentId) || null;
}

function getNachtRaidersEnvironmentDefinitions() {
  return [...nachtRaidersEnvironmentDefinitions];
}

/* ==========================================================
   7. ZONE LOOKUP
========================================================== */

function getNachtRaidersZoneDefinition(zoneId) {
  return nachtRaidersZoneDefinitionsById.get(zoneId) || null;
}

function resolveNachtRaidersZoneDefinition(zoneId) {
  return (
    getNachtRaidersZoneDefinition(zoneId) ||
    getNachtRaidersZoneDefinition(NACHT_RAIDERS_STARTING_ZONE_ID) ||
    null
  );
}

function getNachtRaidersZoneDefinitions() {
  return [...nachtRaidersZoneDefinitions];
}
