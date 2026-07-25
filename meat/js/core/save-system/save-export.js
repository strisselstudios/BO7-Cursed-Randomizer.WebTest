/* ==========================================================
   SAVE EXPORT
   ----------------------------------------------------------
   Downloads the current MEAT.exe progress as a JSON file that
   can be transferred to another device.
========================================================== */

function exportGameSave() {
  try {
    saveGame();

    const exportPackage = {
      game: "MEAT.exe",
      exportVersion: 1,
      exportedAt: Date.now(),
      saveData: gameState
    };
    const saveFileContents = JSON.stringify(exportPackage, null, 2);
    const saveBlob = new Blob([saveFileContents], { type: "application/json" });
    const downloadUrl = URL.createObjectURL(saveBlob);
    const downloadLink = document.createElement("a");
    const exportDate = new Date();
    const timestamp = [
      exportDate.getFullYear(),
      String(exportDate.getMonth() + 1).padStart(2, "0"),
      String(exportDate.getDate()).padStart(2, "0")
    ].join("-") + "_" + [
      String(exportDate.getHours()).padStart(2, "0"),
      String(exportDate.getMinutes()).padStart(2, "0"),
      String(exportDate.getSeconds()).padStart(2, "0")
    ].join("-");

    downloadLink.href = downloadUrl;
    downloadLink.download = `MEAT-exe-save-${timestamp}.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(downloadUrl);
    }, 0);

    return true;
  } catch (error) {
    console.error("MEAT.exe save could not be exported:", error);
    return false;
  }
}
