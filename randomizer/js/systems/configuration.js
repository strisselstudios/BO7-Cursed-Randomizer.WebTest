/* ==========================================================
   1. CONFIGURE MODAL
   ----------------------------------------------------------
   Opens, validates and closes the Configure window.
========================================================== */

configureButton.addEventListener("click", (e) => {
  e.stopPropagation();

  configureBox.classList.remove("shake");
  saveConfigButton.classList.remove("save-glow");

  configureModal.classList.remove("hidden");
});

function closeConfigure() {
  configureModal.classList.add("hidden");
}

saveConfigButton.addEventListener("click", closeConfigure);

configureModal.addEventListener("click", (e) => {
  if (e.target !== configureModal) return;

  configureBox.classList.remove("shake");
  saveConfigButton.classList.remove("save-glow");

  void configureBox.offsetWidth;
  void saveConfigButton.offsetWidth;

  configureBox.classList.add("shake");
  saveConfigButton.classList.add("save-glow");
});


/* ==========================================================
   2. CONFIGURE BUTTONS
   ----------------------------------------------------------
   Configure panel utility actions.
========================================================== */

deselectRelicsButton.addEventListener("click", () => {
  configureModal.querySelectorAll(".relic-checkbox").forEach((box) => {
    box.checked = false;
  });
});

resetConfigButton.addEventListener("click", () => {
  configureModal.querySelectorAll("input[type='checkbox']").forEach((box) => {
    box.checked = true;
  });
});
