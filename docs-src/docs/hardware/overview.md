---
id: overview
title: Hardware Overview
sidebar_label: Overview
sidebar_position: 1
---

# Hardware Overview

The Papilio Retrocade 20K is a three-board modular system. Each board has a specific role — FPGA processing, connectivity, and wireless control.

---

## System Architecture

```
┌─────────────────────────────────┐
│       ESP32-S3 SuperMini        │
│  WiFi · BLE · OSD · SD Card     │
│         SPI/JTAG ↕              │
├─────────────────────────────────┤
│     Papilio Retrocade Board     │
│  HDMI · Audio · SDRAM · PMOD    │
│         Header ↕                │
├─────────────────────────────────┤
│       Tang Primer 20K           │
│   GW2A-18 FPGA · 128MB DDR3     │
└─────────────────────────────────┘
```

The three boards stack together:
1. Tang Primer 20K plugs into the Retrocade's SO-DIMM-style header
2. ESP32-S3 SuperMini plugs into the Retrocade's pin header

---

## Quick Specs

| Board | Key Component | Purpose |
|---|---|---|
| Retrocade | Winbond W9825G6KH-6 32MB SDRAM | Provides extra RAM for cores; HDMI output |
| Tang Primer 20K | Gowin GW2A-LV18 + 128MB DDR3 | Runs the FPGA core |
| ESP32-S3 SuperMini | Espressif ESP32-S3 | WiFi, BLE, OSD, SD card |

---

:::note Content Coming Soon
Pinout diagrams, connector descriptions, and power consumption data will be added here.
:::

See detailed pages for each board:
- [Retrocade Daughterboard](./retrocade-board)
- [Tang Primer 20K](./tang-primer-20k)
- [ESP32-S3 SuperMini](./esp32-s3-supermini)

---

## 🎓 Want to Go Deeper?

The hardware architecture — why three boards, how the Wishbone bus connects them, how the FPGA interfaces with external SDRAM — is covered in the Building FPGA Hardware Products course.

**[Building FPGA Hardware Products →](https://learn.papilioworks.com)**
