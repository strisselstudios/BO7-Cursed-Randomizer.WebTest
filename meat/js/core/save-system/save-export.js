/* ==========================================================
   1. EXPORT PACKAGE CREATION
   ----------------------------------------------------------
   Creates a frozen snapshot before asynchronous compression
   and encryption begin.
========================================================== */

function createSaveExportPackage() {
  return {
    game: "MEAT.exe",
    exportVersion: SAVE_EXPORT_VERSION,
    saveIntegrityVersion: CURRENT_SAVE_INTEGRITY_VERSION,
    exportedAt: Date.now(),
    saveData: JSON.parse(JSON.stringify(gameState))
  };
}

/* ==========================================================
   2. EXPORT FILENAME
========================================================== */

function createSaveExportTimestamp() {
  const exportDate = new Date();

  const date = [
    exportDate.getFullYear(),
    String(exportDate.getMonth() + 1).padStart(2, "0"),
    String(exportDate.getDate()).padStart(2, "0")
  ].join("-");

  const time = [
    String(exportDate.getHours()).padStart(2, "0"),
    String(exportDate.getMinutes()).padStart(2, "0"),
    String(exportDate.getSeconds()).padStart(2, "0")
  ].join("-");

  return `${date}_${time}`;
}

/* ==========================================================
   3. ENCRYPTED FILE DOWNLOAD
========================================================== */

function downloadEncryptedSaveExport(saveFileContents) {
  const saveBlob = new Blob(
    [saveFileContents],
    {
      type: "application/x-meat-save"
    }
  );

  if (saveBlob.size > MAX_SAVE_FILE_SIZE_BYTES) {
    throw new Error("The encrypted save file is too large to download.");
  }

  const downloadUrl = URL.createObjectURL(saveBlob);
  const downloadLink = document.createElement("a");

  downloadLink.href = downloadUrl;
  downloadLink.download = `MEAT-exe-save-${createSaveExportTimestamp()}.meat`;

  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();

  window.setTimeout(
    () => URL.revokeObjectURL(downloadUrl),
    0
  );
}

/* ==========================================================
   4. SAVE EXPORT
========================================================== */

async function exportGameSave() {
  try {
    validateGameStateStructure(gameState);

    const impossibleStateReasons = inspectGameStateForImpossibleProgress(gameState);

    if (impossibleStateReasons.length > 0) {
      mergeSaveTrustState(
        gameState,
        gameState,
        impossibleStateReasons
      );
    }

    if (!saveGame()) {
      throw new Error("The current save could not be stored before export.");
    }

    const exportPackage = createSaveExportPackage();
    const saveFileContents = await createEncryptedSaveExportString(exportPackage);

    downloadEncryptedSaveExport(saveFileContents);
    return true;
  } catch (error) {
    console.error("MEAT.exe save could not be exported:", error);
    return false;
  }
}
