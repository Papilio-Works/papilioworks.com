// loader.js — Papilio Works "Loader — Web Edition"
//
// A browser-only re-implementation of the Papilio Loader desktop app's Device
// Flash Manager: explicit USB/Serial vs OTA/WiFi method selection per card,
// an ESP32 "fetch latest official release" shortcut, and a color-coded status
// log — all via WebSerial (esptool-js) + fetch()/XHR, no local agent.
//
// Device IP discovery deliberately does NOT scan the LAN (browsers can't) —
// it reuses the same "Find My IP" USB-serial trick as ../flash/flash.js.
//
// Requires Chrome or Edge (WebSerial + a secure/HTTPS context).
import { ESPLoader, Transport } from "https://unpkg.com/esptool-js@0.6.0/bundle.js";

const OTA_PORT = 3232;
const IP_REGEX = /WiFi connected - IP:\s*(\d{1,3}(?:\.\d{1,3}){3})/;
const RELEASE_API = "https://api.github.com/repos/Papilio-Retrocade/FPGA-Companion/releases/latest";

const els = {
  unsupportedBanner: document.getElementById("unsupported-banner"),
  log: document.getElementById("loader-log"),
  btnClearLog: document.getElementById("btn-clear-log"),

  btnConnect: document.getElementById("btn-connect"),
  btnFindIp: document.getElementById("btn-find-ip"),
  statusConnect: document.getElementById("status-connect"),
  wifiSsid: document.getElementById("wifi-ssid"),
  wifiPass: document.getElementById("wifi-pass"),
  btnSendWifi: document.getElementById("btn-send-wifi"),
  deviceIp: document.getElementById("device-ip"),
  deviceIpManual: document.getElementById("device-ip-manual"),
  btnUseManualIp: document.getElementById("btn-use-manual-ip"),

  fpgaFile: document.getElementById("fpga-file"),
  fpgaFileLabel: document.getElementById("fpga-file-label"),
  fpgaTarget: document.getElementById("fpga-target"),
  btnFlashFpga: document.getElementById("btn-flash-fpga"),
  progressFpga: document.getElementById("progress-fpga"),
  statusFpga: document.getElementById("status-fpga"),

  esp32ReleaseFields: document.getElementById("esp32-release-fields"),
  esp32UploadFields: document.getElementById("esp32-upload-fields"),
  btnFetchRelease: document.getElementById("btn-fetch-release"),
  esp32ReleaseLabel: document.getElementById("esp32-release-label"),
  esp32File: document.getElementById("esp32-file"),
  esp32FileLabel: document.getElementById("esp32-file-label"),
  btnFlashEsp32: document.getElementById("btn-flash-esp32"),
  progressEsp32: document.getElementById("progress-esp32"),
  statusEsp32: document.getElementById("status-esp32"),
};

let serialPort = null;      // shared across the connect section + both cards
let espTransport = null;
let serialReadLoop = null;
let deviceIp = null;
let awaitingReconnect = false;
let esp32Release = null;    // { name, data: Uint8Array } once fetched

/* ---------------------------------------------------------------------- */
/* Logging — color-coded lines, matching the desktop app's status log       */
/* ---------------------------------------------------------------------- */

function log(line, kind) {
  if (!kind) {
    if (/error|failed|reject/i.test(line)) kind = "error";
    else if (/\bok\b|flashed|success|connected|saved/i.test(line)) kind = "success";
    else kind = "info";
  }
  const div = document.createElement("div");
  div.className = `log-line log-${kind}`;
  div.textContent = line;
  els.log.appendChild(div);
  els.log.scrollTop = els.log.scrollHeight;
}

els.btnClearLog.addEventListener("click", () => {
  els.log.textContent = "";
});

function setStatus(el, message, kind) {
  el.textContent = message;
  el.classList.remove("is-error", "is-ok");
  if (kind) el.classList.add(kind === "error" ? "is-error" : "is-ok");
}

/* ---------------------------------------------------------------------- */
/* Browser support check                                                    */
/* ---------------------------------------------------------------------- */

