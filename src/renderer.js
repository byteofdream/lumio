const addressInput = document.getElementById("addressInput");
const backBtn = document.getElementById("backBtn");
const forwardBtn = document.getElementById("forwardBtn");
const reloadBtn = document.getElementById("reloadBtn");
const homeBtn = document.getElementById("homeBtn");
const settingsBtn = document.getElementById("settingsBtn");
const clock = document.getElementById("clock");
const toolbar = document.getElementById("toolbar");
const tabsList = document.getElementById("tabsList");
const newTabBtn = document.getElementById("newTabBtn");
const webviewsContainer = document.getElementById("webviewsContainer");

const LUMIO_SEARCH_PAGE = new URL("./search.html", window.location.href).toString();
const DEFAULT_SEARCH_THEME = "morph-glass";

let settings = null;
let tabSeq = 0;
let activeTabId = null;
const tabs = [];

function buildSearchPageUrl(theme) {
  const next = new URL(LUMIO_SEARCH_PAGE);
  next.searchParams.set("theme", theme || DEFAULT_SEARCH_THEME);
  return next.toString();
}

function resolveSpecialUrl(url) {
  const text = (url || "").trim();
  if (text.startsWith("lumio://search")) {
    return buildSearchPageUrl(settings?.searchTheme || DEFAULT_SEARCH_THEME);
  }
  return text;
}

function displayAddressUrl(url) {
  const text = (url || "").trim();
  if (!text) return "";
  const normalize = (v) => v.split("#")[0].split("?")[0];
  if (normalize(text) === normalize(LUMIO_SEARCH_PAGE)) return "lumio://search";
  return text;
}

function isLumioSearchUrl(url) {
  return displayAddressUrl(url) === "lumio://search";
}

function normalizeDestination(raw) {
  const text = (raw || "").trim();
  if (!text) return resolveSpecialUrl(settings.homeUrl);
  if (text.startsWith("lumio://search")) return resolveSpecialUrl(text);
  if (text.startsWith("http://") || text.startsWith("https://")) return text;
  if (text.startsWith("file://")) return text;
  if (text.includes(".") && !text.includes(" ")) return `https://${text}`;
  return settings.searchTemplate.replace("{query}", encodeURIComponent(text));
}

function getActiveTab() {
  return tabs.find((t) => t.id === activeTabId) || null;
}

function getActiveWebview() {
  return getActiveTab()?.webview || null;
}

function renderTabs() {
  tabsList.innerHTML = "";
  for (const tab of tabs) {
    const el = document.createElement("div");
    el.className = `tab ${tab.id === activeTabId ? "active" : ""}`;
    el.innerHTML = `
      <span class="tab-title">${tab.title || "New Tab"}</span>
      <button class="tab-close" title="Close tab">&times;</button>
    `;
    el.addEventListener("click", () => activateTab(tab.id));
    el.querySelector(".tab-close").addEventListener("click", (e) => {
      e.stopPropagation();
      closeTab(tab.id);
    });
    tabsList.appendChild(el);
  }
}

function syncAddressFromActiveTab() {
  const tab = getActiveTab();
  if (!tab) return;
  addressInput.value = displayAddressUrl(tab.url || "");
}

function updateNavButtons() {
  const tab = getActiveTab();
  if (!tab || !tab.ready) {
    backBtn.disabled = true;
    forwardBtn.disabled = true;
    return;
  }

  const wv = tab.webview;
  const canBack = typeof wv.canGoBack === "function" ? wv.canGoBack() : false;
  const canForward = typeof wv.canGoForward === "function" ? wv.canGoForward() : false;
  backBtn.disabled = !canBack;
  forwardBtn.disabled = !canForward;
}

function activateTab(tabId) {
  activeTabId = tabId;
  for (const tab of tabs) {
    tab.webview.classList.toggle("active", tab.id === tabId);
  }
  renderTabs();
  syncAddressFromActiveTab();
  updateNavButtons();
}

