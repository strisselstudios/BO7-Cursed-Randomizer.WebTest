/* ==========================================================
   1. FLOATING CLICK FEEDBACK
   ----------------------------------------------------------
   Displays temporary +MEAT text where the player clicks and
   limits active visual effects to prevent performance loss.
========================================================== */

const MAX_FLOATING_TEXTS = 18;
const MAX_MEAT_PARTICLES = 28;
const PARTICLES_PER_CLICK = 5;

function createFloatingMeatText(event, amount) {
  if (!gameState.settings.animations) {
    return;
  }

  const existingTexts = floatingTextLayer.querySelectorAll(
    ".floating-meat-text"
  );

  if (existingTexts.length >= MAX_FLOATING_TEXTS) {
    existingTexts[0].remove();
  }

  const floatingText =
    document.createElement("span");

  floatingText.className = "floating-meat-text";
  floatingText.textContent =
    `+${formatMeat(amount)}`;

  const layerBounds =
    floatingTextLayer.getBoundingClientRect();

  const startX =
    event.clientX - layerBounds.left;

  const startY =
    event.clientY - layerBounds.top;

  const driftDirection =
    Math.random() < 0.5 ? -1 : 1;

  const driftAmount =
    10 + Math.random() * 24;

  const middleDrift =
    driftDirection * driftAmount * 0.45;

  const endingDrift =
    driftDirection * driftAmount;

  const startRotation =
    Math.random() * 8 - 4;

  const middleRotation =
    startRotation * -0.35;

  const endRotation =
    startRotation * -0.7;

  const duration =
    820 + Math.random() * 220;

  floatingText.style.left =
    `${startX}px`;

  floatingText.style.top =
    `${startY}px`;

  floatingText.style.setProperty(
    "--text-drift-x-mid",
    `${middleDrift}px`
  );

  floatingText.style.setProperty(
    "--text-drift-x-end",
    `${endingDrift}px`
  );

  floatingText.style.setProperty(
    "--text-start-rotation",
    `${startRotation}deg`
  );

  floatingText.style.setProperty(
    "--text-mid-rotation",
    `${middleRotation}deg`
  );

  floatingText.style.setProperty(
    "--text-end-rotation",
    `${endRotation}deg`
  );

  floatingText.style.setProperty(
    "--text-duration",
    `${duration}ms`
  );

  floatingTextLayer.appendChild(floatingText);

  floatingText.addEventListener(
    "animationend",
    () => {
      floatingText.remove();
    },
    { once: true }
  );
}


/* ==========================================================
   2. MEAT IMPACT PARTICLES
   ----------------------------------------------------------
   Creates a limited burst of fragments around each manual
   press without allowing excessive DOM elements to build up.
========================================================== */

function createMeatParticles(event) {
  if (!gameState.settings.animations) {
    return;
  }

  const existingParticles = floatingTextLayer.querySelectorAll(
    ".meat-particle"
  );

  const excessParticleCount =
    existingParticles.length +
    PARTICLES_PER_CLICK -
    MAX_MEAT_PARTICLES;

  if (excessParticleCount > 0) {
    for (let i = 0; i < excessParticleCount; i++) {
      existingParticles[i]?.remove();
    }
  }

  const layerBounds =
    floatingTextLayer.getBoundingClientRect();

  const startX =
    event.clientX - layerBounds.left;

  const startY =
    event.clientY - layerBounds.top;

  const particleFragment =
    document.createDocumentFragment();

  for (let i = 0; i < PARTICLES_PER_CLICK; i++) {
    const particle =
      document.createElement("span");

    particle.className = "meat-particle";

    const bounds =
      meatButton.getBoundingClientRect();

    const horizontalDirection =
      (
        (
          event.clientX -
          bounds.left
        ) /
        bounds.width -
        0.5
      ) * 2;

    const verticalDirection =
      (
        (
          event.clientY -
          bounds.top
        ) /
        bounds.height -
        0.5
      ) * 2;

    /*
     * Spray particles opposite the direction
     * the player is pressing.
     */

    const baseAngle =
      Math.atan2(
        -verticalDirection,
        -horizontalDirection
      );

    const angle =
      baseAngle +
      (Math.random() - 0.5) * 1.15;

    const distance =
      36 + Math.random() * 42;

    const travelX =
      Math.cos(angle) * distance;

    const travelY =
      Math.sin(angle) * distance;

    particle.style.left =
      `${startX}px`;

    particle.style.top =
      `${startY}px`;

    particle.style.setProperty(
      "--particle-x",
      `${travelX}px`
    );

    particle.style.setProperty(
      "--particle-y",
      `${travelY}px`
    );

    particle.style.setProperty(
      "--particle-size",
      `${5 + Math.random() * 9}px`
    );

    particle.style.animationDuration =
      `${420 + Math.random() * 180}ms`;

    particle.style.setProperty(
      "--particle-rotation",
      `${Math.random() * 300 - 150}deg`
    );

    particle.addEventListener(
      "animationend",
      () => {
        particle.remove();
      },
      { once: true }
    );

    particleFragment.appendChild(particle);
  }

  floatingTextLayer.appendChild(particleFragment);
}


