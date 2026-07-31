// flash.js — Papilio Works hosted web flasher
//
// Step 1: flash ESP32 firmware over USB (WebSerial + esptool-js)
// Step 2: send WiFi credentials over the same serial port, capture device IP
// Step 3: flash the FPGA bitstream over WiFi via direct HTTP OTA (no relay)
//
// Requires Chrome or Edge (WebSerial + a secure/HTTPS context).

// NOTE: unpkg serves esptool-js's raw lib/ source files as-is, and one of its
// internal files (webserial.js) imports "./util" without a .js extension, which
// browsers can't resolve (silently breaking every listener in this file).
// CDN rewriting proxies (e.g. esm.sh) work around that, but esm.sh's JSON-module
// bundling corrupts esptool-js's embedded base64 flasher-stub blobs (fetched via
// dynamic `import()` of large per-chip .json files), causing
// "Failed to execute 'atob': The string to be decoded is not correctly encoded"
// during "Uploading stub...". Instead, use esptool-js's own published bundle.js:
// it's a single, self-contained ES module (no relative imports, all stub data
// inlined as string literals) that unpkg can serve verbatim with no CDN rewriting
// involved. Pinned to an exact version for stability/integrity.
import { ESPLoader, Transport } from "https://unpkg.com/esptool-js@0.6.0/bundle.js";

const OTA_PORT = 3232;
const IP_REGEX = /WiFi connected - IP:\s*(\d{1,3}(?:\.\d{1,3}){3})/;

const els = {
  unsupportedBanner: document.getElementById("unsupported-banner"),
  log: document.getElementById("flash-log"),

  esp32File: document.getElementById("esp32-file"),
  esp32FileLabel: document.getElementById("esp32-file-label"),
  btnConnect: document.getElementById("btn-connect"),
  btnFlashEsp32: document.getElementById("btn-flash-esp32"),
  progressEsp32: document.getElementById("progress-esp32"),
  statusEsp32: document.getElementById("status-esp32"),

  wifiSsid: document.getElementById("wifi-ssid"),
  wifiPass: document.getElementById("wifi-pass"),
  btnSendWifi: document.getElementById("btn-send-wifi"),
  statusWifi: document.getElementById("status-wifi"),
  deviceIp: document.getElementById("device-ip"),
  deviceIpManual: document.getElementById("device-ip-manual"),
  btnUseManualIp: document.getElementById("btn-use-manual-ip"),

  fpgaFile: document.getElementById("fpga-file"),
  fpgaFileLabel: document.getElementById("fpga-file-label"),
  fpgaTarget: document.getElementById("fpga-target"),
  btnFlashFpga: document.getElementById("btn-flash-fpga"),
  progressFpga: document.getElementById("progress-fpga"),
  statusFpga: document.getElementById("status-fpga"),
};

let serialPort = null;      // the SerialPort object, requested once and reused
let espTransport = null;    // esptool-js Transport, owns the port while flashing
let serialReadLoop = null;  // AbortController-like flag for the raw read loop
let deviceIp = null;
let awaitingReconnect = false; // true while waiting for the board's USB to re-enumerate after a reset

// A chip-level reset on native ESP32-S3 USB Serial/JTAG resets the USB
// peripheral itself, so the OS briefly disconnects/reconnects the port —
// killing the currently-open serial stream ("The device has been lost").
// Once the same port reappears, resume the listener automatically instead of
// leaving Step 2 stuck on "waiting for board…".
// A chip-level reset on native ESP32-S3 USB Serial/JTAG resets the USB
// peripheral itself, so the OS briefly disconnects/reconnects the port —
// killing the currently-open serial stream ("The device has been lost").
// Chrome creates a new SerialPort object for the reappeared device, so we
// can't compare it against the stale `serialPort` reference — just take
// whatever port reconnects (this app only ever talks to one board at a time)
// and resume the listener automatically instead of leaving Step 2 stuck on
// "waiting for board…".
if ("serial" in navigator) {
  navigator.serial.addEventListener("connect", (event) => {
    if (!awaitingReconnect) return;
    awaitingReconnect = false;
    serialPort = event.target;
    log("Board USB reconnected after reset, resuming serial listener…");
    startSerialListener();
  });
}

/* ---------------------------------------------------------------------- */
/* Logging                                                                  */
/* ---------------------------------------------------------------------- */

function log(line) {
  els.log.textContent += line.endsWith("\n") ? line : line + "\n";
  els.log.scrollTop = els.log.scrollHeight;
}

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
  [els.btnConnect, els.btnFlashEsp32, els.btnSendWifi, els.btnFlashFpga].forEach(
    (btn) => (btn.disabled = true)
  );
}

