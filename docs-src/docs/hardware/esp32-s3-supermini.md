---
id: esp32-s3-supermini
title: ESP32-S3 SuperMini
sidebar_label: ESP32-S3 SuperMini
sidebar_position: 4
---

# ESP32-S3 SuperMini

The wireless brain of the Retrocade system. A compact ESP32-S3 development board that handles all the "smart" functions so the FPGA can focus purely on running the game core.

---

## Specifications

| Feature | Detail |
|---|---|
| MCU | Espressif ESP32-S3 |
| WiFi | 802.11 b/g/n 2.4 GHz |
| Bluetooth | BLE 5.0 |
| Flash | 4–8 MB (varies by vendor) |
| PSRAM | 2–8 MB (varies by vendor) |
| SD Card | microSD slot (FAT32) |
| USB | USB-C, USB OTG |

---

## Functions in the Retrocade System

| Function | Description |
|---|---|
| **FPGA-Companion firmware** | The main firmware running the OSD and all wireless features |
| **OSD menu** | On-screen display rendered over HDMI via FPGA |
| **WiFi OTA** | Wireless push of FPGA bitfiles and firmware updates |
| **BLE gamepad** | Pairs and manages Xbox/PS4/PS5 controllers |
| **SD card** | Hosts ROM files, core bitfiles, and configuration |
| **JTAG bridge** | Programs the FPGA via SPI-to-JTAG bridge |

---

## Where to Buy

The ESP32-S3 SuperMini is available from:
- AliExpress (many vendors — search "ESP32-S3 SuperMini")
- Amazon

Approximate price: $4–8 USD.

:::caution
Verify the board has USB-C and the ESP32-S3 chip (not S2 or C3). The "SuperMini" form factor is a compact board with the chip on the top side.
:::

---

:::note Content Coming Soon
Pin mapping to the Retrocade header and FPGA-Companion firmware configuration details will be added here.
:::

---

## 🎓 Want to Go Deeper?

The ESP32-S3 ↔ FPGA communication — SPI protocol, JTAG bridge, Wishbone bus — is the topic of the FPGA + ESP32 Wishbone Development course.

**[FPGA + ESP32 Wishbone Development →](https://learn.papilioworks.com)**