function createTab(initialRawUrl = settings.homeUrl) {
  const id = `tab-${++tabSeq}`;
  const url = normalizeDestination(initialRawUrl);
  const webview = document.createElement("webview");
  webview.className = "webview";
  webview.setAttribute("allowpopups", "");
  webview.src = url;
  webviewsContainer.appendChild(webview);

  const tab = { id, url, title: "New Tab", webview, ready: false };
  tabs.push(tab);

  webview.addEventListener("did-navigate", () => {
    tab.url = tab.ready && typeof webview.getURL === "function" ? webview.getURL() : webview.src || tab.url;
    if (tab.id === activeTabId) syncAddressFromActiveTab();
    updateNavButtons();
  });

  webview.addEventListener("did-navigate-in-page", () => {
    tab.url = tab.ready && typeof webview.getURL === "function" ? webview.getURL() : webview.src || tab.url;
    if (tab.id === activeTabId) syncAddressFromActiveTab();
    updateNavButtons();
  });

  webview.addEventListener("page-title-updated", (evt) => {
    tab.title = evt.title || "New Tab";
    renderTabs();
  });

  webview.addEventListener("dom-ready", () => {
    tab.ready = true;
    if (!tab.title || tab.title === "New Tab") {
      tab.title = displayAddressUrl(tab.url || "New Tab");
    }
    renderTabs();
    updateNavButtons();
  });

  activateTab(id);
}

function closeTab(tabId) {
  const idx = tabs.findIndex((t) => t.id === tabId);
  if (idx < 0) return;
  const [tab] = tabs.splice(idx, 1);
  tab.webview.remove();

  if (!tabs.length) {
    createTab(settings.homeUrl);
    return;
  }

  if (activeTabId === tabId) {
    const fallback = tabs[Math.max(0, idx - 1)];
    activateTab(fallback.id);
  } else {
    renderTabs();
  }
}

function navigateTo(raw) {
  const tab = getActiveTab();
  if (!tab) return;
  const url = normalizeDestination(raw);
  tab.url = url;
  tab.webview.src = url;
  addressInput.value = displayAddressUrl(url);
  tab.title = "Loading...";
  renderTabs();
}

function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  clock.textContent = `${hh}:${mm}`;
}

function applySettingsToUI(nextSettings) {
  settings = nextSettings;
  clock.style.display = settings.showClock ? "grid" : "none";
  toolbar.classList.toggle("compact", !!settings.compactMode);
}

function bindNavigationEvents() {
  backBtn.addEventListener("click", () => {
    const tab = getActiveTab();
    if (!tab || !tab.ready) return;
    const wv = tab.webview;
    if (typeof wv.goBack === "function") wv.goBack();
  });

  forwardBtn.addEventListener("click", () => {
    const tab = getActiveTab();
    if (!tab || !tab.ready) return;
    const wv = tab.webview;
    if (typeof wv.goForward === "function") wv.goForward();
  });

  reloadBtn.addEventListener("click", () => {
    const tab = getActiveTab();
    if (!tab || !tab.ready) return;
    const wv = tab.webview;
    if (typeof wv.reload === "function") wv.reload();
    else if (wv.src) wv.src = wv.src;
  });

  homeBtn.addEventListener("click", () => navigateTo(settings.homeUrl));
  settingsBtn.addEventListener("click", () => {
    if (typeof window.lumio.openSettingsWindow === "function") {
      window.lumio.openSettingsWindow();
    }
  });
  newTabBtn.addEventListener("click", () => createTab("lumio://search"));

  addressInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") navigateTo(addressInput.value);
  });
}

async function boot() {
  try {
    if (!window.lumio || typeof window.lumio.getSettings !== "function") {
      throw new Error("preload bridge is missing (window.lumio unavailable)");
    }
    settings = await window.lumio.getSettings();
    if (isLumioSearchUrl(settings.homeUrl)) settings.homeUrl = "lumio://search";
    settings.searchTheme = settings.searchTheme || DEFAULT_SEARCH_THEME;
    applySettingsToUI(settings);
    if (typeof window.lumio.onSettingsUpdated === "function") {
      window.lumio.onSettingsUpdated((nextSettings) => {
        applySettingsToUI({
          ...nextSettings,
          searchTheme: nextSettings.searchTheme || DEFAULT_SEARCH_THEME
        });
        for (const tab of tabs) {
          if (isLumioSearchUrl(tab.url)) {
            tab.url = resolveSpecialUrl("lumio://search");
            tab.webview.src = tab.url;
          }
        }
        const active = getActiveTab();
        if (active && isLumioSearchUrl(active.url)) {
          addressInput.value = "lumio://search";
        }
      });
    }
    bindNavigationEvents();
    updateClock();
    setInterval(updateClock, 1000);
    createTab(settings.homeUrl);
  } catch (err) {
    document.body.innerHTML = `
      <div style="padding:24px;font-family:Segoe UI,sans-serif;color:#eaf3ff;background:#0b1320;min-height:100vh;">
        <h2 style="margin:0 0 10px;">Lumio startup error</h2>
        <pre style="white-space:pre-wrap;color:#ffb4b4;">${String(err)}</pre>
      </div>
    `;
  }
}

boot();
