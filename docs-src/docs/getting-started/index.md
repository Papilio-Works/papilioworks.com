---
id: index
title: Retrocade Overview
sidebar_label: Retrocade Overview
sidebar_position: 1
---

# Retrocade Overview

Welcome to the **Papilio Retrocade 20K** — an FPGA retro gaming system built around the Sipeed Tang Primer 20K.

This page explains the hardware and software that make up your Retrocade, and how they fit together. The rest of the guide walks you from unboxing to your first game running. Target time: **under 30 minutes**.

---

## The Hardware

The Retrocade system is built from three modular boards:

### 1. Papilio Retrocade Daughterboard
Designed by Papilio Works. Provides:
- **HDMI** video output
- **3.5mm stereo audio** output
- **USB-C** power input
- **Winbond 32 MB SDRAM** for core use
- **PMOD** expansion connector
- **WS2812B** RGB status LED
- **Onboard JTAG** programmer

### 2. Tang Primer 20K (by Sipeed)
The FPGA core module. Contains:
- **Gowin GW2A-LV18** FPGA (20,736 LUTs)
- **128 MB DDR3** on-module
- **32 Mbit NOR Flash**
- **27 MHz** oscillator
- **microSD** card slot
- Plugs directly into the Retrocade header

The FPGA is where the game system runs. It does nothing until it is programmed with a game core.

### 3. ESP32-S3 SuperMini
The wireless brain. It:
- Runs the **Papilio ESP Bootloader** and the **FPGA-Companion** app
- Connects to **WiFi**
- Pairs **Bluetooth BLE 5.0** gamepads (Xbox Series, PS4, PS5)
- Reads **USB** keyboards, mice, and gamepads
- Reads the **SD card**
- Programs the FPGA

---

## The Software

Each piece of software has one job:

| Part | What it is | What it does |
|---|---|---|
| **FPGA core** (for example, the Atari 2600 core) | A design that runs on the FPGA | Recreates a game system and runs the game |
| **ROM** (a game) | A game file on the SD card | The game the core plays |
| **FPGA-Companion** | An app on the ESP32-S3 | Loads ROMs into the core, reads your game controllers, and shows the on-screen menu |
| **Papilio ESP Bootloader** | A small program on the ESP32-S3 | Receives new software and writes it to the board |
| **Papilio Loader** | Software on your computer | Sends new software to the board |

**The Papilio ESP Bootloader** works with Papilio Loader to install the programs that run on the board: ESP32 user apps like FPGA-Companion, and FPGA bit files like the Atari 2600 core. The bootloader only runs when the board needs to be programmed. The rest of the time your app runs, and the bootloader stays out of the way.

**FPGA-Companion** is an ESP32 user app. It runs whenever you're playing. It loads ROMs into the running FPGA game core, such as the Atari 2600 core, and passes your controller's buttons to it.

**Papilio Loader** runs as a desktop application, a website, or a command-line utility. It uses the bootloader to write ESP32 user apps and FPGA cores to the board, over WiFi or USB. It can also send game ROMs to the board over WiFi, where FPGA-Companion saves them to the SD card and loads them into the core.

![Papilio Loader on your computer sends apps and FPGA cores to the bootloader and ROMs to FPGA-Companion on the ESP32-S3. The bootloader programs the Gowin FPGA on the Tang Primer 20K, and FPGA-Companion loads ROMs from the SD card on the Tang Primer 20K into the game core.](../../static/img/hardware/retrocade-system-diagram.svg)

### What is the Papilio ESP Bootloader?

The Papilio ESP Bootloader is a small program that is permanently installed on the board's ESP32. It is what makes the board easy to program and hard to break. In order of importance, it lets you:

1. **Program the FPGA.** Load a game core or your own design onto the FPGA, over USB or over WiFi, with no special programmer. This is how you switch to a different core: program the new core with Papilio Loader.
2. **Update the ESP32 firmware.** Install new versions of FPGA-Companion over USB or over WiFi. Use USB the first time, then WiFi for everyday updates so the board can stay plugged into your TV.
3. **Recover a board that won't start.** If an update goes wrong or the board shows nothing on screen, reconnect USB and reinstall. The bootloader is kept separate from FPGA-Companion, so a bad update can't lock you out.
4. **Join your WiFi network.** You enter your network name and password once, and the board remembers them.

