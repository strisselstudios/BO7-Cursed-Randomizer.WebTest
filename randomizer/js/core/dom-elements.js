/* ==========================================================
   1. DOM ELEMENTS
   ----------------------------------------------------------
   Cache all frequently used HTML elements.
========================================================== */

const video = document.getElementById("bgVideo");
const button = document.getElementById("spinButton");
const output = document.getElementById("output");

const resetButton = document.getElementById("resetButton");
const tierButton = document.getElementById("tierButton");
const tierMenu = document.getElementById("tierMenu");
const startingTier = tierButton.dataset.value;

const mrPeeksImage = document.getElementById("mrPeeksImage");
const mrPeeksNoseZone = document.getElementById("mrPeeksNoseZone");

const themeToggleButton = document.getElementById("themeToggleButton");
const contactButton = document.getElementById("creditsContactButton");

const creditsButton = document.getElementById("creditsButton");
const creditsModal = document.getElementById("creditsModal");

const configureButton = document.getElementById("configureButton");
const configureModal = document.getElementById("configureModal");
const configureBox = document.getElementById("configureBox");
const saveConfigButton = document.getElementById("saveConfigButton");
const deselectRelicsButton = document.getElementById("deselectRelicsButton");
const resetConfigButton = document.getElementById("resetConfigButton");