if (!("serial" in navigator)) {
  els.unsupportedBanner.hidden = false;
  [els.btnConnect, els.btnFindIp, els.btnSendWifi, els.btnFlashFpga, els.btnFlashEsp32].forEach(
    (btn) => (btn.disabled = true)
  );
}

/* ---------------------------------------------------------------------- */
/* ESP32-S3 watchdog reset (see ../flash/flash.js for full rationale)        */
/* ---------------------------------------------------------------------- */

async function watchdogResetEsp32S3(loader) {
  const RTC_CNTL_WDTCONFIG0_REG = 0x60008098;
  const RTC_CNTL_WDTCONFIG1_REG = 0x6000809c;
  const RTC_CNTL_WDTWPROTECT_REG = 0x600080b0;
  const RTC_CNTL_WDT_WKEY = 0x50d83aa1;

  await loader.writeReg(RTC_CNTL_WDTWPROTECT_REG, RTC_CNTL_WDT_WKEY);
  await loader.writeReg(RTC_CNTL_WDTCONFIG1_REG, 2000);
  await loader.writeReg(RTC_CNTL_WDTCONFIG0_REG, 0xd0000102);
  await loader.writeReg(RTC_CNTL_WDTWPROTECT_REG, 0);
  await new Promise((resolve) => setTimeout(resolve, 500));
}

/* ---------------------------------------------------------------------- */
/* Reconnect handling after a chip-level reset                              */
/* ---------------------------------------------------------------------- */

if ("serial" in navigator) {
  navigator.serial.addEventListener("connect", (event) => {
    if (!awaitingReconnect) return;
    awaitingReconnect = false;
    serialPort = event.target;
    log("Board USB reconnected after reset, resuming serial listener…");
    startSerialListener().catch((err) => log(`Serial listener failed to resume: ${err.message}`, "error"));
  });
}

/* ---------------------------------------------------------------------- */
/* Connect USB                                                              */
/* ---------------------------------------------------------------------- */

els.btnConnect.addEventListener("click", async () => {
  try {
    serialPort = await navigator.serial.requestPort();
    log("Serial port selected.");
    setStatus(els.statusConnect, "USB connected.", "ok");
    els.btnSendWifi.disabled = false;
    updateFlashFpgaEnabled();
    updateFlashEsp32Enabled();
  } catch (err) {
    log(`Connect failed: ${err.message}`, "error");
    setStatus(els.statusConnect, `Connect failed: ${err.message}`, "error");
  }
});

/* ---------------------------------------------------------------------- */
/* Find My IP — two-click armed flow (see ../flash/flash.js)                */
/* ---------------------------------------------------------------------- */

let findIpArmed = false;

els.btnFindIp.addEventListener("click", async () => {
  if (!findIpArmed) {
    findIpArmed = true;
    els.btnFindIp.textContent = "Now click again to select the port…";
    setStatus(els.statusConnect, "Plug your board into USB now (or press RESET if it's already plugged in), then click the button again.");
    return;
  }

  try {
    serialPort = await navigator.serial.requestPort();
    log("Serial port selected.");
    await startSerialListener();
    setStatus(els.statusConnect, "Listening on USB — press the RESET button on your board to see its IP.");
  } catch (err) {
    log(`Find IP failed: ${err.message}`, "error");
    setStatus(els.statusConnect, `Find IP failed: ${err.message}`, "error");
  } finally {
    findIpArmed = false;
    els.btnFindIp.textContent = "Find My IP";
  }
});

els.btnUseManualIp.addEventListener("click", () => {
  const ip = els.deviceIpManual.value.trim();
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
    setStatus(els.statusConnect, "Enter a valid IP address (e.g. 192.168.1.42).", "error");
    return;
  }
  setDeviceIp(ip);
});

function setDeviceIp(ip) {
  deviceIp = ip;
  els.deviceIp.textContent = ip;
  setStatus(els.statusConnect, `Board connected — IP ${ip}`, "ok");
  updateFlashFpgaEnabled();
  updateFlashEsp32Enabled();
}