/* ---------------------------------------------------------------------- */
/* File pickers                                                             */
/* ---------------------------------------------------------------------- */

els.esp32File.addEventListener("change", () => {
  const file = els.esp32File.files[0];
  els.esp32FileLabel.textContent = file ? file.name : "Choose *-merged.bin…";
  updateFlashEsp32Enabled();
});

els.fpgaFile.addEventListener("change", () => {
  const file = els.fpgaFile.files[0];
  els.fpgaFileLabel.textContent = file ? file.name : "Choose bitstream .bin/.fs…";
  updateFlashFpgaEnabled();
});

els.fpgaTarget.addEventListener("change", updateFlashFpgaEnabled);

function updateFlashEsp32Enabled() {
  els.btnFlashEsp32.disabled = !(serialPort && els.esp32File.files[0]);
}

function updateFlashFpgaEnabled() {
  const isRecovery = els.fpgaTarget.value === "/fpga-recover";
  els.btnFlashFpga.disabled = !(deviceIp && (isRecovery || els.fpgaFile.files[0]));
}

/* ---------------------------------------------------------------------- */
/* Step 1 — Connect + flash ESP32 firmware                                  */
/* ---------------------------------------------------------------------- */

els.btnConnect.addEventListener("click", async () => {
  try {
    serialPort = await navigator.serial.requestPort();
    log("Serial port selected.");
    setStatus(els.statusEsp32, "USB connected. Choose a firmware file, then flash.", "ok");
    updateFlashEsp32Enabled();
  } catch (err) {
    log(`Connect failed: ${err.message}`);
    setStatus(els.statusEsp32, `Connect failed: ${err.message}`, "error");
  }
});

els.btnFlashEsp32.addEventListener("click", async () => {
  const file = els.esp32File.files[0];
  if (!serialPort || !file) return;

  els.btnFlashEsp32.disabled = true;
  els.btnConnect.disabled = true;
  els.progressEsp32.hidden = false;
  setStatus(els.statusEsp32, "Connecting to ESP32…");

  try {
    const data = new Uint8Array(await file.arrayBuffer());

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
      // "keep" reads flash mode/freq/size from the merged image's own
      // bootloader header (baked in by `esptool merge_bin` at release time).
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

    log("ESP32 firmware flashed.");
    // NOTE: UsbJtagSerialReset was tried here for native ESP32-S3 USB
    // Serial/JTAG ports (VID 0x303a, PID 0x1001) but it's actually the
    // *enter-bootloader* sequence esptool-js uses at connect time — using it
    // here left the board parked in the ROM bootloader instead of running
    // the app (confirmed by testing). Classic hard_reset is the correct call
    // for both native and bridged USB per esptool-js's own docs/examples.
    await loader.after("hard_reset");
    await espTransport.disconnect();
    espTransport = null;

    setStatus(els.statusEsp32, "ESP32 flashed.", "ok");
    els.btnSendWifi.disabled = false;

    // Give the board a moment to boot, then start listening on the same
    // serial port for its log output (WiFi status, provisioning acks).
    setTimeout(startSerialListener, 1500);

    // esptool-js's software reset (both the classic RTS toggle and the
    // USB-JTAG-Serial DTR+RTS sequence) doesn't reliably reboot this board's
    // native USB Serial/JTAG hardware into the app — a physical reset press
    // is required every time. This is an expected step, not an error: the
    // still-running listener (and its reconnect handling) picks up the boot
    // log and WiFi IP automatically once you do.
    setStatus(
      els.statusWifi,
      "Press the RESET button on your board now to boot it and connect to WiFi."
    );
  } catch (err) {
    log(`Flash failed: ${err.message}`);
    setStatus(els.statusEsp32, `Flash failed: ${err.message}`, "error");
    // The transport may have opened the port before failing (e.g. chip sync
    // timeout) — close it so a retry doesn't hit "port already open".
    if (espTransport) {
      try {
        await espTransport.disconnect();
      } catch {
        // already closed/never opened — ignore
      }
      espTransport = null;
    }
    els.btnConnect.disabled = false;
    updateFlashEsp32Enabled();
  }
});

/* ---------------------------------------------------------------------- */
/* Serial listener — reused for WiFi provisioning acks + IP capture         */
/* ---------------------------------------------------------------------- */

