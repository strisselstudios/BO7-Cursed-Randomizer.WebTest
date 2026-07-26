/* ==========================================================
   1. SPRITE ANIMATION RUNTIME
========================================================== */

const nachtRaidersVisualAnimationStates =
  new WeakMap();

const nachtRaidersVisualRequestTokens =
  new WeakMap();

/* ==========================================================
   2. REQUEST TOKENS
   ----------------------------------------------------------
   Invalidates sprite loads that complete after another visual
   state has already replaced them.
========================================================== */

function getNachtRaidersVisualRequestToken(
  visualElement
) {
  return (
    nachtRaidersVisualRequestTokens.get(
      visualElement
    ) || 0
  );
}

function createNachtRaidersVisualRequestToken(
  visualElement
) {
  const nextToken =
    getNachtRaidersVisualRequestToken(
      visualElement
    ) + 1;

  nachtRaidersVisualRequestTokens.set(
    visualElement,
    nextToken
  );

  return nextToken;
}

function isNachtRaidersVisualRequestCurrent(
  visualElement,
  requestToken
) {
  return (
    getNachtRaidersVisualRequestToken(
      visualElement
    ) === requestToken
  );
}

/* ==========================================================
   3. ANIMATION STATE ACCESS
========================================================== */

function getNachtRaidersVisualAnimationState(
  visualElement
) {
  const animationState =
    nachtRaidersVisualAnimationStates.get(
      visualElement
    );

  return animationState
    ? {
        assetId:
          animationState.assetId,

        animationName:
          animationState.animationName,

        source:
          animationState.source,

        status:
          animationState.status,

        hasSprite:
          animationState.hasSprite,

        frameIndex:
          animationState.frameIndex,

        frameCount:
          animationState.frameCount
      }
    : null;
}

function isNachtRaidersVisualStateActive(
  visualElement,
  assetId,
  animationName
) {
  const animationState =
    nachtRaidersVisualAnimationStates.get(
      visualElement
    );

  return Boolean(
    animationState &&
    animationState.assetId === assetId &&
    animationState.animationName ===
      animationName &&
    animationState.status !== "error"
  );
}

/* ==========================================================
   4. ANIMATION CONTROL
========================================================== */

function stopNachtRaidersVisualAnimation(
  visualElement
) {
  if (!visualElement) return;

  const animationState =
    nachtRaidersVisualAnimationStates.get(
      visualElement
    );

  if (!animationState) {
    return;
  }

  if (
    animationState.timeoutId !==
    null
  ) {
    window.clearTimeout(
      animationState.timeoutId
    );
  }

  animationState.timeoutId =
    null;
}

function resetNachtRaidersVisualPresentation(
  visualElement
) {
  if (!visualElement) return;

  visualElement.classList.remove(
    "has-sprite"
  );

  visualElement.style.removeProperty(
    "background-image"
  );

  visualElement.style.removeProperty(
    "background-position"
  );

  visualElement.style.removeProperty(
    "background-size"
  );

  visualElement.style.removeProperty(
    "--nacht-raiders-frame-count"
  );

  visualElement.style.removeProperty(
    "--nacht-raiders-frame-width"
  );

  visualElement.style.removeProperty(
    "--nacht-raiders-frame-height"
  );
}

function clearNachtRaidersVisualAsset(
  visualElement
) {
  if (!visualElement) return;

  createNachtRaidersVisualRequestToken(
    visualElement
  );

  stopNachtRaidersVisualAnimation(
    visualElement
  );

  nachtRaidersVisualAnimationStates.delete(
    visualElement
  );

  resetNachtRaidersVisualPresentation(
    visualElement
  );

  visualElement.dataset.assetKey =
    "";

  visualElement.dataset.animation =
    "";
}

/* ==========================================================
   5. SPRITE FRAME DISPLAY
========================================================== */

function setNachtRaidersVisualFrame(
  visualElement,
  frameIndex,
  frameCount
) {
  if (!visualElement) return;

  const normalizedFrameCount =
    Math.max(
      1,
      Math.floor(
        Number(frameCount) || 1
      )
    );

  const normalizedFrameIndex =
    Math.min(
      normalizedFrameCount - 1,
      Math.max(
        0,
        Math.floor(
          Number(frameIndex) || 0
        )
      )
    );

  const positionPercentage =
    normalizedFrameCount > 1
      ? (
          normalizedFrameIndex /
          (
            normalizedFrameCount -
            1
          )
        ) * 100
      : 0;

  visualElement.style.backgroundPosition =
    `${positionPercentage}% 0`;
}

function shouldAnimateNachtRaidersSprites() {
  if (
    document.body.classList.contains(
      "animations-disabled"
    )
  ) {
    return false;
  }

  return !window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
}

/* ==========================================================
   6. SPRITE FRAME LOOP
========================================================== */