/* ---------------------------------------------------------------------- */
/* Serial listener — WiFi provisioning acks + IP capture                    */
/* ---------------------------------------------------------------------- */

async function startSerialListener() {
  if (!serialPort) return;
  if (serialReadLoop && !serialReadLoop.stop) return;

  if (!serialPort.readable) {
    try {
      await serialPort.open({ baudRate: 115200 });
    } catch (err) {
      if (!serialPort.readable) {
        throw new Error(`Could not open serial port: ${err.message}`);
      }
    }
  }

  serialReadLoop = { stop: false };
  const loopState = serialReadLoop;
  const decoder = new TextDecoderStream();
  const readableClosed = serialPort.readable.pipeTo(decoder.writable).catch(() => {});
  const reader = decoder.readable.getReader();

  let buf = "";
  (async () => {
    try {
      while (!loopState.stop) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += value;
        let idx;
        while ((idx = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, idx).replace(/\r+$/, "");
          buf = buf.slice(idx + 1);
          if (line.length) handleSerialLine(line);
        }
      }
    } catch (err) {
      log(`Serial read stopped: ${err.message}`, "error");
      if (!loopState.stop && /lost|disconnect/i.test(err.message)) {
        log("Board USB is re-enumerating after reset — waiting to reconnect…");
        awaitingReconnect = true;
      }
    } finally {
      loopState.stop = true;
      reader.releaseLock();
    }
  })();

  readableClosed.then(() => {
    loopState.stop = true;
  });
}

let serialWaiters = [];

function waitForSerialLine(matchRegex, timeoutMs, onEachLine) {
  return new Promise((resolve, reject) => {
    const waiter = { matchRegex, onEachLine };
    waiter.timeoutHandle = setTimeout(() => {
      serialWaiters = serialWaiters.filter((w) => w !== waiter);
      reject(new Error(`Timed out waiting for board (expected ${matchRegex})`));
    }, timeoutMs);
    waiter.resolve = (line) => {
      clearTimeout(waiter.timeoutHandle);
      serialWaiters = serialWaiters.filter((w) => w !== waiter);
      resolve(line);
    };
    serialWaiters.push(waiter);
  });
}

function handleSerialLine(line) {
  log(line);

  for (const waiter of serialWaiters.slice()) {
    if (waiter.matchRegex.test(line)) {
      waiter.resolve(line);
    } else if (waiter.onEachLine) {
      waiter.onEachLine(line);
    }
  }

  const ipMatch = line.match(IP_REGEX);
  if (ipMatch) setDeviceIp(ipMatch[1]);

  if (line.includes("WIFI_CFG_OK ssid")) setStatus(els.statusConnect, "SSID saved…");
  if (line.includes("WIFI_CFG_OK pass")) setStatus(els.statusConnect, "Password saved…");
  if (line.includes("WIFI_CFG_OK reboot")) {
    setStatus(els.statusConnect, "Credentials saved. Board is rebooting and reconnecting…", "ok");
  }
  if (line.includes("WIFI_CFG_ERR")) {
    setStatus(els.statusConnect, "Board rejected credentials — try again.", "error");
  }
}

/* ---------------------------------------------------------------------- */
/* Send WiFi credentials over serial                                        */
/* ---------------------------------------------------------------------- */

els.btnSendWifi.addEventListener("click", async () => {
  const ssid = els.wifiSsid.value.trim();
  const pass = els.wifiPass.value;
  if (!ssid) {
    setStatus(els.statusConnect, "Enter a WiFi network name first.", "error");
    return;
  }
  if (!serialPort) {
    setStatus(els.statusConnect, "Connect USB first.", "error");
    return;
  }

  try {
    if (!serialPort.writable) await startSerialListener();
    const writer = serialPort.writable.getWriter();
    const encoder = new TextEncoder();
    await writer.write(encoder.encode(`WIFI_SSID=${ssid}\n`));
    await writer.write(encoder.encode(`WIFI_PASS=${pass}\n`));
    writer.releaseLock();
    setStatus(els.statusConnect, "Credentials sent, waiting for board to confirm…");
  } catch (err) {
    log(`Send WiFi credentials failed: ${err.message}`, "error");
    setStatus(els.statusConnect, `Send failed: ${err.message}`, "error");
  }
});

