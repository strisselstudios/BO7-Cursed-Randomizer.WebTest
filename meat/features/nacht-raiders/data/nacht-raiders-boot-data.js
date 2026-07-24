/* ==========================================================
   1. BOOT-SEQUENCE MODES AND COLORS
   ----------------------------------------------------------
   MODE_CHARACTER:
   Types the message one character at a time.

   MODE_LINE:
   Prints the complete message immediately, then continues.

   Tones control only presentation. They do not change timing.
========================================================== */

const NACHT_RAIDERS_BOOT_MODE_CHARACTER =
  "character";

const NACHT_RAIDERS_BOOT_MODE_LINE =
  "line";

const NACHT_RAIDERS_BOOT_TONE_DEFAULT =
  "default";

const NACHT_RAIDERS_BOOT_TONE_MUTED =
  "muted";

const NACHT_RAIDERS_BOOT_TONE_PATH =
  "path";

const NACHT_RAIDERS_BOOT_TONE_WARNING =
  "warning";

const NACHT_RAIDERS_BOOT_TONE_ERROR =
  "error";

const NACHT_RAIDERS_BOOT_TONE_SUCCESS =
  "success";

/* ==========================================================
   2. BOOT-SEQUENCE TIMING AND COMPLETION TEXT
   ----------------------------------------------------------
   All general boot timing remains editable here.

   The sequence never proceeds automatically. After reaching
   the ready state, it waits for player input.
========================================================== */

const NACHT_RAIDERS_BOOT_SETTINGS =
  Object.freeze({
    characterDelayMs: 7,

    characterJitterMs: 4,

    punctuationDelayMs: 22,

    lineDelayMs: 32,

    defaultPauseAfterLineMs: 45,

    readyPromptDelayMs: 180
  });

const NACHT_RAIDERS_BOOT_READY_LINE =
  Object.freeze({
    text:
      "Nacht Raiders.exe is ready",

    tone:
      NACHT_RAIDERS_BOOT_TONE_SUCCESS,

    mode:
      NACHT_RAIDERS_BOOT_MODE_CHARACTER,

    pauseAfterMs: 0
  });

const NACHT_RAIDERS_BOOT_PROCEED_TEXT =
  "click to proceed";

/* ==========================================================
   3. BOOT-SEQUENCE LINES
   ----------------------------------------------------------
   Nacht Raiders startup diagnostics.

   Character mode:
   Types the entry one character at a time.

   Line mode:
   Prints the complete entry rapidly.

   Tones:
   default = standard green
   muted   = dim system text
   path    = pale file/path text
   warning = orange warning
   error   = red failure
   success = bright green confirmation
========================================================== */

