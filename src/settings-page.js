const homeInput = document.getElementById("homeInput");
const searchInput = document.getElementById("searchInput");
const searchThemeInput = document.getElementById("searchThemeInput");
const showClockInput = document.getElementById("showClockInput");
const compactInput = document.getElementById("compactInput");
const cancelBtn = document.getElementById("cancelBtn");
const saveBtn = document.getElementById("saveBtn");

const DEFAULT_SEARCH_THEME = "morph-glass";

function normalizeDestination(raw, settings) {
  const text = (raw || "").trim();
  if (!text) return settings.homeUrl || "lumio://search";
  if (text === "lumio://search") return text;
  if (text.startsWith("http://") || text.startsWith("https://")) return text;
  if (text.startsWith("file://")) return text;
  if (text.includes(".") && !text.includes(" ")) return `https://${text}`;
  return (settings.searchTemplate || "https://www.google.com/search?q={query}").replace(
    "{query}",
    encodeURIComponent(text)
  );
}

async function boot() {
  const settings = await window.lumio.getSettings();

  homeInput.value = settings.homeUrl || "lumio://search";
  searchInput.value = settings.searchTemplate || "https://www.google.com/search?q={query}";
  searchThemeInput.value = settings.searchTheme || DEFAULT_SEARCH_THEME;
  showClockInput.checked = !!settings.showClock;
  compactInput.checked = !!settings.compactMode;

  cancelBtn.addEventListener("click", () => window.close());

  saveBtn.addEventListener("click", async () => {
    const requestedHome = (homeInput.value || "").trim() || "lumio://search";
    const next = {
      homeUrl: requestedHome === "lumio://search" ? "lumio://search" : normalizeDestination(requestedHome, settings),
      searchTemplate: searchInput.value.includes("{query}")
        ? searchInput.value.trim()
        : "https://www.google.com/search?q={query}",
      searchTheme: searchThemeInput.value || DEFAULT_SEARCH_THEME,
      showClock: showClockInput.checked,
      compactMode: compactInput.checked
    };

    await window.lumio.saveSettings(next);
    window.close();
  });
}

boot();
