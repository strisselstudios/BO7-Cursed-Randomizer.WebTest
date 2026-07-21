/* ==========================================================
   1. VIDEO SETUP
   ----------------------------------------------------------
   Initial video configuration and protection.
========================================================== */

video.load();
video.pause();
video.currentTime = 0;

video.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});


/* ==========================================================
   2. THEME TOGGLE
   ----------------------------------------------------------
   Switches between light and dark mode.
========================================================== */

themeToggleButton.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");

  themeToggleButton.innerText = document.body.classList.contains("light-mode")
    ? "DARK MODE"
    : "LIGHT MODE";
});


/* ==========================================================
   3. CONTACT BUTTON
   ----------------------------------------------------------
   Opens Gmail compose or falls back to mailto.
========================================================== */

contactButton.addEventListener("click", (e) => {
  e.preventDefault();

  const gmailUrl =
    "https://mail.google.com/mail/?view=cm&fs=1" +
    "&to=dopefishlivesagain@gmail.com" +
    "&su=" + encodeURIComponent("Cursed Relic Randomizer");

  const gmailWindow = window.open(gmailUrl, "_blank");

  if (!gmailWindow || gmailWindow.closed || typeof gmailWindow.closed === "undefined") {
    window.location.href =
      "mailto:dopefishlivesagain@gmail.com?subject=" +
      encodeURIComponent("Cursed Relic Randomizer");
  }
});


/* ==========================================================
   4. MR. PEEKS NOSE HONK
   ----------------------------------------------------------
   Plays the honk sound when Mr. Peeks' nose is clicked.
========================================================== */

mrPeeksNoseZone.addEventListener("click", () => {
  honkSound.currentTime = 0;
  honkSound.play();
});


/* ==========================================================
   5. SPIN BUTTON
   ----------------------------------------------------------
   Begins the mystery box animation sequence.
========================================================== */

button.addEventListener("click", () => {
  if (state !== "idle") return;

  state = "spinning";

  mrPeeksImage.style.display = "none";
  mrPeeksNoseZone.style.display = "none";
  mrPeeksNoseZone.style.pointerEvents = "none";

  boxLaugh.pause();
  boxLaugh.currentTime = 0;

  honkSound.pause();
  honkSound.currentTime = 0;

  output.innerHTML = "";

  video.pause();
  video.currentTime = 0;

  mysteryBoxJingle.currentTime = 0;
  mysteryBoxJingle.play().catch(() => {});

  video.play().catch(() => {
    state = "idle";
  });
});


/* ==========================================================
   6. VIDEO END RESULT HANDLER
   ----------------------------------------------------------
   Displays relics or Mr. Peeks after the animation finishes.
========================================================== */

video.addEventListener("ended", () => {
  video.pause();

  const result = generateRelics();

  if (result === null) {
    output.innerText = "";

    mrPeeksImage.style.display = "block";
    mrPeeksNoseZone.style.display = "block";
    mrPeeksNoseZone.style.pointerEvents = "auto";

    boxLaugh.currentTime = 0;
    boxLaugh.play();
  } else {
    mrPeeksImage.style.display = "none";
    mrPeeksNoseZone.style.display = "none";
    mrPeeksNoseZone.style.pointerEvents = "none";
    output.innerHTML = result;
  }

  state = "idle";
});


/* ==========================================================
   7. RESET BUTTON
   ----------------------------------------------------------
   Restores the application to its initial state.
========================================================== */

resetButton.addEventListener("click", () => {
  state = "idle";

  video.pause();
  video.currentTime = 0;

  mysteryBoxJingle.pause();
  mysteryBoxJingle.currentTime = 0;

  boxLaugh.pause();
  boxLaugh.currentTime = 0;

  honkSound.pause();
  honkSound.currentTime = 0;

  mrPeeksImage.style.display = "none";
  mrPeeksNoseZone.style.display = "none";
  mrPeeksNoseZone.style.pointerEvents = "none";

  tierButton.dataset.value = startingTier;
  tierButton.innerText = "Tier 1";
  tierMenu.classList.add("hidden");

  output.innerHTML = "";
});
