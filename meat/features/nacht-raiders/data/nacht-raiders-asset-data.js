/* ==========================================================
   1. ASSET TYPES
========================================================== */

const NACHT_RAIDERS_ASSET_TYPE_OPERATIVE = "operative";
const NACHT_RAIDERS_ASSET_TYPE_ENEMY = "enemy";
const NACHT_RAIDERS_ASSET_TYPE_ENVIRONMENT = "environment";
const NACHT_RAIDERS_ASSET_TYPE_ITEM = "item";

/* ==========================================================
   2. ANIMATION STATES
========================================================== */

const NACHT_RAIDERS_ANIMATION_IDLE = "idle";
const NACHT_RAIDERS_ANIMATION_WALK = "walk";
const NACHT_RAIDERS_ANIMATION_ATTACK = "attack";
const NACHT_RAIDERS_ANIMATION_HURT = "hurt";
const NACHT_RAIDERS_ANIMATION_DEATH = "death";

/* ==========================================================
   3. ASSET REGISTRY
========================================================== */

const nachtRaidersAssetDefinitions = [];
const nachtRaidersAssetDefinitionsById = new Map();

/* ==========================================================
   4. PLACEHOLDER ANIMATION SET
   ----------------------------------------------------------
   Supplies a complete animation contract before finished sprite
   sheets exist. Replace individual src values later.
========================================================== */

function createNachtRaidersPlaceholderAnimationSet(
  frameWidth = 96,
  frameHeight = 96
) {
  return {
    idle: {
      src: "",
      frameWidth,
      frameHeight,
      frameCount: 1,
      frameDurationMs: 180,
      loop: true,
      impactFrame: null
    },

    walk: {
      src: "",
      frameWidth,
      frameHeight,
      frameCount: 1,
      frameDurationMs: 110,
      loop: true,
      impactFrame: null
    },

    attack: {
      src: "",
      frameWidth,
      frameHeight,
      frameCount: 1,
      frameDurationMs: 90,
      loop: false,
      impactFrame: 0
    },

    hurt: {
      src: "",
      frameWidth,
      frameHeight,
      frameCount: 1,
      frameDurationMs: 100,
      loop: false,
      impactFrame: null
    },

    death: {
      src: "",
      frameWidth,
      frameHeight,
      frameCount: 1,
      frameDurationMs: 120,
      loop: false,
      impactFrame: null
    }
  };
}

/* ==========================================================
   5. ASSET NORMALIZATION
========================================================== */

function normalizeNachtRaidersAssetString(value, fallback = "") {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : fallback;
}

function normalizeNachtRaidersAnimationDefinition(
  animationName,
  definition
) {
  const source =
    definition &&
    typeof definition === "object" &&
    !Array.isArray(definition)
      ? definition
      : {};

  const frameWidth = Math.max(
    1,
    Math.floor(Number(source.frameWidth) || 96)
  );

  const frameHeight = Math.max(
    1,
    Math.floor(Number(source.frameHeight) || 96)
  );

  const frameCount = Math.max(
    1,
    Math.floor(Number(source.frameCount) || 1)
  );

  const frameDurationMs = Math.max(
    1,
    Math.floor(Number(source.frameDurationMs) || 100)
  );

  const impactFrameValue = Number(source.impactFrame);

  return Object.freeze({
    name: animationName,
    src: normalizeNachtRaidersAssetString(source.src),
    frameWidth,
    frameHeight,
    frameCount,
    frameDurationMs,
    loop: source.loop !== false,
    autoFrameCount: source.autoFrameCount === true,

    impactFrame: Number.isFinite(impactFrameValue)
      ? Math.min(
          frameCount - 1,
          Math.max(0, Math.floor(impactFrameValue))
        )
      : null
  });
}

function normalizeNachtRaidersAssetAnimations(animations) {
  const normalizedAnimations = {};

  if (!animations || typeof animations !== "object" || Array.isArray(animations)) {
    return Object.freeze(normalizedAnimations);
  }

  for (const [animationName, definition] of Object.entries(animations)) {
    const normalizedName = normalizeNachtRaidersAssetString(animationName);

    if (!normalizedName) continue;

    normalizedAnimations[normalizedName] =
      normalizeNachtRaidersAnimationDefinition(
        normalizedName,
        definition
      );
  }

  return Object.freeze(normalizedAnimations);
}

function normalizeNachtRaidersAssetDefinition(definition) {
  if (!definition || typeof definition !== "object" || Array.isArray(definition)) {
    return null;
  }

  const id = normalizeNachtRaidersAssetString(definition.id);
  const type = normalizeNachtRaidersAssetString(definition.type);

  if (!id || !type) return null;

  return Object.freeze({
    id,
    type,

    label: normalizeNachtRaidersAssetString(
      definition.label,
      id.toUpperCase()
    ),

    placeholder: normalizeNachtRaidersAssetString(
      definition.placeholder,
      "?"
    ),

    facing: normalizeNachtRaidersAssetString(
      definition.facing,
      "right"
    ),

    feetAnchor: Object.freeze({
      x: Math.min(
        1,
        Math.max(
          0,
          Number(definition.feetAnchor?.x) || 0.5
        )
      ),

      y: Math.min(
        1,
        Math.max(
          0,
          Number(definition.feetAnchor?.y) || 1
        )
      )
    }),

    animations:
      normalizeNachtRaidersAssetAnimations(
        definition.animations
      )
  });
}

/* ==========================================================
   6. ASSET REGISTRATION
========================================================== */

function registerNachtRaidersAssets(definitions) {
  if (!Array.isArray(definitions)) {
    console.error("Nacht Raiders asset registration requires an array.");
    return 0;
  }

  let registeredCount = 0;

  for (const definition of definitions) {
    const normalizedDefinition =
      normalizeNachtRaidersAssetDefinition(
        definition
      );

    if (!normalizedDefinition) {
      console.error("Invalid Nacht Raiders asset definition:", definition);
      continue;
    }

    if (nachtRaidersAssetDefinitionsById.has(normalizedDefinition.id)) {
      console.error(`Duplicate Nacht Raiders asset ID: ${normalizedDefinition.id}`);
      continue;
    }

    nachtRaidersAssetDefinitions.push(normalizedDefinition);
    nachtRaidersAssetDefinitionsById.set(
      normalizedDefinition.id,
      normalizedDefinition
    );

    registeredCount += 1;
  }

  return registeredCount;
}

/* ==========================================================
   7. ASSET LOOKUP
========================================================== */

function getNachtRaidersAssetDefinition(assetId) {
  return nachtRaidersAssetDefinitionsById.get(assetId) || null;
}

function getNachtRaidersAssetDefinitions() {
  return [...nachtRaidersAssetDefinitions];
}

function getNachtRaidersAnimationDefinition(
  assetId,
  animationName
) {
  const asset = getNachtRaidersAssetDefinition(assetId);

  if (!asset) return null;

  return (
    asset.animations[animationName] ||
    asset.animations[NACHT_RAIDERS_ANIMATION_IDLE] ||
    Object.values(asset.animations)[0] ||
    null
  );
}
