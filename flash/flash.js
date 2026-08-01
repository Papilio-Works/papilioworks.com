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
  btnFindIp: document.getElementById("btn-find-ip"),

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

// esptool-js's `after("hard_reset")` only toggles the RTS pin, which does not
// reliably reboot a native USB Serial/JTAG ESP32-S3 back into the app (the
// board is left requiring a physical RESET press). Python esptool has a
// separate `--after watchdog-reset` mode for exactly this case (arms the RTC
// watchdog and lets it fire, no DTR/RTS involved) but esptool-js has no JS
// equivalent — this is a direct port of ESP32S3ROM.watchdog_reset() from
// esptool's targets/esp32s3.py, using the same three register writes over
// the already-connected ESPLoader. Confirmed reliable on the Papilio
// Retrocade (see esp32s3-usb-auto-reset-findings repo memory).
async function watchdogResetEsp32S3(loader) {
  const RTC_CNTL_WDTCONFIG0_REG = 0x60008098;
  const RTC_CNTL_WDTCONFIG1_REG = 0x6000809c;
  const RTC_CNTL_WDTWPROTECT_REG = 0x600080b0;
  const RTC_CNTL_WDT_WKEY = 0x50d83aa1;

  await loader.writeReg(RTC_CNTL_WDTWPROTECT_REG, RTC_CNTL_WDT_WKEY); // unlock
  await loader.writeReg(RTC_CNTL_WDTCONFIG1_REG, 2000); // WDT timeout
  await loader.writeReg(RTC_CNTL_WDTCONFIG0_REG, 0xd0000102); // enable WDT
  await loader.writeReg(RTC_CNTL_WDTWPROTECT_REG, 0); // lock
  await new Promise((resolve) => setTimeout(resolve, 500));
}

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
    startSerialListener().catch((err) => log(`Serial listener failed to resume: ${err.message}`));
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
  [els.btnConnect, els.btnFlashEsp32, els.btnSendWifi, els.btnFlashFpga, els.btnFindIp].forEach(
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
  els.fpgaFileLabel.textContent = file ? file.name : "Choose bitstream .bin…";
  updateFlashFpgaEnabled();
});

els.fpgaTarget.addEventListener("change", updateFlashFpgaEnabled);

function updateFlashEsp32Enabled() {
  els.btnFlashEsp32.disabled = !(serialPort && els.esp32File.files[0]);
}

function updateFlashFpgaEnabled() {
  const isRecovery = els.fpgaTarget.value === "/fpga-recover";
  // Recovery has no USB-serial equivalent yet, so it still requires a known
  // IP. The other two targets can go over WiFi OTA *or* USB serial, so the
  // button just needs some transport (IP or an already-selected serial port)
  // plus a bitstream file.
  const hasTransport = Boolean(deviceIp || serialPort);
  const hasFile = isRecovery ? Boolean(deviceIp) : Boolean(els.fpgaFile.files[0]);
  els.btnFlashFpga.disabled = !(hasTransport && hasFile);
}

// The firmware streams the uploaded bytes verbatim to flash or JTAG SRAM —
// it never strips Gowin's ASCII comment header, so only headerless .bin
// (Gowin's "Binary File" export) works. Real .fs exports (which start with
// that text header) are not supported yet on either target.
function validateFpgaFileTarget(file, target) {
  if (!file || target === "/fpga-recover") return null;
  if (!/\.bin$/i.test(file.name)) {
    return "Only .bin (Gowin \"Binary File\") bitstreams are supported right now — .fs files are not yet parsed by the firmware.";
  }
  return null;
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
    // Reboot the board back into the app. Only the RTC-watchdog reset (see
    // watchdogResetEsp32S3 above) reliably reboots this board's native USB
    // Serial/JTAG hardware without a physical RESET press — esptool-js's own
    // reset strategies (classic RTS toggle, and the UsbJtagSerialReset used
    // to *enter* the bootloader) leave it parked in the bootloader or
    // requiring a manual press. Fall back to hard_reset for any other chip.
    if (loader.chip && loader.chip.CHIP_NAME === "ESP32-S3") {
      log("Resetting board via RTC watchdog...");
      await watchdogResetEsp32S3(loader);
    } else {
      await loader.after("hard_reset");
    }
    await espTransport.disconnect();
    espTransport = null;

    setStatus(els.statusEsp32, "ESP32 flashed.", "ok");
    els.btnSendWifi.disabled = false;

    // Give the board a moment to boot, then start listening on the same
    // serial port for its log output (WiFi status, provisioning acks).
    setTimeout(() => {
      startSerialListener().catch((err) => log(`Serial listener failed to start: ${err.message}`));
    }, 1500);

    // The board reboots itself automatically (see watchdogResetEsp32S3
    // above) — no physical RESET press needed. The still-running listener
    // (and its reconnect handling) picks up the boot log and WiFi IP
    // automatically once it comes back up.
    setStatus(
      els.statusWifi,
      "Board rebooting automatically… waiting for it to connect to WiFi."
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
  if (serialReadLoop && !serialReadLoop.stop) return; // already listening

  if (!serialPort.readable) {
    try {
      await serialPort.open({ baudRate: 115200 });
    } catch (err) {
      // "already open" is a harmless re-entry race — readable will be set by
      // then. Anything else (e.g. the board is still re-enumerating right
      // after a reset) means the port truly isn't usable yet; surface that
      // to the caller instead of falling through to a null-readable crash.
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
          // \r+ not \r: the board's console converts \n to \r\n, so its own
          // explicit "\r\n" line endings arrive as "\r\r\n".
          const line = buf.slice(0, idx).replace(/\r+$/, "");
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
      // Mark this loop dead so a later startSerialListener() call knows to
      // actually spin up a new reader instead of assuming one is still live.
      loopState.stop = true;
      reader.releaseLock();
    }
  })();

  // Don't block the caller on the port fully closing (that may never happen
  // during normal operation) — just note the loop as dead once it does.
  readableClosed.then(() => {
    loopState.stop = true;
  });
}

