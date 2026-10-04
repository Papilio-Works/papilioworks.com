---
id: index
title: Papilio Loader Overview
sidebar_label: Overview & Installation
sidebar_position: 1
---

# Papilio Loader

Papilio Loader is the official tool for programming Papilio hardware. It programs both chips on your Retrocade:

- **FPGA (Gowin):** writes a game core or your own design to the FPGA's flash, so it stays loaded after power-off.
- **ESP32-S3:** installs and updates the FPGA-Companion firmware.

Both work over **USB** or **WiFi**. Loader talks to the [Papilio ESP Bootloader](../getting-started/index.md#what-is-the-papilio-esp-bootloader) on your board, which is what makes programming and recovery reliable.

---

## Two Ways to Run It

| Version | Best For | What You Need |
|---|---|---|
| **Web Edition** | Quick programming with nothing to install | Chrome or Edge on a desktop computer |
| **Desktop App** | Everyday use, finding boards on your network, WiFi logs, and AI assistants | Windows 10/11 (64-bit) |

### Web Edition

Open **[papilioworks.com/loader](https://papilioworks.com/loader/)** in Chrome or Edge. It connects to your board over USB using Web Serial, and sends files over WiFi directly from your browser. Nothing is installed, and your files never leave your computer.

:::note
Web browsers can't scan your network or receive UDP logs, so the Web Edition asks you to click **Find My IP** instead of scanning, and has no WiFi Log Monitor. The Desktop App adds both.
:::

### Desktop App

1. Download `PapilioLoader-Setup-x.x.x.exe` from the [releases page](https://github.com/Papilio-Labs/papilio-loader-mcp/releases).
2. Run the installer and launch **Papilio Loader** from the Start Menu.

The Desktop App uses the same interface as the Web Edition and adds:

- **Scan LAN for Devices** to find boards on your network automatically
- **WiFi Log Monitor** for live debug output from your board
- **Saved Files Library** for frequently used cores and firmware
- **AI assistant support** through a built-in MCP server (see [API & Automation](./api-and-automation))

---

## First-Time Setup of a New Board

If your board is brand new, or you're recovering one, use the guided **[Getting Started flasher](https://papilioworks.com/getting-started/)**. It installs the bootloader, connects your WiFi, and loads the Atari 2600 core. See [Flash the Firmware](../getting-started/flash-firmware) for the steps.

---

## Next Step

Learn how to program your FPGA and ESP32:

**[Flashing Devices →](./flashing-devices)**

---

## 🎓 Want to Go Deeper?

Understanding what happens when you program an FPGA, from bitstream to flash to configuration, makes everything easier to debug. The FPGA Fundamentals course covers it with AI as your guide.

**[FPGA Fundamentals: AI as Your Co-Developer →](https://learn.papilioworks.com)**
