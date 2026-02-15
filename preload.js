const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("lumio", {
  getSettings: () => ipcRenderer.invoke("settings:get"),
  saveSettings: (patch) => ipcRenderer.invoke("settings:set", patch),
  openSettingsWindow: () => ipcRenderer.invoke("settings:open-window"),
  onSettingsUpdated: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("settings:updated", listener);
    return () => ipcRenderer.removeListener("settings:updated", listener);
  }
});
