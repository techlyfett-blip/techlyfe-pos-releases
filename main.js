// Tech Lyfe TT POS — Electron desktop shell.
// A thin native window around the hosted POS web app. It frames the site,
// keeps receipt printing working, shows the app version, and auto-updates
// itself when a new release is published.

const { app, BrowserWindow, Menu, shell, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const fs = require("fs");
const path = require("path");

const DEFAULT_URL = "https://techlyfe-pos-production.up.railway.app";
const VERSION = app.getVersion();

function resolveUrl() {
  if (process.env.POS_URL) return process.env.POS_URL;
  try {
    const cfgPath = path.join(app.getPath("userData"), "config.json");
    if (fs.existsSync(cfgPath)) {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
      if (cfg.url) return cfg.url;
    }
  } catch {
    // ignore malformed config
  }
  if (!app.isPackaged) return "http://localhost:3000";
  return DEFAULT_URL;
}

let win;

// ----- Auto-update -----
let updateState = "idle"; // idle | checking | available | downloading | ready | none | error

function setupAutoUpdate() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => (updateState = "checking"));
  autoUpdater.on("update-available", () => (updateState = "downloading"));
  autoUpdater.on("update-not-available", () => (updateState = "none"));
  autoUpdater.on("error", () => (updateState = "error"));
  autoUpdater.on("update-downloaded", (info) => {
    updateState = "ready";
    dialog
      .showMessageBox(win, {
        type: "info",
        title: "Update ready",
        message: `A new version (${info.version}) of Tech Lyfe TT POS is ready.`,
        detail: "Restart now to install it, or it will install when you next close the app.",
        buttons: ["Restart now", "Later"],
        defaultId: 0,
      })
      .then((r) => {
        if (r.response === 0) autoUpdater.quitAndInstall();
      });
  });

  // Only check when packaged (auto-update can't run in dev).
  if (app.isPackaged) {
    autoUpdater.checkForUpdates().catch(() => (updateState = "error"));
    // Re-check every 6 hours while the app stays open.
    setInterval(() => {
      autoUpdater.checkForUpdates().catch(() => {});
    }, 6 * 60 * 60 * 1000);
  }
}

function manualCheck() {
  if (!app.isPackaged) {
    dialog.showMessageBox(win, {
      type: "info",
      title: "Updates",
      message: "Updates only work in the installed app, not in dev mode.",
    });
    return;
  }
  autoUpdater
    .checkForUpdates()
    .then((res) => {
      const latest = res && res.updateInfo && res.updateInfo.version;
      if (!latest || latest === VERSION) {
        dialog.showMessageBox(win, {
          type: "info",
          title: "Up to date",
          message: `You're on the latest version (v${VERSION}).`,
        });
      }
      // If an update IS available, the 'update-downloaded' handler prompts.
    })
    .catch(() => {
      dialog.showMessageBox(win, {
        type: "warning",
        title: "Update check failed",
        message: "Couldn't check for updates. Check the internet connection.",
      });
    });
}

function showAbout() {
  dialog.showMessageBox(win, {
    type: "info",
    title: "About Tech Lyfe TT POS",
    message: "Tech Lyfe TT POS",
    detail: `Version ${VERSION}\n\n© Tech Lyfe TT`,
    buttons: ["OK"],
  });
}

function buildMenu(url) {
  const menu = Menu.buildFromTemplate([
    {
      label: "POS",
      submenu: [
        { label: "Reload", accelerator: "F5", click: () => win.reload() },
        {
          label: "Toggle Fullscreen",
          accelerator: "F11",
          click: () => win.setFullScreen(!win.isFullScreen()),
        },
        { type: "separator" },
        { label: "Check for Updates…", click: manualCheck },
        { label: `About (v${VERSION})`, click: showAbout },
        { type: "separator" },
        { role: "quit" },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  win = new BrowserWindow({
    width: 1366,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#fafafa",
    title: `Tech Lyfe TT POS  v${VERSION}`,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const url = resolveUrl();
  win.loadURL(url).catch(() => {
    dialog.showErrorBox(
      "Can't reach the POS server",
      `Tried to open:\n${url}\n\nCheck the internet connection, or set the correct URL in config.json.`
    );
  });

  // Keep the version in the title even if the page tries to change it.
  win.on("page-title-updated", (e) => {
    e.preventDefault();
    win.setTitle(`Tech Lyfe TT POS  v${VERSION}`);
  });

  win.webContents.setWindowOpenHandler(({ url: target }) => {
    if (target.startsWith(url)) return { action: "allow" };
    shell.openExternal(target);
    return { action: "deny" };
  });

  buildMenu(url);

  win.on("closed", () => {
    win = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdate();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