function startNachtRaidersVisualAnimation(
  visualElement,
  animation,
  frameCount,
  requestToken,
  assetId,
  animationName
) {
  if (
    !visualElement ||
    !animation
  ) {
    return;
  }

  const normalizedFrameCount =
    Math.max(
      1,
      Math.floor(
        Number(frameCount) || 1
      )
    );

  const animationState = {
    assetId,
    animationName,
    source:
      animation.src,

    status:
      "ready",

    hasSprite:
      true,

    requestToken,
    timeoutId:
      null,

    frameIndex:
      0,

    frameCount:
      normalizedFrameCount
  };

  nachtRaidersVisualAnimationStates.set(
    visualElement,
    animationState
  );

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

  const advanceFrame = () => {
    const currentState =
      nachtRaidersVisualAnimationStates.get(
        visualElement
      );

    if (
      !currentState ||
      currentState.requestToken !==
        requestToken ||
      !isNachtRaidersVisualRequestCurrent(
        visualElement,
        requestToken
      )
    ) {
      return;
    }

    const nextFrameIndex =
      currentState.frameIndex + 1;

    if (
      nextFrameIndex >=
        normalizedFrameCount &&
      !animation.loop
    ) {
      currentState.frameIndex =
        normalizedFrameCount - 1;

      currentState.timeoutId =
        null;

      setNachtRaidersVisualFrame(
        visualElement,
        currentState.frameIndex,
        normalizedFrameCount
      );

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
   7. PLACEHOLDER STATE
========================================================== */

function applyNachtRaidersPlaceholderVisual(
  visualElement,
  assetId,
  animationName,
  requestToken
) {
  nachtRaidersVisualAnimationStates.set(
    visualElement,
    {
      assetId,
      animationName,
      source:
        "",

      status:
        "placeholder",

      hasSprite:
        false,

      requestToken,
      timeoutId:
        null,

      frameIndex:
        0,

      frameCount:
        1
    }
  );

  return false;
}

/* ==========================================================
   8. VISUAL ASSET APPLICATION
   ----------------------------------------------------------
   Reuses the current visual state when the requested asset and
   animation are already active. Passing restart: true forces
   the animation to begin again from its first frame.
========================================================== */

function applyNachtRaidersVisualAsset(
  visualElement,
  placeholderElement,
  assetId,
  animationName,
  options = {}
) {
  if (!visualElement) {
    return false;
  }

  const normalizedAssetId =
    typeof assetId === "string"
      ? assetId
      : "";

  const normalizedAnimationName =
    typeof animationName === "string"
      ? animationName
      : "";

  const restart =
    options.restart === true;

  if (
    !restart &&
    isNachtRaidersVisualStateActive(
      visualElement,
      normalizedAssetId,
      normalizedAnimationName
    )
  ) {
    return (
      nachtRaidersVisualAnimationStates.get(
        visualElement
      )?.hasSprite === true
    );
  }

  const asset =
    getNachtRaidersAssetDefinition(
      normalizedAssetId
    );

  const animation =
    getNachtRaidersAnimationDefinition(
      normalizedAssetId,
      normalizedAnimationName
    );

  const requestToken =
    createNachtRaidersVisualRequestToken(
      visualElement
    );

  stopNachtRaidersVisualAnimation(
    visualElement
  );

  resetNachtRaidersVisualPresentation(
    visualElement
  );

  visualElement.dataset.assetKey =
    normalizedAssetId;

  visualElement.dataset.animation =
    normalizedAnimationName;

  if (placeholderElement) {
    placeholderElement.textContent =
      asset?.placeholder || "?";
  }

  if (
    !asset ||
    !animation?.src
  ) {
    return applyNachtRaidersPlaceholderVisual(
      visualElement,
      normalizedAssetId,
      normalizedAnimationName,
      requestToken
    );
  }

  nachtRaidersVisualAnimationStates.set(
    visualElement,
    {
      assetId:
        normalizedAssetId,

      animationName:
        normalizedAnimationName,

      source:
        animation.src,

      status:
        "loading",

      hasSprite:
        false,

      requestToken,
      timeoutId:
        null,

      frameIndex:
        0,

      frameCount:
        animation.frameCount
    }
  );

  loadNachtRaidersSpriteImage(
    animation.src
  )
    .then(
      (image) => {
        if (
          !isNachtRaidersVisualRequestCurrent(
            visualElement,
            requestToken
          )
        ) {
          return;
        }

        const currentState =
          nachtRaidersVisualAnimationStates.get(
            visualElement
          );

        if (
          !currentState ||
          currentState.requestToken !==
            requestToken
        ) {
          return;
        }

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
          requestToken,
          normalizedAssetId,
          normalizedAnimationName
        );
      }
    )
    .catch(
      (error) => {
        if (
          !isNachtRaidersVisualRequestCurrent(
            visualElement,
            requestToken
          )
        ) {
          return;
        }

        resetNachtRaidersVisualPresentation(
          visualElement
        );

        nachtRaidersVisualAnimationStates.set(
          visualElement,
          {
            assetId:
              normalizedAssetId,

            animationName:
              normalizedAnimationName,

            source:
              animation.src,

            status:
              "error",

            hasSprite:
              false,

            requestToken,
            timeoutId:
              null,

            frameIndex:
              0,

            frameCount:
              1
          }
        );

        console.error(
          error
        );
      }
    );

  return true;
}

/* ==========================================================
   9. FORCED ANIMATION RESTART
========================================================== */

function restartNachtRaidersVisualAsset(
  visualElement,
  placeholderElement,
  assetId,
  animationName
) {
  return applyNachtRaidersVisualAsset(
    visualElement,
    placeholderElement,
    assetId,
    animationName,
    {
      restart: true
    }
  );
}