/* ==========================================================
   3. MEAT HELD, RELEASE, AND SETTLE REACTION
   ----------------------------------------------------------
   Calculates directional compression from the active pointer,
   holds the deformation, moves the aura with inertia, performs
   the release rebound, adds a settling wobble, and triggers
   subtle screen shake for stronger edge impacts.
========================================================== */

let latestMeatImpactStrength = 0;

const MEAT_SHAKE_THRESHOLD = 0.72;

function updateHeldMeatImpact(event) {
  if (!gameState.settings.animations) {
    return;
  }

  const buttonBounds =
    meatButton.getBoundingClientRect();

  if (
    buttonBounds.width <= 0 ||
    buttonBounds.height <= 0
  ) {
    return;
  }

  const localX =
    event.clientX - buttonBounds.left;

  const localY =
    event.clientY - buttonBounds.top;

  const impactX = Math.max(
    0,
    Math.min(
      100,
      (localX / buttonBounds.width) * 100
    )
  );

  const impactY = Math.max(
    0,
    Math.min(
      100,
      (localY / buttonBounds.height) * 100
    )
  );

  const horizontalDirection =
    (impactX - 50) / 50;

  const verticalDirection =
    (impactY - 50) / 50;

  const horizontalStrength =
    Math.abs(horizontalDirection);

  const verticalStrength =
    Math.abs(verticalDirection);

  const combinedStrength = Math.min(
    1,
    Math.sqrt(
      horizontalDirection ** 2 +
      verticalDirection ** 2
    )
  );

  latestMeatImpactStrength =
    combinedStrength;

  const impactShiftX =
    horizontalDirection * 22;

  const impactShiftY =
    verticalDirection * 18;

  const reboundShiftX =
    horizontalDirection * -7;

  const reboundShiftY =
    verticalDirection * -6;

  const impactRotation =
    horizontalDirection * 7;

  const reboundRotation =
    impactRotation * -0.32;

  const settleShiftX =
    impactShiftX * -0.12;

  const settleShiftY =
    impactShiftY * -0.12;

  const settleRotation =
    impactRotation * -0.13;

  const heldScaleX =
    0.94 -
    horizontalStrength * 0.09 +
    verticalStrength * 0.025;

  const heldScaleY =
    0.84 -
    verticalStrength * 0.08 +
    horizontalStrength * 0.025;

  const heldSkewX =
    horizontalDirection *
    verticalDirection *
    -4;

  const auraShiftX =
    horizontalDirection * -10;

  const auraShiftY =
    verticalDirection * -8;

  const auraScale =
    1 + combinedStrength * 0.08;

  const meatShadowX =
    horizontalDirection * -10;

  const meatShadowY =
    4 + verticalDirection * -7;

  const meatShadowBlur =
    7 + combinedStrength * 5;

  const meatGlowX =
    horizontalDirection * -3;

  const meatGlowY =
    verticalDirection * -3;

  const meatBrightness =
    1 + combinedStrength * 0.045;

  const impactLightOpacity =
    0.12 + combinedStrength * 0.16;

  meatButton.style.setProperty(
    "--impact-x",
    `${impactX}%`
  );

  meatButton.style.setProperty(
    "--impact-y",
    `${impactY}%`
  );

  meatButton.style.setProperty(
    "--impact-shift-x",
    `${impactShiftX}px`
  );

  meatButton.style.setProperty(
    "--impact-shift-y",
    `${impactShiftY}px`
  );

  meatButton.style.setProperty(
    "--impact-rebound-x",
    `${reboundShiftX}px`
  );

  meatButton.style.setProperty(
    "--impact-rebound-y",
    `${reboundShiftY}px`
  );

  meatButton.style.setProperty(
    "--impact-rotation",
    `${impactRotation}deg`
  );

  meatButton.style.setProperty(
    "--impact-rebound-rotation",
    `${reboundRotation}deg`
  );

  meatButton.style.setProperty(
    "--impact-settle-x",
    `${settleShiftX}px`
  );

  meatButton.style.setProperty(
    "--impact-settle-y",
    `${settleShiftY}px`
  );

  meatButton.style.setProperty(
    "--impact-settle-rotation",
    `${settleRotation}deg`
  );

  meatButton.style.setProperty(
    "--held-scale-x",
    heldScaleX.toFixed(3)
  );

  meatButton.style.setProperty(
    "--held-scale-y",
    heldScaleY.toFixed(3)
  );

  meatButton.style.setProperty(
    "--held-skew-x",
    `${heldSkewX.toFixed(2)}deg`
  );

  meatButton.style.setProperty(
    "--impact-strength",
    combinedStrength.toFixed(3)
  );

  meatButton.parentElement.style.setProperty(
    "--aura-shift-x",
    `${auraShiftX}px`
  );

  meatButton.parentElement.style.setProperty(
    "--aura-shift-y",
    `${auraShiftY}px`
  );

  meatButton.parentElement.style.setProperty(
    "--aura-scale",
    auraScale.toFixed(3)
  );

  meatButton.style.setProperty(
    "--meat-shadow-x",
    `${meatShadowX}px`
  );

  meatButton.style.setProperty(
    "--meat-shadow-y",
    `${meatShadowY}px`
  );

  meatButton.style.setProperty(
    "--meat-shadow-blur",
    `${meatShadowBlur}px`
  );

  meatButton.style.setProperty(
    "--meat-glow-x",
    `${meatGlowX}px`
  );

  meatButton.style.setProperty(
    "--meat-glow-y",
    `${meatGlowY}px`
  );

  meatButton.style.setProperty(
    "--meat-brightness",
    meatBrightness.toFixed(3)
  );

  meatButton.style.setProperty(
    "--impact-light-opacity",
    impactLightOpacity.toFixed(3)
  );

  meatButton.classList.remove(
    "meat-release",
    "meat-settle"
  );

  meatButton.classList.add("meat-held");
}

