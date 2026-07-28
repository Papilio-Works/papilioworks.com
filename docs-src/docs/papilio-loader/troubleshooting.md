---
id: troubleshooting
title: Loader Troubleshooting
sidebar_label: Troubleshooting
sidebar_position: 6
---

# Loader Troubleshooting

Quick fixes for the most common Papilio Loader issues.

---

## Installation & Startup

| Problem | Fix |
|---|---|
| `pip install` fails | Confirm Python 3.12+ with `python --version`; try `python -m pip install papilio-loader-mcp` |
| `python -m papilio_loader_mcp.api` not found | The package installed into a different Python — use the same interpreter you installed with |
| Port 8000 already in use | Start on another port: set `PAPILIO_PORT=8001` before launching |
| Browser can't reach `localhost:8000` | Check the terminal for startup errors; make sure the server process is still running |

---

## USB/Serial Flashing

| Problem | Fix |
|---|---|
| No serial ports listed | Click **🔄 Refresh** under Advanced Options; try a different USB cable (must be data-capable, not charge-only) |
| Port appears but flash fails | Close anything else using the port (serial monitors, IDEs), then retry |
| ESP32 not detected at all | Install the USB driver for your board (CP210x or CH340), then hold **BOOT** while plugging in to enter bootloader mode |
| Permission errors (Linux/Mac) | Add yourself to the `dialout` group (Linux) or grant terminal USB access (Mac) |
| Flash succeeds but device doesn't boot | Check the flash address — ESP32 apps go to `0x10000`, FPGA bitstreams to `0x100000` |

---

## OTA (WiFi) Flashing

| Problem | Fix |
|---|---|
| **🔍 Discover Devices** finds nothing | Device and PC must be on the same subnet; give the device a minute after boot to connect to WiFi |
| Known IP doesn't respond | Ping it first; confirm FPGA-Companion is running and port 3232 isn't blocked by a firewall |
| OTA flash starts but fails midway | Weak WiFi signal is the usual culprit — move the device closer to the router or fall back to USB |
| Device never appears after first setup | OTA requires FPGA-Companion to already be installed — the very first flash must be over USB |

---

## Web Interface

| Problem | Fix |
|---|---|
| Login fails | Check `PAPILIO_WEB_USERNAME` / `PAPILIO_WEB_PASSWORD`; enable cookies; clear the browser cache |
| Upload rejected | FPGA accepts `.bin` only; ESP32 accepts `.bin` or `.elf`; files must be under the 50 MB limit |
| Another computer can't reach the loader | Confirm `PAPILIO_BIND_ADDRESS=0.0.0.0` (the default) and that your PC's firewall allows the port |
| Saved Files Library is empty after reinstall | The library lives on the server — restore it with **⬆️ Import ZIP** from a previous export |

---

## WiFi Log Monitor

| Problem | Fix |
|---|---|
| No log lines appear | Allow inbound UDP port 7777 through your firewall; confirm the device is on the same subnet |
| Log stops updating | Click **⏹ Stop** then **▶ Start Monitoring** again |

---

## Still Stuck?

Enable **Show command and detailed output** under Advanced Options and retry — the Status Log will then include the exact esptool/pesptool command and its full output, which usually pinpoints the problem. Paste that output into an AI assistant (or the community forum) for a fast diagnosis.

---

## 🎓 Want to Go Deeper?

Debugging hardware is a learnable skill. The FPGA Debugging with AI course teaches a systematic approach — from reading tool output to isolating faults — with AI as your debugging partner.

**[Explore the Courses →](https://learn.papilioworks.com)**