/* ---------------------------------------------------------------------- */
/* OTA POST helper (XHR for real upload progress)                           */
/* ---------------------------------------------------------------------- */

function otaPost(url, body, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded, e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.responseText);
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText || xhr.statusText}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error — check the device is on the same WiFi network"));
    xhr.send(body);
  });
}

/* ---------------------------------------------------------------------- */
/* FPGA card                                                                */
/* ---------------------------------------------------------------------- */

const SERIAL_FPGA_TARGET = {
  "/fpga-update": "flash",
  "/fpga-jtag-sram": "sram",
};

function fpgaMethod() {
  return document.querySelector('input[name="fpga-method"]:checked').value;
}

els.fpgaFile.addEventListener("change", () => {
  const file = els.fpgaFile.files[0];
  els.fpgaFileLabel.textContent = file ? file.name : "Choose bitstream .bin…";
  updateFlashFpgaEnabled();
});

els.fpgaTarget.addEventListener("change", updateFlashFpgaEnabled);
document.querySelectorAll('input[name="fpga-method"]').forEach((r) => r.addEventListener("change", updateFlashFpgaEnabled));

function updateFlashFpgaEnabled() {
  const method = fpgaMethod();
  const isRecovery = els.fpgaTarget.value === "/fpga-recover";
  const hasFile = isRecovery ? true : Boolean(els.fpgaFile.files[0]);
  const hasTransport = method === "ota" ? Boolean(deviceIp) : Boolean(serialPort) && !isRecovery;
  els.btnFlashFpga.disabled = !(hasFile && hasTransport);
}

function validateFpgaFileTarget(file, target) {
  if (!file || target === "/fpga-recover") return null;
  if (!/\.bin$/i.test(file.name)) {
    return "Only .bin (Gowin \"Binary File\") bitstreams are supported — .fs files are not yet parsed by the firmware.";
  }
  return null;
}

function updateFpgaProgress(loaded, total) {
  const pct = total ? Math.round((loaded / total) * 100) : 0;
  els.progressFpga.querySelector(".progress-bar").style.width = `${pct}%`;
}

els.btnFlashFpga.addEventListener("click", async () => {
  const method = fpgaMethod();
  const target = els.fpgaTarget.value;
  const file = els.fpgaFile.files[0];
  const isRecovery = target === "/fpga-recover";

  const mismatchError = validateFpgaFileTarget(file, target);
  if (mismatchError) {
    setStatus(els.statusFpga, mismatchError, "error");
    return;
  }
  if (method === "usb" && isRecovery) {
    setStatus(els.statusFpga, "Recovery has no USB/Serial equivalent — switch to OTA (WiFi).", "error");
    return;
  }

  els.btnFlashFpga.disabled = true;
  els.progressFpga.hidden = false;
  updateFpgaProgress(0, 1);
  setStatus(els.statusFpga, method === "ota" ? "Uploading to board over WiFi…" : "Uploading to board over USB serial…");

  try {
    const body = isRecovery ? new ArrayBuffer(0) : await file.arrayBuffer();

    if (method === "ota") {
      const url = `http://${deviceIp}:${OTA_PORT}${target}`;
      const responseText = await otaPost(url, body, updateFpgaProgress);
      log(responseText);
    } else {
      await flashFpgaOverSerial(target, new Uint8Array(body), updateFpgaProgress);
    }

    setStatus(els.statusFpga, "FPGA programmed successfully.", "ok");
  } catch (err) {
    log(`FPGA flash failed: ${err.message}`, "error");
    setStatus(els.statusFpga, `Flash failed: ${err.message}`, "error");
  } finally {
    els.btnFlashFpga.disabled = false;
    updateFlashFpgaEnabled();
  }
});

