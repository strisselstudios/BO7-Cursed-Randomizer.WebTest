/* ==========================================================
   1. SPRITE IMAGE CACHE
   ----------------------------------------------------------
   Stores successfully loaded images and shares pending loads
   so each sprite path is requested only once.
========================================================== */

const nachtRaidersSpriteImageCache = new Map();
const nachtRaidersSpriteImageLoads = new Map();

/* ==========================================================
   2. SPRITE IMAGE LOADING
========================================================== */

function normalizeNachtRaidersSpriteSource(source) {
  return typeof source === "string"
    ? source.trim()
    : "";
}

function loadNachtRaidersSpriteImage(source) {
  const normalizedSource =
    normalizeNachtRaidersSpriteSource(
      source
    );

  if (!normalizedSource) {
    return Promise.reject(
      new Error(
        "Nacht Raiders sprite source is empty."
      )
    );
  }

  if (
    nachtRaidersSpriteImageCache.has(
      normalizedSource
    )
  ) {
    return Promise.resolve(
      nachtRaidersSpriteImageCache.get(
        normalizedSource
      )
    );
  }

  if (
    nachtRaidersSpriteImageLoads.has(
      normalizedSource
    )
  ) {
    return nachtRaidersSpriteImageLoads.get(
      normalizedSource
    );
  }

  const imageLoad =
    new Promise(
      (resolve, reject) => {
        const image =
          new Image();

        image.onload = () => {
          nachtRaidersSpriteImageLoads.delete(
            normalizedSource
          );

          nachtRaidersSpriteImageCache.set(
            normalizedSource,
            image
          );

          resolve(image);
        };

        image.onerror = () => {
          nachtRaidersSpriteImageLoads.delete(
            normalizedSource
          );

          reject(
            new Error(
              `Nacht Raiders sprite could not be loaded: ${normalizedSource}`
            )
          );
        };

        image.src =
          normalizedSource;
      }
    );

  nachtRaidersSpriteImageLoads.set(
    normalizedSource,
    imageLoad
  );

  return imageLoad;
}

/* ==========================================================
   3. FRAME-COUNT DETECTION
========================================================== */

function getNachtRaidersAnimationFrameCount(
  image,
  animation
) {
  if (
    !animation ||
    !image ||
    image.naturalWidth <= 0
  ) {
    return 1;
  }

  if (!animation.autoFrameCount) {
    return Math.max(
      1,
      Math.floor(
        Number(animation.frameCount) || 1
      )
    );
  }

  const frameWidth =
    Math.max(
      1,
      Math.floor(
        Number(animation.frameWidth) || 1
      )
    );

  return Math.max(
    1,
    Math.floor(
      image.naturalWidth /
      frameWidth
    )
  );
}

/* ==========================================================
   4. ASSET PRELOADING
========================================================== */

function getNachtRaidersAssetAnimationSources(
  assetId
) {
  const asset =
    getNachtRaidersAssetDefinition(
      assetId
    );

  if (!asset) {
    return [];
  }

  const sources =
    new Set();

  for (
    const animation of
    Object.values(asset.animations)
  ) {
    const source =
      normalizeNachtRaidersSpriteSource(
        animation?.src
      );

    if (source) {
      sources.add(source);
    }
  }

  return [...sources];
}

async function preloadNachtRaidersAssetAnimations(
  assetId
) {
  const sources =
    getNachtRaidersAssetAnimationSources(
      assetId
    );

  const results =
    await Promise.allSettled(
      sources.map(
        loadNachtRaidersSpriteImage
      )
    );

  const summary = {
    assetId,
    requested: sources.length,
    loaded: 0,
    failed: 0
  };

  for (const result of results) {
    if (
      result.status ===
      "fulfilled"
    ) {
      summary.loaded += 1;
      continue;
    }

    summary.failed += 1;

    console.error(
      result.reason
    );
  }

  return summary;
}

/* ==========================================================
   5. CORE ASSET PRELOADING
========================================================== */

let nachtRaidersCoreAssetPreload = null;

function preloadNachtRaidersCoreVisualAssets() {
  if (nachtRaidersCoreAssetPreload) {
    return nachtRaidersCoreAssetPreload;
  }

  nachtRaidersCoreAssetPreload =
    preloadNachtRaidersAssetAnimations(
      "operative"
    );

  return nachtRaidersCoreAssetPreload;
}

document.addEventListener(
  "nacht-raiders:opened",
  preloadNachtRaidersCoreVisualAssets,
  {
    once: true
  }
);
