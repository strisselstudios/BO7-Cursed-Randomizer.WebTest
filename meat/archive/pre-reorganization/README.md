# MEAT.exe Pre-Reorganization Rollback Sources

These files are preserved copies of the former oversized source files.

They are not loaded by `meat.html`. Their active replacements are the organized files listed below.

| Archived file | Former path | Active replacement |
|---|---|---|
| `css/components/producer-info.css` | `meat/css/components/producer-info.css` | `meat/css/components/producer-info/producer-info-index.css` |
| `css/components/store.css` | `meat/css/components/store.css` | `meat/css/components/store/store-index.css` |
| `css/responsive/store-layout.css` | `meat/css/responsive/store-layout.css` | `meat/css/responsive/store-layout/store-layout-index.css` |
| `js/core/save-system.js` | `meat/js/core/save-system.js` | `meat/js/core/save-system/*.js` |
| `js/ui/game-display.js` | `meat/js/ui/game-display.js` | `meat/js/ui/game-display/*.js` |
| `js/ui/producer-info.js` | `meat/js/ui/producer-info.js` | `meat/js/ui/producer-info/*.js` |

## Rules

1. Do not link or execute archived files.
2. Do not edit archived files as active source.
3. Restore an archived file only as part of an intentional rollback.
4. Keep the organized active files as the canonical development source.
5. Do not place new features in this archive.