async function flashFpgaOverSerial(target, data, onProgress) {
  const serialTarget = SERIAL_FPGA_TARGET[target];
  if (!serialTarget) throw new Error("This target has no USB serial equivalent yet — use OTA (WiFi).");
  if (!serialPort) throw new Error("No USB serial port connected.");

  await startSerialListener();

  const size = data.byteLength;
  const encoder = new TextEncoder();
  const writer = serialPort.writable.getWriter();

  try {
    const readyPromise = waitForSerialLine(/^READY$|^FPGA_FLASH_ERROR /, 90000);
    await writer.write(encoder.encode(`FPGA_FLASH_BEGIN ${serialTarget} ${size}\n`));
    const readyLine = await readyPromise;
    if (readyLine.startsWith("FPGA_FLASH_ERROR")) {
      throw new Error(`Board rejected request: ${readyLine}`);
    }

    const donePromise = waitForSerialLine(/^FPGA_FLASH_OK$|^FPGA_FLASH_ERROR /, 180000, (line) => {
      const m = line.match(/^PROGRESS (\d+)/);
      if (m) onProgress(parseInt(m[1], 10), size);
    });

    if (serialTarget === "flash") {
      const CHUNK = 4096;
      for (let offset = 0; offset < size; offset += CHUNK) {
        const end = Math.min(offset + CHUNK, size);
        await writer.write(data.slice(offset, end));
        await waitForSerialLine(new RegExp(`^PROGRESS ${end}$|^FPGA_FLASH_ERROR `), 10000);
      }
    } else {
      const CHUNK = 16384;
      for (let offset = 0; offset < size; offset += CHUNK) {
        await writer.write(data.slice(offset, Math.min(offset + CHUNK, size)));
      }
    }

    const resultLine = await donePromise;
    if (resultLine.startsWith("FPGA_FLASH_ERROR")) {
      throw new Error(`Board reported: ${resultLine}`);
    }
    onProgress(size, size);
  } finally {
    writer.releaseLock();
  }
}

/* ---------------------------------------------------------------------- */
/* ESP32 card                                                               */
/* ---------------------------------------------------------------------- */

function esp32Method() {
  return document.querySelector('input[name="esp32-method"]:checked').value;
}

function esp32Source() {
  return document.querySelector('input[name="esp32-source"]:checked').value;
}

document.querySelectorAll('input[name="esp32-source"]').forEach((r) =>
  r.addEventListener("change", () => {
    const useRelease = esp32Source() === "release";
    els.esp32ReleaseFields.hidden = !useRelease;
    els.esp32UploadFields.hidden = useRelease;
    updateFlashEsp32Enabled();
  })
);
document.querySelectorAll('input[name="esp32-method"]').forEach((r) => r.addEventListener("change", updateFlashEsp32Enabled));

els.esp32File.addEventListener("change", () => {
  const file = els.esp32File.files[0];
  els.esp32FileLabel.textContent = file ? file.name : "Choose *-merged.bin…";
  updateFlashEsp32Enabled();
});

function updateFlashEsp32Enabled() {
  const method = esp32Method();
  const source = esp32Source();
  const hasFile = source === "release" ? Boolean(esp32Release) : Boolean(els.esp32File.files[0]);
  const hasTransport = method === "ota" ? Boolean(deviceIp) : Boolean(serialPort);
  els.btnFlashEsp32.disabled = !(hasFile && hasTransport);
}

