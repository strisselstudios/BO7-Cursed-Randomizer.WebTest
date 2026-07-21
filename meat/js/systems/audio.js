/* ==========================================================
   1. MEAT PRESS AND RELEASE SOUND
   ----------------------------------------------------------
   Preloads and decodes separate press and release sounds.
   Every interaction creates an independent audio source so
   rapid press and release sounds can overlap without either
   sound interrupting the other.
========================================================== */

const MEAT_PRESS_SOUND_PATH =
  "meat/sounds/clicker/meat-press.mp3";

const MEAT_RELEASE_SOUND_PATH =
  "meat/sounds/clicker/meat-release.mp3";

const MEAT_PRESS_START_OFFSET = 0.025;
const MEAT_RELEASE_START_OFFSET = 0.015;

const MEAT_PRESS_PITCHES = [
  0.88,
  0.94,
  1.00,
  1.06
];

const MEAT_RELEASE_PITCHES = [
  1.08,
  1.16,
  1.24,
  1.32
];

const MeatAudioContext =
  window.AudioContext ||
  window.webkitAudioContext;

const meatAudioContext =
  MeatAudioContext
    ? new MeatAudioContext()
    : null;

let meatPressAudioBuffer = null;
let meatReleaseAudioBuffer = null;

let meatAudioLoadingPromise = null;

let lastMeatPressPitchIndex = -1;
let lastMeatReleasePitchIndex = -1;

function decodeMeatAudioData(arrayBuffer) {
  return new Promise((resolve, reject) => {
    if (!meatAudioContext) {
      reject(
        new Error(
          "Web Audio is not supported."
        )
      );

      return;
    }

    let finished = false;

    function finishSuccessfully(buffer) {
      if (finished) {
        return;
      }

      finished = true;
      resolve(buffer);
    }

    function finishWithError(error) {
      if (finished) {
        return;
      }

      finished = true;
      reject(error);
    }

    const decodingResult =
      meatAudioContext.decodeAudioData(
        arrayBuffer.slice(0),
        finishSuccessfully,
        finishWithError
      );

    if (
      decodingResult &&
      typeof decodingResult.then === "function"
    ) {
      decodingResult
        .then(finishSuccessfully)
        .catch(finishWithError);
    }
  });
}

async function loadMeatAudioBuffer(soundPath) {
  const response = await fetch(
    soundPath,
    {
      cache: "force-cache"
    }
  );

  if (!response.ok) {
    throw new Error(
      `Could not load ${soundPath}`
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  return decodeMeatAudioData(arrayBuffer);
}

function loadMeatAudio() {
  if (!meatAudioContext) {
    return Promise.resolve();
  }

  if (meatAudioLoadingPromise) {
    return meatAudioLoadingPromise;
  }

  meatAudioLoadingPromise = Promise.all([
    loadMeatAudioBuffer(
      MEAT_PRESS_SOUND_PATH
    ),

    loadMeatAudioBuffer(
      MEAT_RELEASE_SOUND_PATH
    )
  ])
    .then(
      ([
        pressBuffer,
        releaseBuffer
      ]) => {
        meatPressAudioBuffer =
          pressBuffer;

        meatReleaseAudioBuffer =
          releaseBuffer;
      }
    )
    .catch((error) => {
      console.error(
        "MEAT.exe sounds could not be loaded:",
        error
      );
    });

  return meatAudioLoadingPromise;
}

function unlockMeatAudio() {
  if (!meatAudioContext) {
    return;
  }

  if (
    meatAudioContext.state ===
    "suspended"
  ) {
    meatAudioContext
      .resume()
      .catch((error) => {
        console.error(
          "MEAT.exe audio could not resume:",
          error
        );
      });
  }
}

function getNonRepeatingPitchIndex(
  pitches,
  previousIndex
) {
  let nextIndex =
    Math.floor(
      Math.random() * pitches.length
    );

  if (
    pitches.length > 1 &&
    nextIndex === previousIndex
  ) {
    nextIndex =
      (
        nextIndex +
        1 +
        Math.floor(
          Math.random() *
          (pitches.length - 1)
        )
      ) %
      pitches.length;
  }

  return nextIndex;
}

function playMeatAudioBuffer(
  audioBuffer,
  playbackRate,
  volume,
  startOffset
) {
  if (
    !meatAudioContext ||
    !audioBuffer
  ) {
    loadMeatAudio();
    return;
  }

  unlockMeatAudio();

  const source =
    meatAudioContext.createBufferSource();

  const gain =
    meatAudioContext.createGain();

  source.buffer = audioBuffer;
  source.playbackRate.value =
    playbackRate;

  gain.gain.value = volume;

  source.connect(gain);
  gain.connect(
    meatAudioContext.destination
  );

  const safeStartOffset = Math.min(
    startOffset,
    Math.max(
      0,
      audioBuffer.duration - 0.001
    )
  );

  source.start(
    0,
    safeStartOffset
  );

  source.addEventListener(
    "ended",
    () => {
      source.disconnect();
      gain.disconnect();
    },
    {
      once: true
    }
  );
}

function playMeatPressSound() {
  if (!gameState.settings.sound) {
    return;
  }

  lastMeatPressPitchIndex =
    getNonRepeatingPitchIndex(
      MEAT_PRESS_PITCHES,
      lastMeatPressPitchIndex
    );

  const playbackRate =
    MEAT_PRESS_PITCHES[
      lastMeatPressPitchIndex
    ];

  const volume =
    0.18 + Math.random() * 0.04;

  playMeatAudioBuffer(
    meatPressAudioBuffer,
    playbackRate,
    volume,
    MEAT_PRESS_START_OFFSET
  );
}

function playMeatReleaseSound() {
  if (!gameState.settings.sound) {
    return;
  }

  lastMeatReleasePitchIndex =
    getNonRepeatingPitchIndex(
      MEAT_RELEASE_PITCHES,
      lastMeatReleasePitchIndex
    );

  const playbackRate =
    MEAT_RELEASE_PITCHES[
      lastMeatReleasePitchIndex
    ];

  const volume =
    0.10 + Math.random() * 0.03;

  playMeatAudioBuffer(
    meatReleaseAudioBuffer,
    playbackRate,
    volume,
    MEAT_RELEASE_START_OFFSET
  );
}

if (soundToggle) {
  soundToggle.addEventListener(
    "change",
    () => {
      gameState.settings.sound =
        soundToggle.checked;

      if (soundToggle.checked) {
        unlockMeatAudio();
        loadMeatAudio();
      }

      saveGame();
    }
  );
}

/*
 * Begins downloading and decoding both sounds as soon as
 * the script loads instead of waiting for the first press.
 */

loadMeatAudio();
