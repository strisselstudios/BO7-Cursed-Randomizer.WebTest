/* ==========================================================
   1. ENCRYPTED SAVE FORMAT
   ----------------------------------------------------------
   Defines the permanent version-2 export format. The key
   material is client-side deterrence, not a server secret.
========================================================== */

const SAVE_EXPORT_MAGIC = "MEAT2.";
const SAVE_EXPORT_VERSION = 2;
const SAVE_EXPORT_COMPRESSION = "gzip";
const SAVE_EXPORT_ENCRYPTION = "AES-GCM";
const SAVE_EXPORT_KDF = "PBKDF2-SHA256";
const SAVE_EXPORT_PBKDF2_ITERATIONS = 210000;
const SAVE_EXPORT_SALT_LENGTH = 16;
const SAVE_EXPORT_IV_LENGTH = 12;
const SAVE_EXPORT_GCM_TAG_LENGTH = 128;
const MAX_DECOMPRESSED_SAVE_BYTES = 5 * 1024 * 1024;

const SAVE_EXPORT_KEY_MATERIAL = "MEAT.exe|save-export|integrity-v1|ouroboros-2026";
const SAVE_EXPORT_AUTHENTICATION_CONTEXT = "MEAT.exe|exportVersion=2|saveIntegrityVersion=1";
const SAVE_CODEC_TEXT_ENCODER = new TextEncoder();
const SAVE_CODEC_TEXT_DECODER = new TextDecoder("utf-8", { fatal: true });

/* ==========================================================
   2. CODEC SUPPORT
========================================================== */

function requireEncryptedSaveSupport() {
  if (!globalThis.crypto?.subtle || typeof CompressionStream !== "function" || typeof DecompressionStream !== "function") {
    throw new Error("This browser does not support encrypted MEAT.exe save exports.");
  }
}

/* ==========================================================
   3. BASE64URL CONVERSION
========================================================== */

function encodeSaveBytesAsBase64Url(bytes) {
  let binary = "";

  for (let offset = 0; offset < bytes.length; offset += 32768) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 32768, bytes.length)));
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeSaveBase64Url(value, label) {
  if (typeof value !== "string" || !value || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error(`${label} is invalid.`);
  }

  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  let binary;

  try {
    binary = atob(paddedBase64);
  } catch (error) {
    throw new Error(`${label} is invalid.`);
  }

  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

/* ==========================================================
   4. BOUNDED STREAM READING
========================================================== */

async function readBoundedSaveByteStream(readableStream, maximumBytes) {
  const reader = readableStream.getReader();
  const chunks = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > maximumBytes) throw new Error("The decoded save data is too large.");
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const combinedBytes = new Uint8Array(totalBytes);
  let writeOffset = 0;

  chunks.forEach((chunk) => {
    combinedBytes.set(chunk, writeOffset);
    writeOffset += chunk.byteLength;
  });

  return combinedBytes;
}

/* ==========================================================
   5. GZIP COMPRESSION
========================================================== */

async function compressSaveBytes(bytes) {
  const compressedStream = new Blob([bytes]).stream().pipeThrough(new CompressionStream(SAVE_EXPORT_COMPRESSION));
  return readBoundedSaveByteStream(compressedStream, MAX_DECOMPRESSED_SAVE_BYTES);
}

async function decompressSaveBytes(bytes) {
  const decompressedStream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream(SAVE_EXPORT_COMPRESSION));
  return readBoundedSaveByteStream(decompressedStream, MAX_DECOMPRESSED_SAVE_BYTES);
}

/* ==========================================================
   6. ENCRYPTION KEY DERIVATION
========================================================== */

async function deriveSaveExportKey(salt) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    SAVE_CODEC_TEXT_ENCODER.encode(SAVE_EXPORT_KEY_MATERIAL),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: SAVE_EXPORT_PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    baseKey,
    {
      name: SAVE_EXPORT_ENCRYPTION,
      length: 256
    },
    false,
    ["encrypt", "decrypt"]
  );
}

function getSaveExportAesParameters(iv) {
  return {
    name: SAVE_EXPORT_ENCRYPTION,
    iv,
    additionalData: SAVE_CODEC_TEXT_ENCODER.encode(SAVE_EXPORT_AUTHENTICATION_CONTEXT),
    tagLength: SAVE_EXPORT_GCM_TAG_LENGTH
  };
}

/* ==========================================================
   7. ENCRYPTED ENVELOPE VALIDATION
========================================================== */

