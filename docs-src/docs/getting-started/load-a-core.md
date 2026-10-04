---
id: load-a-core
title: Load a Core
sidebar_label: Load a Core
sidebar_position: 3
---

# Load a Core

A **core** is the FPGA design that recreates a system, such as the Atari 2600 or Commodore 64. You load cores with **Papilio Loader**, over USB or WiFi. FPGA-Companion does not load or switch cores, so there is no core menu in the on-screen display.

A core is saved in the FPGA's flash, so it stays loaded when you power the board off. To play a different system, load that system's core the same way.

See [Core Compatibility](../cores/compatibility) for the cores that are available and how well each one works.

---

## Easiest: Use the Getting Started Flasher

If you followed the [browser-based setup](./flash-firmware#recommended-browser-based-setup), the page already installed the Atari 2600 core for you. You only need this page to load a different core later.

---

## Load a Core with Papilio Loader

1. Download the core's `.bin` bitstream from the [Papilio Retrocade GitHub organization](https://github.com/Papilio-Retrocade). Each core has its own repository with a release.
2. Open the [Papilio Loader web edition](https://papilioworks.com/loader/) in Chrome or Edge, or use the desktop app.
3. In the **FPGA** card, choose a transport:
   - **WiFi** is the fastest, and needs the board to be on your network.
   - **USB** works any time the board is connected to your computer.
4. Choose the `.bin` file and click **Flash FPGA**.
5. Wait for the progress bar to finish. The core starts automatically and the Companion menu appears on your display.

:::warning[Only .bin files work]
Papilio Loader needs Gowin's headerless **Binary File** (`.bin`) export. Files ending in `.fs` are not supported.
:::

For more detail on each option, see [Flashing Devices](../papilio-loader/flashing-devices).

---

## Verify the Core Loaded

After the core starts:

- The HDMI output shows the core's startup screen or ROM browser.
- The on-screen menu matches the core you loaded.

If nothing appears, see [Common Issues](../troubleshooting/common-issues).

---

## Next Step

Core is loaded. Now set up your SD card with ROMs:

**[Set Up Your SD Card →](./sd-card-setup)**

---

## 🎓 Want to Go Deeper?

How the ESP32-S3 programs the FPGA, how bitstreams are structured, and how cores talk to FPGA-Companion over SPI is exactly the kind of thing covered in the FPGA Fundamentals course.

**[FPGA Fundamentals: AI as Your Co-Developer →](https://learn.papilioworks.com)**