// Promise-based waiters for the serial-flash protocol (READY / PROGRESS n /
// FPGA_FLASH_OK / FPGA_FLASH_ERROR <reason>). The serial port's readable
// stream can only have one active reader, so this hooks into the single
// startSerialListener() read loop instead of opening a second reader.
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

// For a board that's already flashed and already has WiFi credentials saved
// in NVS from a prior session — no need to reflash or resend credentials,
// just open the same USB serial port and read the boot log it prints on
// every reconnect (the firmware logs "WiFi connected - IP: ..." on every
// boot, not just first-time provisioning).
//
// Two clicks, not one: the port picker only lists devices the OS has already
// enumerated, so if the board wasn't plugged in yet it shows nothing to pick.
// The first click just tells the user to plug in/power the board; the second
// (a fresh user gesture, required for requestPort()) opens the picker.
let findIpArmed = false;

els.btnFindIp.addEventListener("click", async () => {
  if (!findIpArmed) {
    findIpArmed = true;
    els.btnFindIp.textContent = "Now click again to select the port…";
    setStatus(els.statusWifi, "Plug your board into USB now (or press RESET if it's already plugged in), then click the button again.");
    return;
  }

  try {
    serialPort = await navigator.serial.requestPort();
    log("Serial port selected.");
    await startSerialListener();
    setStatus(els.statusWifi, "Listening on USB — press the RESET button on your board to see its IP.");
  } catch (err) {
    log(`Find IP failed: ${err.message}`);
    setStatus(els.statusWifi, `Find IP failed: ${err.message}`, "error");
  } finally {
    findIpArmed = false;
    els.btnFindIp.textContent = "Find My IP";
  }
});

/* ---------------------------------------------------------------------- */
/* Step 3 — Flash FPGA bitstream: WiFi OTA first, USB serial fallback       */
/* ---------------------------------------------------------------------- */

// Maps the target dropdown's OTA endpoint to the serial-flash protocol's
// target keyword (see FPGA-Companion's serial_flash.h). /fpga-recover has no
// serial equivalent yet — recovery implies the flash is corrupt, but the
// board still needs to be reachable somehow to even ask for it, so it stays
// OTA-only for this iteration.
const SERIAL_FPGA_TARGET = {
  "/fpga-update": "flash",
  "/fpga-jtag-sram": "sram",
};

function updateFpgaProgress(loaded, total) {
  const pct = total ? Math.round((loaded / total) * 100) : 0;
  els.progressFpga.querySelector(".progress-bar").style.width = `${pct}%`;
}