function parseEncryptedSaveEnvelope(exportText) {
  const trimmedExportText = typeof exportText === "string" ? exportText.trim() : "";

  if (!trimmedExportText.startsWith(SAVE_EXPORT_MAGIC)) {
    throw new Error("This is not an encrypted MEAT.exe save.");
  }

  const encodedEnvelope = trimmedExportText.slice(SAVE_EXPORT_MAGIC.length);
  const envelopeBytes = decodeSaveBase64Url(encodedEnvelope, "The encrypted save envelope");
  let envelope;

  try {
    envelope = JSON.parse(SAVE_CODEC_TEXT_DECODER.decode(envelopeBytes));
  } catch (error) {
    throw new Error("The encrypted save envelope is malformed.");
  }

  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) {
    throw new Error("The encrypted save envelope is invalid.");
  }

  const allowedKeys = [
    "version",
    "compression",
    "encryption",
    "kdf",
    "iterations",
    "salt",
    "iv",
    "data"
  ];

  if (Object.keys(envelope).some((key) => !allowedKeys.includes(key))) {
    throw new Error("The encrypted save envelope contains unsupported data.");
  }

  if (
    envelope.version !== SAVE_EXPORT_VERSION ||
    envelope.compression !== SAVE_EXPORT_COMPRESSION ||
    envelope.encryption !== SAVE_EXPORT_ENCRYPTION ||
    envelope.kdf !== SAVE_EXPORT_KDF ||
    envelope.iterations !== SAVE_EXPORT_PBKDF2_ITERATIONS
  ) {
    throw new Error("The encrypted save format is unsupported.");
  }

  const salt = decodeSaveBase64Url(envelope.salt, "The encrypted save salt");
  const iv = decodeSaveBase64Url(envelope.iv, "The encrypted save initialization vector");
  const encryptedData = decodeSaveBase64Url(envelope.data, "The encrypted save payload");

  if (
    salt.byteLength !== SAVE_EXPORT_SALT_LENGTH ||
    iv.byteLength !== SAVE_EXPORT_IV_LENGTH ||
    encryptedData.byteLength <= 16
  ) {
    throw new Error("The encrypted save envelope is invalid.");
  }

  return {
    salt,
    iv,
    encryptedData
  };
}

/* ==========================================================
   8. SAVE ENCRYPTION
========================================================== */

async function createEncryptedSaveExportString(exportPackage) {
  requireEncryptedSaveSupport();

  const serializedPackage = JSON.stringify(exportPackage);
  const plaintextBytes = SAVE_CODEC_TEXT_ENCODER.encode(serializedPackage);

  if (plaintextBytes.byteLength > MAX_DECOMPRESSED_SAVE_BYTES) {
    throw new Error("The save data is too large to export.");
  }

  const compressedBytes = await compressSaveBytes(plaintextBytes);
  const salt = crypto.getRandomValues(new Uint8Array(SAVE_EXPORT_SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(SAVE_EXPORT_IV_LENGTH));
  const encryptionKey = await deriveSaveExportKey(salt);
  const encryptedBuffer = await crypto.subtle.encrypt(
    getSaveExportAesParameters(iv),
    encryptionKey,
    compressedBytes
  );

  const envelope = {
    version: SAVE_EXPORT_VERSION,
    compression: SAVE_EXPORT_COMPRESSION,
    encryption: SAVE_EXPORT_ENCRYPTION,
    kdf: SAVE_EXPORT_KDF,
    iterations: SAVE_EXPORT_PBKDF2_ITERATIONS,
    salt: encodeSaveBytesAsBase64Url(salt),
    iv: encodeSaveBytesAsBase64Url(iv),
    data: encodeSaveBytesAsBase64Url(new Uint8Array(encryptedBuffer))
  };

  const envelopeBytes = SAVE_CODEC_TEXT_ENCODER.encode(JSON.stringify(envelope));
  return SAVE_EXPORT_MAGIC + encodeSaveBytesAsBase64Url(envelopeBytes);
}

/* ==========================================================
   9. SAVE DECRYPTION
========================================================== */

async function decodeEncryptedSaveExportString(exportText) {
  requireEncryptedSaveSupport();

  const {
    salt,
    iv,
    encryptedData
  } = parseEncryptedSaveEnvelope(exportText);

  const encryptionKey = await deriveSaveExportKey(salt);
  let compressedBuffer;

  try {
    compressedBuffer = await crypto.subtle.decrypt(
      getSaveExportAesParameters(iv),
      encryptionKey,
      encryptedData
    );
  } catch (error) {
    throw new Error("The encrypted save was modified, corrupted, or created with an unsupported key.");
  }

  let plaintextBytes;

  try {
    plaintextBytes = await decompressSaveBytes(new Uint8Array(compressedBuffer));
  } catch (error) {
    throw new Error("The encrypted save payload could not be decompressed.");
  }

  try {
    return JSON.parse(SAVE_CODEC_TEXT_DECODER.decode(plaintextBytes));
  } catch (error) {
    throw new Error("The decrypted save package is malformed.");
  }
}
