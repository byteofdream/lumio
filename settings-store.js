const fs = require("fs");
const path = require("path");

const DEFAULT_SETTINGS = {
  homeUrl: "lumio://search",
  showClock: true,
  compactMode: false,
  searchTemplate: "https://www.google.com/search?q={query}",
  searchTheme: "morph-glass"
};

function createSettingsStore(app) {
  function settingsPath() {
    return path.join(app.getPath("userData"), "settings.json");
  }

  function read() {
    try {
      const raw = fs.readFileSync(settingsPath(), "utf8");
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function write(next) {
    fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
    fs.writeFileSync(settingsPath(), JSON.stringify(next, null, 2), "utf8");
  }

  function update(patch) {
    const merged = { ...read(), ...(patch || {}) };
    write(merged);
    return merged;
  }

  return { read, write, update, DEFAULT_SETTINGS };
}

module.exports = { createSettingsStore };
