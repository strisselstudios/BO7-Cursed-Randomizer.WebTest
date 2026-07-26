/* ==========================================================
   1. FIELD RECORD TYPES
========================================================== */

const NACHT_RAIDERS_RECORD_TYPE_TRAVEL = "travel";
const NACHT_RAIDERS_RECORD_TYPE_DISCOVERY = "discovery";
const NACHT_RAIDERS_RECORD_TYPE_SALVAGE = "salvage";
const NACHT_RAIDERS_RECORD_TYPE_ANOMALY = "anomaly";

/* ==========================================================
   2. INCIDENT POOLS
========================================================== */

const NACHT_RAIDERS_INCIDENT_POOL_TRAVEL = "travel";

/* ==========================================================
   3. INCIDENT FREQUENCY
   ----------------------------------------------------------
   Controls whether a completed depth produces an incident.
   Individual incident weights control relative selection only.
========================================================== */

const NACHT_RAIDERS_INCIDENT_SETTINGS = Object.freeze({
  chancePerCompletedDepth: 0.7
});

/* ==========================================================
   4. INCIDENT REGISTRY
========================================================== */

const nachtRaidersIncidentDefinitions = [];
const nachtRaidersIncidentDefinitionsById = new Map();

/* ==========================================================
   5. INCIDENT NORMALIZATION
========================================================== */

function normalizeNachtRaidersIncidentStringArray(value) {
  if (!Array.isArray(value)) {
    return Object.freeze([]);
  }

  return Object.freeze(
    value
      .filter((entry) => typeof entry === "string" && entry.trim())
      .map((entry) => entry.trim())
  );
}

function normalizeNachtRaidersIncidentRewards(rewards) {
  const normalizedRewards = {};

  if (!rewards || typeof rewards !== "object" || Array.isArray(rewards)) {
    return Object.freeze(normalizedRewards);
  }

  for (const [rewardKey, rewardRange] of Object.entries(rewards)) {
    if (!getNachtRaidersRewardDefinition(rewardKey)) {
      console.error(`Nacht Raiders incident contains an unknown reward key: ${rewardKey}`);
      continue;
    }

    if (!rewardRange || typeof rewardRange !== "object" || Array.isArray(rewardRange)) {
      continue;
    }

    const minimum = Math.max(0, Math.floor(Number(rewardRange.minimum) || 0));
    const maximum = Math.max(minimum, Math.floor(Number(rewardRange.maximum) || minimum));

    normalizedRewards[rewardKey] = Object.freeze({
      minimum,
      maximum
    });
  }

  return Object.freeze(normalizedRewards);
}

function normalizeNachtRaidersIncidentDefinition(definition) {
  if (!definition || typeof definition !== "object" || Array.isArray(definition)) {
    return null;
  }

  const id = typeof definition.id === "string" ? definition.id.trim() : "";
  const lines = normalizeNachtRaidersIncidentStringArray(definition.lines);

  if (!id || lines.length === 0) {
    return null;
  }

  const minimumDepth = Math.max(0, Math.floor(Number(definition.minimumDepth) || 0));
  const maximumDepthValue = Number(definition.maximumDepth);
  const maximumDepth = Number.isFinite(maximumDepthValue)
    ? Math.max(minimumDepth, Math.floor(maximumDepthValue))
    : Number.POSITIVE_INFINITY;

  const minimumCycle = Math.max(0, Math.floor(Number(definition.minimumCycle) || 0));
  const maximumCycleValue = Number(definition.maximumCycle);
  const maximumCycle = Number.isFinite(maximumCycleValue)
    ? Math.max(minimumCycle, Math.floor(maximumCycleValue))
    : Number.POSITIVE_INFINITY;

  return Object.freeze({
    id,
    pool: typeof definition.pool === "string"
      ? definition.pool
      : NACHT_RAIDERS_INCIDENT_POOL_TRAVEL,

    type: typeof definition.type === "string"
      ? definition.type
      : NACHT_RAIDERS_RECORD_TYPE_TRAVEL,

    weight: Math.max(0, Number(definition.weight) || 0),
    title: typeof definition.title === "string" ? definition.title : id.toUpperCase(),

    lines,
    rewards: normalizeNachtRaidersIncidentRewards(definition.rewards),

    minimumDepth,
    maximumDepth,
    minimumCycle,
    maximumCycle,

    zoneIds: normalizeNachtRaidersIncidentStringArray(definition.zoneIds),
    doctrines: normalizeNachtRaidersIncidentStringArray(definition.doctrines),
    tags: normalizeNachtRaidersIncidentStringArray(definition.tags)
  });
}

/* ==========================================================
   6. INCIDENT REGISTRATION
========================================================== */

function registerNachtRaidersIncidents(definitions) {
  if (!Array.isArray(definitions)) {
    console.error("Nacht Raiders incident registration requires an array.");
    return 0;
  }

  let registeredCount = 0;

  for (const definition of definitions) {
    const normalizedDefinition = normalizeNachtRaidersIncidentDefinition(definition);

    if (!normalizedDefinition) {
      console.error("Invalid Nacht Raiders incident definition:", definition);
      continue;
    }

    if (nachtRaidersIncidentDefinitionsById.has(normalizedDefinition.id)) {
      console.error(`Duplicate Nacht Raiders incident ID: ${normalizedDefinition.id}`);
      continue;
    }

    nachtRaidersIncidentDefinitions.push(normalizedDefinition);
    nachtRaidersIncidentDefinitionsById.set(
      normalizedDefinition.id,
      normalizedDefinition
    );

    registeredCount += 1;
  }

  return registeredCount;
}

/* ==========================================================
   7. INCIDENT LOOKUP
========================================================== */

function getNachtRaidersIncidentDefinition(incidentId) {
  return nachtRaidersIncidentDefinitionsById.get(incidentId) || null;
}

function getNachtRaidersIncidentDefinitions(pool = null) {
  if (!pool) {
    return [...nachtRaidersIncidentDefinitions];
  }

  return nachtRaidersIncidentDefinitions.filter(
    (incident) => incident.pool === pool
  );
}
