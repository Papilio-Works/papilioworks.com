const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

if (!process.env.PAPILIO_SCREENSHOT_USER_DATA || !process.env.PAPILIO_SCREENSHOT_LOADER_REPO) {
  throw new Error("Launch through capture-loader-screenshots.mjs.");
}
app.setPath("userData", process.env.PAPILIO_SCREENSHOT_USER_DATA);
const root = path.join(process.env.PAPILIO_SCREENSHOT_LOADER_REPO, "apps", "web");
const records = [
  {
    id: "example-fpga", originalFilename: "a2600nano_retrocade.bin", deviceType: "fpga",
    description: "Atari 2600 core for Papilio Retrocade",
    fileSize: fs.statSync(path.join(root, "getting-started", "firmware", "a2600nano_retrocade.bin")).size,
    createdAt: "2026-10-04T12:00:00Z",
  },
  {
    id: "example-esp32", originalFilename: "papilio-migration-v2.0.0-merged.bin", deviceType: "esp32",
    description: "First-time installation: ESP Bootloader + FPGA-Companion",
    fileSize: fs.statSync(path.join(root, "getting-started", "firmware", "papilio-migration-v2.0.0-merged.bin")).size,
    createdAt: "2026-10-04T11:00:00Z",
  },
];

app.whenReady().then(async () => {
  ipcMain.handle("papilio:saved-files-list", (_event, type) => records.filter((record) => !type || record.deviceType === type));
  ipcMain.handle("papilio:saved-files-read", (_event, id) => {
    const record = records.find((item) => item.id === id);
    if (!record) throw new Error("Unknown example file.");
    return { record, data: fs.readFileSync(path.join(root, "getting-started", "firmware", record.originalFilename)) };
  });
  ipcMain.handle("papilio:wifi-log-subscribe", (event) => {
    event.sender.send("papilio:wifi-log-status", { type: "connected", message: "Listening on UDP 7777" });
    const lines = [
      "\x1b[32mExample log - documentation screenshot (not a live board)\x1b[0m",
      "I (120) boot: ESP32-S3 startup",
      "I (360) main: Starting FPGA-Companion",
      "I (540) wifi: Connected to configured network",
      "\x1b[33mSDC: drive 0 inserted\x1b[0m",
      "SDC: file opened: /roms/a2600crt.bin",
      "\x1b[32mSYS: system ready\x1b[0m",
      "Entering main loop",
    ];
    for (const line of lines) event.sender.send("papilio:wifi-log-line", line);
    return true;
  });
  ipcMain.handle("papilio:wifi-log-unsubscribe", () => {});
  let popup = null;
  ipcMain.handle("papilio:wifi-log-open-window", async () => {
    if (popup) { popup.focus(); return; }
    popup = createWindow(true);
    popup.on("closed", () => { popup = null; });
    await popup.loadFile(path.join(root, "wifi-log", "index.html"));
  });
  const main = createWindow(false);
  await main.loadFile(path.join(root, "loader", "index.html"));
});

function createWindow(popout) {
  const window = new BrowserWindow({
    width: 1280,
    height: popout ? 800 : 900,
    useContentSize: true,
    webPreferences: {
      preload: path.join(process.env.PAPILIO_SCREENSHOT_LOADER_REPO, "apps", "desktop", "dist", "preload", "index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  return window;
}

app.on("window-all-closed", () => app.quit());
