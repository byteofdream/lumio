const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");
const { createSettingsStore } = require("./settings-store");

let settingsWindow = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 980,
    minHeight: 620,
    title: "Lumio",
    backgroundColor: "#0b1320",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: false,
      webviewTag: true
    }
  });

  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, "src", "index.html"));
}

function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 560,
    height: 560,
    minWidth: 460,
    minHeight: 460,
    title: "Lumio Settings",
    backgroundColor: "#0b1320",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: false
    }
  });

  settingsWindow.loadFile(path.join(__dirname, "src", "settings.html"));
  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);

  const settingsStore = createSettingsStore(app);

  ipcMain.handle("settings:get", () => settingsStore.read());
  ipcMain.handle("settings:set", (_evt, patch) => {
    const next = settingsStore.update(patch);
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send("settings:updated", next);
    }
    return next;
  });
  ipcMain.handle("settings:open-window", () => {
    createSettingsWindow();
    return true;
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