els.btnFlashFpga.addEventListener("click", async () => {
  const target = els.fpgaTarget.value;
  const file = els.fpgaFile.files[0];
  const isRecovery = target === "/fpga-recover";
  if (!isRecovery && !file) return;

  const mismatchError = validateFpgaFileTarget(file, target);
  if (mismatchError) {
    setStatus(els.statusFpga, mismatchError, "error");
    return;
  }

  if (isRecovery && !deviceIp) {
    setStatus(els.statusFpga, "Recovery requires a known device IP — use Find My IP or send WiFi credentials first.", "error");
    return;
  }

  els.btnFlashFpga.disabled = true;
  els.progressFpga.hidden = false;
  updateFpgaProgress(0, 1);
  setStatus(els.statusFpga, "Uploading to board…");

  try {
    const body = isRecovery ? new ArrayBuffer(0) : await file.arrayBuffer();
    let usedPath = null;

    if (deviceIp) {
      try {
        setStatus(els.statusFpga, "Uploading to board over WiFi…");
        const url = `http://${deviceIp}:${OTA_PORT}${target}`;
        const responseText = await otaPost(url, body, updateFpgaProgress);
        log(responseText);
        usedPath = "network";
      } catch (otaErr) {
        log(`WiFi OTA upload failed: ${otaErr.message}`);
        if (isRecovery || !serialPort) throw otaErr; // no fallback available
        log("Falling back to USB serial…");
      }
    }

    if (!usedPath) {
      if (isRecovery) throw new Error("Recovery requires a working network/IP path — no USB serial equivalent yet.");
      if (!serialPort) throw new Error("No device IP known and no USB serial port connected.");
      setStatus(els.statusFpga, "No IP known — flashing over USB serial (slower than WiFi)…");
      await flashFpgaOverSerial(target, new Uint8Array(body), updateFpgaProgress);
      usedPath = "serial";
    }

    setStatus(
      els.statusFpga,
      usedPath === "network" ? "FPGA programmed successfully via network." : "FPGA programmed successfully via USB serial.",
      "ok"
    );
  } catch (err) {
    log(`FPGA flash failed: ${err.message}`);
    setStatus(els.statusFpga, `Flash failed: ${err.message}`, "error");
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

// USB-serial fallback for Step 3 — streams the bitstream over the same
// serial port used in Steps 1/2 instead of WiFi OTA. See
// FPGA-Companion/src/esp32/serial_flash.h for the line protocol.
async function flashFpgaOverSerial(target, data, onProgress) {
  const serialTarget = SERIAL_FPGA_TARGET[target];
  if (!serialTarget) throw new Error("This target has no USB serial equivalent yet — use WiFi OTA.");
  if (!serialPort) throw new Error("No USB serial port connected.");

  await startSerialListener(); // no-op if already running; ensures response lines are captured

  const size = data.byteLength;
  const encoder = new TextEncoder();
  const writer = serialPort.writable.getWriter();

  try {
    // For target=flash, the board does bootloader-SRAM-load + SPI init +
    // full-region erase *before* replying READY (see serial_flash.c's
    // serial_flash_prepare_spi() comment) — that can take up to ~60s in the
    // worst case (SPI bus not yet initialised this early in boot, plus a
    // slow 2MB erase over the JTAG-bridged SPI link), so this timeout is
    // long. Keeping the erase ahead of READY avoids overflowing the
    // board's small USB RX ring buffer with a payload it can't drain yet.
    const readyPromise = waitForSerialLine(/^READY$|^FPGA_FLASH_ERROR /, 90000);
    await writer.write(encoder.encode(`FPGA_FLASH_BEGIN ${serialTarget} ${size}\n`));
    const readyLine = await readyPromise;
    if (readyLine.startsWith("FPGA_FLASH_ERROR")) {
      throw new Error(`Board rejected request: ${readyLine}`);
    }

    // Long timeout — USB-Serial-JTAG is much slower than WiFi OTA for a full
    // bitstream write, especially the SPI-flash target (erase + write).
    const donePromise = waitForSerialLine(/^FPGA_FLASH_OK$|^FPGA_FLASH_ERROR /, 180000, (line) => {
      const m = line.match(/^PROGRESS (\d+)/);
      if (m) onProgress(parseInt(m[1], 10), size);
    });

    if (serialTarget === "flash") {
      // Per-chunk flow control: wait for the device's PROGRESS ack (emitted
      // after every chunk for target=flash) before sending the next chunk.
      // The device's usb_serial_jtag RX ring buffer is small (16 KB) —
      // without this, the whole payload gets handed to the OS/USB stack
      // immediately and can overrun that buffer, wedging the USB transport
      // permanently if a flash write is ever slower than the incoming byte
      // rate. See serial_flash.c's serial_flash_write_spi() comment.
      const CHUNK = 4096;
      for (let offset = 0; offset < size; offset += CHUNK) {
        const end = Math.min(offset + CHUNK, size);
        // slice() (copy), not subarray() (view) — write() transfers/detaches
        // the underlying buffer, which would invalidate every other view
        // into the same source ArrayBuffer after the first write() call.
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

