/* ==========================================================
   1. CREDITS MODAL
   ----------------------------------------------------------
   Opens and closes the Credits window.
========================================================== */

creditsButton.addEventListener("click", () => {
  creditsModal.classList.remove("hidden");
});

function closeCredits() {
  creditsModal.classList.add("hidden");
}

creditsModal.addEventListener("click", (e) => {
  if (e.target === creditsModal) {
    closeCredits();
  }
});