// GitHub release assets redirect to objects.githubusercontent.com, which may
// or may not answer with permissive CORS depending on the asset — if the
// fetch fails, fall back to telling the user to grab it manually (same as
// the guided ../flash/ page already does).
els.btnFetchRelease.addEventListener("click", async () => {
  els.btnFetchRelease.disabled = true;
  els.esp32ReleaseLabel.textContent = "fetching…";
  try {
    const resp = await fetch(RELEASE_API);
    if (!resp.ok) throw new Error(`GitHub API HTTP ${resp.status}`);
    const release = await resp.json();
    const asset = (release.assets || []).find((a) => /-merged\.bin$/i.test(a.name));
    if (!asset) throw new Error("No *-merged.bin asset found in the latest release.");

    log(`Downloading ${asset.name} from ${release.tag_name}…`);
    const assetResp = await fetch(asset.browser_download_url);
    if (!assetResp.ok) throw new Error(`Asset download HTTP ${assetResp.status}`);
    const data = new Uint8Array(await assetResp.arrayBuffer());

    esp32Release = { name: asset.name, data };
    els.esp32ReleaseLabel.textContent = `${asset.name} (${release.tag_name})`;
    log(`Fetched ${asset.name} (${data.byteLength} bytes).`, "success");
  } catch (err) {
    esp32Release = null;
    els.esp32ReleaseLabel.textContent = "fetch failed (likely CORS) — switch to \"Upload my own\" instead";
    log(`Fetch latest release failed: ${err.message}`, "error");
  } finally {
    els.btnFetchRelease.disabled = false;
    updateFlashEsp32Enabled();
  }
});

els.btnFlashEsp32.addEventListener("click", async () => {
  const method = esp32Method();
  const source = esp32Source();

  let data;
  if (source === "release") {
    if (!esp32Release) return;
    data = esp32Release.data;
  } else {
    const file = els.esp32File.files[0];
    if (!file) return;
    data = new Uint8Array(await file.arrayBuffer());
  }

  els.btnFlashEsp32.disabled = true;
  els.progressEsp32.hidden = false;
  setStatus(els.statusEsp32, method === "ota" ? "Uploading to board over WiFi…" : "Connecting to ESP32…");

  try {
    if (method === "ota") {
      const url = `http://${deviceIp}:${OTA_PORT}/update`;
      const responseText = await otaPost(url, data, (loaded, total) => {
        const pct = total ? Math.round((loaded / total) * 100) : 0;
        els.progressEsp32.querySelector(".progress-bar").style.width = `${pct}%`;
      });
      log(responseText);
      setStatus(els.statusEsp32, "ESP32 firmware updated over WiFi.", "ok");
    } else {
      espTransport = new Transport(serialPort, true);
      const loader = new ESPLoader({
        transport: espTransport,
        baudrate: 115200,
        terminal: {
          clean: () => {},
          writeLine: (msg) => log(msg),
          write: (msg) => log(msg),
        },
      });

      const chipName = await loader.main();
      log(`Connected to ${chipName}.`);
      setStatus(els.statusEsp32, `Connected to ${chipName}. Flashing…`);

      await loader.writeFlash({
        fileArray: [{ data, address: 0x0 }],
        flashMode: "keep",
        flashFreq: "keep",
        flashSize: "keep",
        eraseAll: false,
        compress: true,
        reportProgress: (_fileIndex, written, total) => {
          const pct = Math.round((written / total) * 100);
          els.progressEsp32.querySelector(".progress-bar").style.width = `${pct}%`;
        },
      });

      log("ESP32 firmware flashed.", "success");
      if (loader.chip && loader.chip.CHIP_NAME === "ESP32-S3") {
        log("Resetting board via RTC watchdog...");
        await watchdogResetEsp32S3(loader);
      } else {
        await loader.after("hard_reset");
      }
      await espTransport.disconnect();
      espTransport = null;

      setStatus(els.statusEsp32, "ESP32 flashed. Board rebooting automatically.", "ok");
      els.btnSendWifi.disabled = false;
      setTimeout(() => {
        startSerialListener().catch((err) => log(`Serial listener failed to start: ${err.message}`, "error"));
      }, 1500);
    }
  } catch (err) {
    log(`ESP32 flash failed: ${err.message}`, "error");
    setStatus(els.statusEsp32, `Flash failed: ${err.message}`, "error");
    if (espTransport) {
      try {
        await espTransport.disconnect();
      } catch {
        // already closed/never opened — ignore
      }
      espTransport = null;
    }
  } finally {
    updateFlashEsp32Enabled();
  }
});

updateFlashFpgaEnabled();
updateFlashEsp32Enabled();