<details>
<summary>Technical details: flash layout</summary>

The bootloader also keeps two application slots, so a failed update can be rolled back to the last working version automatically. The current 4 MB flash layout is:

| Partition | Address | Purpose |
| --- | ---: | --- |
| `factory` | `0x20000` | Papilio ESP Bootloader |
| `ota_0` | `0x100000` | Active FPGA-Companion application |
| `ota_1` | `0x280000` | Rollback FPGA-Companion application |

</details>

### What is FPGA-Companion?

FPGA-Companion is the open-source app that runs on the ESP32-S3 whenever you're playing. The bootloader and Papilio Loader get software onto the board; the Companion is what you use day to day with the core that is running on the FPGA.

In order of importance, it:

1. **Loads and manages ROMs.** Browse games on the SD card from the on-screen menu and load them into the running core. You can also send a ROM to the board over WiFi.
2. **Provides game controller input.** Pair a Bluetooth gamepad, or plug in a USB keyboard, mouse, or gamepad, and the Companion passes it to the core.
3. **Shows the on-screen menu (OSD).** Pick ROMs and adjust settings from your TV with your controller.
4. **Recognizes the running core** and shows the menu and controls that match it.

The Companion does not program the FPGA or switch cores. The core on the FPGA is whichever one you last programmed with Papilio Loader. See [Core Compatibility](../cores/compatibility) for the available cores and their status.

Source: [https://github.com/Papilio-Retrocade/FPGA-Companion](https://github.com/Papilio-Retrocade/FPGA-Companion)

### What is Papilio Loader?

Papilio Loader is the tool you use on your computer to put software on the board: ESP32 apps, FPGA cores, and, over WiFi, game ROMs. It works over USB or WiFi. See the [Papilio Loader documentation](../papilio-loader/index.md) for details.

---

## What's Included

| Item | Board Only | Full Kit |
|---|---|---|
| Papilio Retrocade PCB | ✓ | ✓ |
| Tang Primer 20K | — | ✓ |
| ESP32-S3 SuperMini | — | ✓ |
| FPGA-Companion firmware (preloaded) | ✓ | ✓ |
| A2600 + C64 cores (included) | ✓ | ✓ |

> **Board only buyers:** You will need a Tang Primer 20K and an ESP32-S3 SuperMini. Both are available on AliExpress/Amazon.

---

## What You Need Before Starting

- A **USB-C cable** and 5V power source (phone charger works)
- An **HDMI monitor or TV**
- A **microSD card** (any size, FAT32 formatted)
- A **BLE gamepad**: Xbox Series X/S, PS4 DualShock 4, or PS5 DualSense
- A computer with **USB** (for initial firmware flash, Windows/Mac/Linux)
- Your ROM files for Atari 2600 and/or Commodore 64

---

## Setup Overview

1. **[Flash the firmware](./flash-firmware)** — install FPGA-Companion on the ESP32-S3 *(one time only)*
2. **[Load a core](./load-a-core)** — program the A2600 or C64 bitstream onto the FPGA with Papilio Loader
3. **[Set up your SD card](./sd-card-setup)** — format FAT32, create folders, copy ROMs
4. **[Pair your controller](./pair-your-controller)** — connect your Xbox/PS4/PS5 gamepad over BLE
5. Connect HDMI and USB-C power, navigate the OSD menu, and play

---

:::tip[Start Here]
If you're reading this on a freshly opened box, start with **[Flash the Firmware →](./flash-firmware)**
:::

---

## 🎓 Want to Go Deeper?

This guide gets you playing games. If you want to understand how the FPGA works and learn to use AI to write and debug FPGA code like a pro:

**[FPGA Fundamentals: AI as Your Co-Developer →](https://learn.papilioworks.com)**  
*Learn synthesis, timing, and how to use Claude as your FPGA co-pilot.*
