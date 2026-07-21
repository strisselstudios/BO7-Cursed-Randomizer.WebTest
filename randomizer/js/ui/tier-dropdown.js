/* ==========================================================
   1. TIER DROPDOWN
   ----------------------------------------------------------
   Handles custom tier selection.
========================================================== */

document.addEventListener("click", (e) => {
  if (!e.target.closest("#tierDropdown")) {
    tierMenu.classList.add("hidden");
  }
});

tierButton.addEventListener("click", (e) => {
  e.stopPropagation();
  tierMenu.classList.toggle("hidden");
});

document.querySelectorAll(".tier-option").forEach((option) => {
  option.addEventListener("click", () => {
    option.classList.remove("selected-flash");
    void option.offsetWidth;
    option.classList.add("selected-flash");

    tierButton.dataset.value = option.dataset.value;
    tierButton.innerText = option.querySelector("span").innerText;

    setTimeout(() => {
      tierMenu.classList.add("hidden");
    }, 120);
  });
});