function resetMeatAura() {
  meatButton.parentElement.style.setProperty(
    "--aura-shift-x",
    "0px"
  );

  meatButton.parentElement.style.setProperty(
    "--aura-shift-y",
    "0px"
  );

  meatButton.parentElement.style.setProperty(
    "--aura-scale",
    "1"
  );

  meatButton.style.setProperty(
    "--meat-shadow-x",
    "0px"
  );

  meatButton.style.setProperty(
    "--meat-shadow-y",
    "3px"
  );

  meatButton.style.setProperty(
    "--meat-shadow-blur",
    "7px"
  );

  meatButton.style.setProperty(
    "--meat-glow-x",
    "0px"
  );

  meatButton.style.setProperty(
    "--meat-glow-y",
    "0px"
  );

  meatButton.style.setProperty(
    "--meat-brightness",
    "1"
  );

  meatButton.style.setProperty(
    "--impact-light-opacity",
    "0"
  );
}

function triggerMeatScreenShake() {
  if (!gameState.settings.animations) {
    latestMeatImpactStrength = 0;
    return;
  }

  if (
    latestMeatImpactStrength <
    MEAT_SHAKE_THRESHOLD
  ) {
    latestMeatImpactStrength = 0;
    return;
  }

  meatView.classList.remove(
    "meat-screen-shake"
  );

  void meatView.offsetWidth;

  meatView.classList.add(
    "meat-screen-shake"
  );

  latestMeatImpactStrength = 0;
}

meatView.addEventListener(
  "animationend",
  (event) => {
    if (
      event.animationName ===
      "meatScreenShake"
    ) {
      meatView.classList.remove(
        "meat-screen-shake"
      );
    }
  }
);

function releaseMeatImpact() {
  if (!gameState.settings.animations) {
    meatButton.classList.remove(
      "meat-held",
      "meat-release",
      "meat-settle"
    );

    resetMeatAura();

    latestMeatImpactStrength = 0;

    return;
  }

  meatButton.classList.remove(
    "meat-held",
    "meat-release",
    "meat-settle"
  );

  void meatButton.offsetWidth;

  meatButton.classList.add(
    "meat-release"
  );

  triggerMeatScreenShake();
  resetMeatAura();
}

meatButton.addEventListener(
  "animationend",
  (event) => {
    if (
      event.animationName ===
      "meatRelease"
    ) {
      meatButton.classList.remove(
        "meat-release"
      );

      void meatButton.offsetWidth;

      meatButton.classList.add(
        "meat-settle"
      );

      return;
    }

    if (
      event.animationName ===
      "meatSettleWobble"
    ) {
      meatButton.classList.remove(
        "meat-settle"
      );
    }
  }
);