async function startSerialListener() {
  if (!serialPort) return;

  try {
    if (!serialPort.readable) {
      await serialPort.open({ baudRate: 115200 });
    }
  } catch (err) {
    // Port may already be open (e.g. re-entry) — safe to ignore.
    log(`Serial open note: ${err.message}`);
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
          const line = buf.slice(0, idx).replace(/\r$/, "");
          buf = buf.slice(idx + 1);
          if (line.length) handleSerialLine(line);
        }
      }
    } catch (err) {
      log(`Serial read stopped: ${err.message}`);
      if (!loopState.stop && /lost|disconnect/i.test(err.message)) {
        log("Board USB is re-enumerating after reset — waiting to reconnect…");
        awaitingReconnect = true;
      }
    } finally {
      reader.releaseLock();
    }
  })();

  await readableClosed;
}

function handleSerialLine(line) {
  log(line);

  const ipMatch = line.match(IP_REGEX);
  if (ipMatch) setDeviceIp(ipMatch[1]);

  if (line.includes("WIFI_CFG_OK ssid")) setStatus(els.statusWifi, "SSID saved…");
  if (line.includes("WIFI_CFG_OK pass")) setStatus(els.statusWifi, "Password saved…");
  if (line.includes("WIFI_CFG_OK reboot")) {
    setStatus(els.statusWifi, "Credentials saved. Board is rebooting and reconnecting…", "ok");
  }
  if (line.includes("WIFI_CFG_ERR")) {
    setStatus(els.statusWifi, "Board rejected credentials — try again.", "error");
  }
}

function setDeviceIp(ip) {
  deviceIp = ip;
  els.deviceIp.textContent = ip;
  setStatus(els.statusWifi, `Board connected — IP ${ip}`, "ok");
  updateFlashFpgaEnabled();
}

/* ---------------------------------------------------------------------- */
/* Step 2 — Send WiFi credentials over serial                               */
/* ---------------------------------------------------------------------- */

els.btnSendWifi.addEventListener("click", async () => {
  const ssid = els.wifiSsid.value.trim();
  const pass = els.wifiPass.value;
  if (!ssid) {
    setStatus(els.statusWifi, "Enter a WiFi network name first.", "error");
    return;
  }

  try {
    if (!serialPort.writable) await startSerialListener();
    const writer = serialPort.writable.getWriter();
    const encoder = new TextEncoder();
    await writer.write(encoder.encode(`WIFI_SSID=${ssid}\n`));
    await writer.write(encoder.encode(`WIFI_PASS=${pass}\n`));
    writer.releaseLock();
    setStatus(els.statusWifi, "Credentials sent, waiting for board to confirm…");
  } catch (err) {
    log(`Send WiFi credentials failed: ${err.message}`);
    setStatus(els.statusWifi, `Send failed: ${err.message}`, "error");
  }
});

els.btnUseManualIp.addEventListener("click", () => {
  const ip = els.deviceIpManual.value.trim();
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
    setStatus(els.statusWifi, "Enter a valid IP address (e.g. 192.168.1.42).", "error");
    return;
  }
  setDeviceIp(ip);
  setStatus(els.statusWifi, `Using manually entered IP ${ip}.`, "ok");
});

/* ---------------------------------------------------------------------- */
/* Step 3 — Flash FPGA bitstream via OTA HTTP POST                          */
/* ---------------------------------------------------------------------- */

els.btnFlashFpga.addEventListener("click", async () => {
  if (!deviceIp) return;

  const target = els.fpgaTarget.value;
  const file = els.fpgaFile.files[0];
  const isRecovery = target === "/fpga-recover";
  if (!isRecovery && !file) return;

  els.btnFlashFpga.disabled = true;
  els.progressFpga.hidden = false;
  els.progressFpga.querySelector(".progress-bar").style.width = "0%";
  setStatus(els.statusFpga, "Uploading to board…");

  try {
    const body = isRecovery ? new ArrayBuffer(0) : await file.arrayBuffer();
    const url = `http://${deviceIp}:${OTA_PORT}${target}`;
    const responseText = await otaPost(url, body, (loaded, total) => {
      const pct = total ? Math.round((loaded / total) * 100) : 0;
      els.progressFpga.querySelector(".progress-bar").style.width = `${pct}%`;
    });
    log(responseText);
    setStatus(els.statusFpga, "FPGA programmed successfully.", "ok");
  } catch (err) {
    log(`FPGA flash failed: ${err.message}`);
    setStatus(
      els.statusFpga,
      `Flash failed: ${err.message} (check the board is on the same network and reachable at ${deviceIp})`,
      "error"
    );
  } finally {
    els.btnFlashFpga.disabled = false;
  }
});

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