const NACHT_RAIDERS_BOOT_LINES =
  Object.freeze([
    {
      text:
        "MEAT OPERATING SYSTEM [Version 115.935]",

      tone:
        NACHT_RAIDERS_BOOT_TONE_MUTED,

      mode:
        NACHT_RAIDERS_BOOT_MODE_CHARACTER,

      pauseAfterMs: 70
    },

    {
      text:
        "(C) BROKEN ARROW SYSTEMS. ALL RIGHTS RESERVED.",

      tone:
        NACHT_RAIDERS_BOOT_TONE_MUTED,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE,

      pauseAfterMs: 90
    },

    {
      text: "",

      tone:
        NACHT_RAIDERS_BOOT_TONE_DEFAULT,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE,

      pauseAfterMs: 35
    },

    {
      text:
        "C:\\MEAT\\AETHER>NACHT-RAIDERS.EXE",

      tone:
        NACHT_RAIDERS_BOOT_TONE_PATH,

      mode:
        NACHT_RAIDERS_BOOT_MODE_CHARACTER,

      pauseAfterMs: 130
    },

    {
      text:
        "INITIALIZING AETHER REPAIRMEN FIELD PROGRAM...",

      tone:
        NACHT_RAIDERS_BOOT_TONE_DEFAULT,

      mode:
        NACHT_RAIDERS_BOOT_MODE_CHARACTER,

      pauseAfterMs: 65
    },

    {
      text:
        "INITIALIZING Rushmore_PROTOCOL:741021",

      tone:
        NACHT_RAIDERS_BOOT_TONE_DEFAULT,

      mode:
        NACHT_RAIDERS_BOOT_MODE_CHARACTER,

      pauseAfterMs: 110
    },

    {
      text:
        "LOADING \\SYSTEM\\UNDEAD\\SHAMBLER_AI.DLL",

      tone:
        NACHT_RAIDERS_BOOT_TONE_PATH,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE
    },

    {
      text:
        "LOADING \\SYSTEM\\AETHER\\RIFT_DRIVER.SYS",

      tone:
        NACHT_RAIDERS_BOOT_TONE_PATH,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE
    },

    {
      text:
        "LOADING \\ENTITY\\ROTTEN_SOLDIER.BIN",

      tone:
        NACHT_RAIDERS_BOOT_TONE_PATH,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE
    },

    {
      text:
        "LOADING \\ENTITY\\CRAWLER_VARIANT_04.BIN",

      tone:
        NACHT_RAIDERS_BOOT_TONE_PATH,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE
    },

    {
      text:
        "LOADING \\WEAPONS\\FIELD_REPAIR_PROTOCOL.DAT",

      tone:
        NACHT_RAIDERS_BOOT_TONE_PATH,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE
    },

    {
      text:
        "Raygun.data...LOADING...LOADING...LOADING...",

      tone:
        NACHT_RAIDERS_BOOT_TONE_PATH,

      mode:
        NACHT_RAIDERS_BOOT_MODE_CHARACTER,

      pauseAfterMs: 120
    },

    {
      text:
        "ERROR: Raygun.data deleted by USER:\\S.A.M._PROTOCOL",

      tone:
        NACHT_RAIDERS_BOOT_TONE_ERROR,

      mode:
        NACHT_RAIDERS_BOOT_MODE_CHARACTER,

      pauseAfterMs: 170
    },

    {
      text: "",

      tone:
        NACHT_RAIDERS_BOOT_TONE_DEFAULT,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE,

      pauseAfterMs: 30
    },

    {
      text:
        "C:\\Users\\M\\Desktop\\T.E.D.D_BloodHound_Industries.wav",

      tone:
        NACHT_RAIDERS_BOOT_TONE_PATH,

      mode:
        NACHT_RAIDERS_BOOT_MODE_CHARACTER,

      pauseAfterMs: 85
    },

    {
      text:
        "AUDIO ARCHIVE DETECTED: BLOODHOUND INDUSTRIES",

      tone:
        NACHT_RAIDERS_BOOT_TONE_DEFAULT,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE
    },

    {
      text:
        "WARNING: DRIVER VOICEPRINT CORRUPTED",

      tone:
        NACHT_RAIDERS_BOOT_TONE_WARNING,

      mode:
        NACHT_RAIDERS_BOOT_MODE_CHARACTER,

      pauseAfterMs: 95
    },

    {
      text:
        "C:\\Users\\Pernell\\CampEdward\\Avagadro\\6.022X10^²³mol^-1.exe",

      tone:
        NACHT_RAIDERS_BOOT_TONE_PATH,

      mode:
        NACHT_RAIDERS_BOOT_MODE_CHARACTER,

      pauseAfterMs: 120
    },

    {
      text:
        "WARNING: ELECTRICAL ENTITY CONTAINMENT UNSTABLE",

      tone:
        NACHT_RAIDERS_BOOT_TONE_WARNING,

      mode:
        NACHT_RAIDERS_BOOT_MODE_CHARACTER,

      pauseAfterMs: 110
    },

    {
      text:
        "ERROR: UNKNOWN AETHER SIGNATURE DETECTED",

      tone:
        NACHT_RAIDERS_BOOT_TONE_ERROR,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE,

      pauseAfterMs: 80
    },

    {
      text:
        "MOUNTING DIMENSION 63 COMBAT ARCHIVE...",

      tone:
        NACHT_RAIDERS_BOOT_TONE_DEFAULT,

      mode:
        NACHT_RAIDERS_BOOT_MODE_CHARACTER,

      pauseAfterMs: 80
    },

    {
      text:
        "VERIFYING REPAIRMAN WEAPON CACHE...",

      tone:
        NACHT_RAIDERS_BOOT_TONE_DEFAULT,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE
    },

    {
      text:
        "VERIFYING HOSTILE ENTITY TABLE...",

      tone:
        NACHT_RAIDERS_BOOT_TONE_DEFAULT,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE
    },

    {
      text:
        "File_path:-Secure the keys/Ascend from darkness/Rain fire/Unleash the horde/Skewer the winged beast/Wield a fist of iron/Raise hell/Freedom-",

      tone:
        NACHT_RAIDERS_BOOT_TONE_PATH,

      mode:
        NACHT_RAIDERS_BOOT_MODE_CHARACTER,

      pauseAfterMs: 180
    },

    {
      text:
        "QUEST DIRECTIVE ARCHIVE LOCATED",

      tone:
        NACHT_RAIDERS_BOOT_TONE_SUCCESS,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE,

      pauseAfterMs: 75
    },

    {
      text: "",

      tone:
        NACHT_RAIDERS_BOOT_TONE_DEFAULT,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE,

      pauseAfterMs: 30
    },

    {
      text:
        "THEFLESH_THEFLESH_THEFLESH_THEFLESH_THEFL_",

      tone:
        NACHT_RAIDERS_BOOT_TONE_WARNING,

      mode:
        NACHT_RAIDERS_BOOT_MODE_CHARACTER,

      pauseAfterMs: 80
    },

    {
      text:
        "ERROR: THE FLESH file absent",

      tone:
        NACHT_RAIDERS_BOOT_TONE_ERROR,

      mode:
        NACHT_RAIDERS_BOOT_MODE_CHARACTER,

      pauseAfterMs: 100
    },

    {
      text:
        "ERROR: DELETE QUERY RECEIVED",

      tone:
        NACHT_RAIDERS_BOOT_TONE_ERROR,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE,

      pauseAfterMs: 60
    },

    {
      text:
        ">>delete query?:________",

      tone:
        NACHT_RAIDERS_BOOT_TONE_WARNING,

      mode:
        NACHT_RAIDERS_BOOT_MODE_CHARACTER,

      pauseAfterMs: 200
    },

    {
      text:
        "QUERY RESPONSE: DENIED",

      tone:
        NACHT_RAIDERS_BOOT_TONE_ERROR,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE,

      pauseAfterMs: 80
    },

    {
      text:
        "ATTEMPTING FIELD RECONSTRUCTION...",

      tone:
        NACHT_RAIDERS_BOOT_TONE_DEFAULT,

      mode:
        NACHT_RAIDERS_BOOT_MODE_CHARACTER,

      pauseAfterMs: 105
    },

    {
      text:
        "RECONSTRUCTING LIMBIC RESPONSE TABLE",

      tone:
        NACHT_RAIDERS_BOOT_TONE_DEFAULT,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE
    },

    {
      text:
        "RECONSTRUCTING UNDEAD BEHAVIOR TABLE",

      tone:
        NACHT_RAIDERS_BOOT_TONE_DEFAULT,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE
    },

    {
      text:
        "RECONSTRUCTING RAID PROTOCOL",

      tone:
        NACHT_RAIDERS_BOOT_TONE_DEFAULT,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE
    },

    {
      text:
        "NoOneEscapesAliveNoOneEscapesAliveNoOneEscapesAliveNoOneEscapesAlive",

      tone:
        NACHT_RAIDERS_BOOT_TONE_ERROR,

      mode:
        NACHT_RAIDERS_BOOT_MODE_CHARACTER,

      pauseAfterMs: 45
    },

    {
      text:
        "NoOneEscapesAliveNoOneEscapesAliveNoOneEscapesAliveNoOneEscapesAliveNoOneEscapes",

      tone:
        NACHT_RAIDERS_BOOT_TONE_ERROR,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE,

      pauseAfterMs: 30
    },

    {
      text:
        "AliveNoOneEscapesAliveNoOneEscapesAliveNoOneEscapesAlive",

      tone:
        NACHT_RAIDERS_BOOT_TONE_ERROR,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE,

      pauseAfterMs: 30
    },

    
{
      text:
        "AliveNoOneEscapesAliveNoOneEscapesAliveNoOneEscapesAliveNoOne",

      tone:
        NACHT_RAIDERS_BOOT_TONE_ERROR,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE,

      pauseAfterMs: 30
    },
    {
      text:
        "EscapesAliveNoOneEscapesAliveNoOneEscapesAliveNoOneEscapesAliveNoOneEscapesAlive",

      tone:
        NACHT_RAIDERS_BOOT_TONE_ERROR,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE,

      pauseAfterMs: 160
    },

    {
      text: "",

      tone:
        NACHT_RAIDERS_BOOT_TONE_DEFAULT,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE,

      pauseAfterMs: 35
    },

    {
      text:
        "TERMINATING UNAUTHORIZED MESSAGE LOOP...",

      tone:
        NACHT_RAIDERS_BOOT_TONE_WARNING,

      mode:
        NACHT_RAIDERS_BOOT_MODE_CHARACTER,

      pauseAfterMs: 100
    },

    {
      text:
        "MESSAGE LOOP TERMINATED",

      tone:
        NACHT_RAIDERS_BOOT_TONE_SUCCESS,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE,

      pauseAfterMs: 80
    },

    {
      text:
        "RAID PROTOCOL ONLINE",

      tone:
        NACHT_RAIDERS_BOOT_TONE_SUCCESS,

      mode:
        NACHT_RAIDERS_BOOT_MODE_CHARACTER,

      pauseAfterMs: 90
    },

    {
      text:
        "AETHER REPAIRMEN DEPLOYMENT AUTHORIZED",

      tone:
        NACHT_RAIDERS_BOOT_TONE_SUCCESS,

      mode:
        NACHT_RAIDERS_BOOT_MODE_LINE,

      pauseAfterMs: 70
    }
  ]);
