---
id: index
title: What's in the Box
sidebar_label: What's in the Box
sidebar_position: 1
---

# What's in the Box

Welcome to the **Papilio Retrocade 20K** — an FPGA retro gaming system built around the Sipeed Tang Primer 20K.

This guide walks you from unboxing to your first game running. Target time: **under 30 minutes**.

---

## The Three Boards

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
- Plugs directly into the Retrocade header

### 3. ESP32-S3 SuperMini
The wireless brain. Handles:
- **WiFi OTA** firmware and bitfile updates
- **Bluetooth BLE 5.0** gamepad pairing (Xbox Series, PS4, PS5)
- **On-screen display (OSD)** menu
- **SD card** management and ROM loading
- **USB HID** keyboard and gamepad input

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
2. **[Load a core](./load-a-core)** — push the A2600 or C64 bitfile to FPGA flash via OTA JTAG
3. **[Set up your SD card](./sd-card-setup)** — format FAT32, create folders, copy ROMs
4. **[Pair your controller](./pair-your-controller)** — connect your Xbox/PS4/PS5 gamepad over BLE
5. Connect HDMI and USB-C power, navigate the OSD menu, and play

---

:::tip Start Here
If you're reading this on a freshly opened box, start with **[Flash the Firmware →](./flash-firmware)**
:::

---

## 🎓 Want to Go Deeper?

This guide gets you playing games. If you want to understand how the FPGA works and learn to use AI to write and debug FPGA code like a pro:

**[FPGA Fundamentals: AI as Your Co-Developer →](https://learn.papilioworks.com)**  
*Learn synthesis, timing, and how to use Claude as your FPGA co-pilot.*
