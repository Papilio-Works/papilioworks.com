import { _electron } from "playwright-core";
import { createRequire } from "node:module";
import { mkdtemp, mkdir, rm, access, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const loaderRepo = path.resolve(process.argv[2] || "C:\\development\\papilio-loader-mcp");
const { version } = JSON.parse(await readFile(path.join(loaderRepo, "apps", "web", "package.json"), "utf8"));
const outDir = path.resolve(scriptDir, "..", "..", "docs-src", "static", "img", "papilio-loader");
const requireLoader = createRequire(path.join(loaderRepo, "package.json"));
const electron = requireLoader("electron");
const userData = await mkdtemp(path.join(os.tmpdir(), "papilio-docs-screenshots-"));
const env = {
  ...process.env,
  PAPILIO_SCREENSHOT_USER_DATA: userData,
  PAPILIO_SCREENSHOT_LOADER_REPO: loaderRepo,
};
delete env.ELECTRON_RUN_AS_NODE;
let desktop;

try {
  await access(path.join(loaderRepo, "apps", "desktop", "dist", "preload", "index.js"));
  await mkdir(outDir, { recursive: true });
  desktop = await _electron.launch({
    executablePath: electron,
    args: [path.join(scriptDir, "loader-screenshot-host.cjs")],
    env,
  });
  const page = await desktop.firstWindow();
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await page.locator("#saved-files-list .saved-file-card").first().waitFor({ state: "attached" });
  await page.locator("#wifi-log-panel [data-output]").getByText("Entering main loop").waitFor();
  const shot = async (name, locator) => {
    const options = { path: path.join(outDir, `${name}.png`), animations: "disabled", scale: "css" };
    if (locator) await locator.screenshot(options);
    else await page.screenshot({ ...options, fullPage: true });
    console.log(`Captured ${name}.png`);
  };

  await shot("loader-desktop");
  await shot("fpga-card", page.locator("#card-fpga"));
  await page.locator("#saved-files-panel").evaluate((el) => { el.open = true; });
  await page.locator(".saved-file-card").filter({ hasText: "papilio-migration" }).getByRole("button", { name: "Load", exact: true }).click();
  await page.locator("#btn-flash-esp32").waitFor({ state: "visible" });
  await page.waitForFunction(() => !document.querySelector("#btn-flash-esp32").disabled);
  await page.locator("#esp32-save").check();
  await shot("esp32-save-library", page.locator("#card-esp32"));
  await shot("saved-files-library", page.locator("#saved-files-panel"));
  await shot("wifi-log-inline", page.locator("#wifi-log-panel"));
  await page.locator("#loader-advanced").evaluate((el) => { el.open = true; });
  await shot("advanced-options", page.locator("#loader-advanced"));

  const popupPromise = desktop.waitForEvent("window");
  await page.locator("#wifi-log-panel").getByRole("button", { name: "Pop Out", exact: true }).click();
  const popup = await popupPromise;
  await popup.locator("[data-output]").getByText("Entering main loop").waitFor();
  await popup.screenshot({ path: path.join(outDir, "wifi-log-window.png"), animations: "disabled", scale: "css" });
  console.log("Captured wifi-log-window.png");

  const webPromise = desktop.waitForEvent("window");
  await desktop.evaluate(({ BrowserWindow }) => {
    const window = new BrowserWindow({
      width: 1280, height: 900, useContentSize: true,
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
    });
    void window.loadURL("about:blank");
  });
  const web = await webPromise;
  await web.goto("https://papilioworks.com/loader/", { waitUntil: "domcontentloaded" });
  await web.waitForFunction((version) => document.querySelector("#app-version").textContent === `v${version}`, version);
  if (await web.locator("#saved-files-panel").isVisible()) throw new Error("Web screenshot must not show desktop controls.");
  await web.screenshot({ path: path.join(outDir, "loader-web.png"), fullPage: true, animations: "disabled", scale: "css" });
  console.log("Captured loader-web.png");
  if (errors.length) throw new Error(`Desktop renderer errors: ${errors.join("; ")}`);
} finally {
  await desktop?.close();
  await rm(userData, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
