/* ==========================================================
   1. SPRITE ANIMATION RUNTIME
========================================================== */

const nachtRaidersVisualAnimationStates = new WeakMap();

let nachtRaidersVisualAnimationToken = 0;

/* ==========================================================
   2. ANIMATION CONTROL
========================================================== */

function stopNachtRaidersVisualAnimation(visualElement) {
  if (!visualElement) return;

  const animationState =
    nachtRaidersVisualAnimationStates.get(
      visualElement
    );

  if (!animationState) {
    return;
  }

  if (animationState.timeoutId !== null) {
    window.clearTimeout(
      animationState.timeoutId
    );
  }

  nachtRaidersVisualAnimationStates.delete(
    visualElement
  );
}

function clearNachtRaidersVisualAsset(visualElement) {
  if (!visualElement) return;

  stopNachtRaidersVisualAnimation(visualElement);

  visualElement.classList.remove("has-sprite");
  visualElement.style.removeProperty("background-image");
  visualElement.style.removeProperty("background-position");
  visualElement.style.removeProperty("--nacht-raiders-frame-count");
  visualElement.style.removeProperty("--nacht-raiders-frame-width");
  visualElement.style.removeProperty("--nacht-raiders-frame-height");
}

/* ==========================================================
   3. SPRITE FRAME DISPLAY
========================================================== */

function setNachtRaidersVisualFrame(
  visualElement,
  frameIndex,
  frameCount
) {
  if (!visualElement) return;

  const normalizedFrameCount = Math.max(1, Math.floor(Number(frameCount) || 1));
  const normalizedFrameIndex = Math.min(
    normalizedFrameCount - 1,
    Math.max(0, Math.floor(Number(frameIndex) || 0))
  );

  const positionPercentage =
    normalizedFrameCount > 1
      ? normalizedFrameIndex / (normalizedFrameCount - 1) * 100
      : 0;

  visualElement.style.backgroundPosition =
    `${positionPercentage}% 0`;
}

function shouldAnimateNachtRaidersSprites() {
  if (document.body.classList.contains("animations-disabled")) return false;

  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ==========================================================
   4. SPRITE FRAME LOOP
========================================================== */

function startNachtRaidersVisualAnimation(
  visualElement,
  animation,
  frameCount,
  token
) {
  if (!visualElement || !animation) return;

  const normalizedFrameCount = Math.max(1, Math.floor(Number(frameCount) || 1));

  setNachtRaidersVisualFrame(
    visualElement,
    0,
    normalizedFrameCount
  );

  if (
    normalizedFrameCount <= 1 ||
    !shouldAnimateNachtRaidersSprites()
  ) {
    return;
  }

  const animationState = {
    token,
    timeoutId: null,
    frameIndex: 0
  };

  nachtRaidersVisualAnimationStates.set(
    visualElement,
    animationState
  );

  const advanceFrame = () => {
    const currentState =
      nachtRaidersVisualAnimationStates.get(
        visualElement
      );

    if (
      !currentState ||
      currentState.token !== token
    ) {
      return;
    }

    const nextFrameIndex =
      currentState.frameIndex + 1;

    if (
      nextFrameIndex >= normalizedFrameCount &&
      !animation.loop
    ) {
      currentState.frameIndex =
        normalizedFrameCount - 1;

      setNachtRaidersVisualFrame(
        visualElement,
        currentState.frameIndex,
        normalizedFrameCount
      );

      currentState.timeoutId = null;

      return;
    }

    currentState.frameIndex =
      nextFrameIndex %
      normalizedFrameCount;

    setNachtRaidersVisualFrame(
      visualElement,
      currentState.frameIndex,
      normalizedFrameCount
    );

    currentState.timeoutId =
      window.setTimeout(
        advanceFrame,
        animation.frameDurationMs
      );
  };

  animationState.timeoutId =
    window.setTimeout(
      advanceFrame,
      animation.frameDurationMs
    );
}

/* ==========================================================
   5. FRAME-COUNT DETECTION
========================================================== */

function getNachtRaidersAnimationFrameCount(
  image,
  animation
) {
  if (
    !animation.autoFrameCount ||
    !image ||
    image.naturalWidth <= 0
  ) {
    return animation.frameCount;
  }

  return Math.max(
    1,
    Math.floor(
      image.naturalWidth /
      animation.frameWidth
    )
  );
}

/* ==========================================================
   6. VISUAL ASSET APPLICATION
========================================================== */

function applyNachtRaidersVisualAsset(
  visualElement,
  placeholderElement,
  assetId,
  animationName
) {
  if (!visualElement) return false;

  const asset =
    getNachtRaidersAssetDefinition(
      assetId
    );

  const animation =
    getNachtRaidersAnimationDefinition(
      assetId,
      animationName
    );

  clearNachtRaidersVisualAsset(
    visualElement
  );

  visualElement.dataset.assetKey =
    assetId || "";

  visualElement.dataset.animation =
    animationName || "";

  if (placeholderElement) {
    placeholderElement.textContent =
      asset?.placeholder || "?";
  }

  if (!asset || !animation?.src) {
    return false;
  }

  const token =
    ++nachtRaidersVisualAnimationToken;

  const image =
    new Image();

  image.onload = () => {
    const frameCount =
      getNachtRaidersAnimationFrameCount(
        image,
        animation
      );

    visualElement.style.backgroundImage =
      `url("${animation.src}")`;

    visualElement.style.setProperty(
      "--nacht-raiders-frame-count",
      String(frameCount)
    );

    visualElement.style.setProperty(
      "--nacht-raiders-frame-width",
      String(animation.frameWidth)
    );

    visualElement.style.setProperty(
      "--nacht-raiders-frame-height",
      String(animation.frameHeight)
    );

    visualElement.style.backgroundSize =
      `${frameCount * 100}% 100%`;

    visualElement.classList.add(
      "has-sprite"
    );

    startNachtRaidersVisualAnimation(
      visualElement,
      animation,
      frameCount,
      token
    );
  };

  image.onerror = () => {
    clearNachtRaidersVisualAsset(
      visualElement
    );

    console.error(
      `Nacht Raiders asset could not be loaded: ${animation.src}`
    );
  };

  image.src =
    animation.src;

  return true;
}
