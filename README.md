# Lumio

Lumio is a custom browser shell built with **Electron**.
It includes a styled top toolbar, tabs, a custom search page, and a separate settings window.

## Features

- Multi-tab browsing
- Navigation controls: Back / Forward / Reload / Home
- Address bar with URL + search input
- Custom search start page (`lumio://search`)
- Search commands on the start page (`!g`, `!yt`, `!gh`, `!w`)
- Search theme switching (`Morph Glass`, `Neon Grid`)
- Separate Settings window (not embedded in the main UI)
- Clock in toolbar (toggleable)
- Compact toolbar mode
- Native Electron app menu removed (`File / Edit / ...`)

## Tech Stack

- Electron
- Vanilla HTML/CSS/JS
- `<webview>`-based tab rendering
- JSON settings storage in Electron `userData`

## Project Structure

```text
.
├─ main.js               # Electron main process (windows + IPC)
├─ preload.js            # Secure bridge API exposed to renderer
├─ settings-store.js     # Settings persistence (read/write/update)
├─ package.json
└─ src
   ├─ index.html         # Main browser window UI
   ├─ renderer.js        # Tabs + navigation logic
   ├─ styles.css         # Main window styling
   ├─ search.html        # Custom search page
   ├─ search-morph.css   # Morph Glass theme
   ├─ search-neon.css    # Neon Grid theme
   ├─ settings.html      # Separate settings window
   ├─ settings.css       # Settings window styling
   └─ settings-page.js   # Settings page logic
```

## Requirements

- Node.js 18+ (LTS recommended)
- npm

## Run Locally

```bash
npm install
npm run dev
```

## Settings

Click **Settings** in the top-right corner of the toolbar.
This opens a separate settings window where you can update:

- Home page
- Search template (`{query}` placeholder required)
- Search page theme
- Show clock
- Compact toolbar

Settings are saved to:

- `userData/settings.json` (managed by Electron)

## Notes

- The start page alias `lumio://search` is internally resolved to `src/search.html`.
- Search theme is passed to the search page through a query parameter.
- Tabs are implemented as independent `<webview>` elements, with one active at a time.

## Roadmap Ideas

- Drag-and-drop tab reordering
- Pinned tabs
- Session restore
- Download manager
- Per-tab mute / permissions UI

