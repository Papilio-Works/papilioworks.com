---
id: commodore-64
title: Commodore 64 (C64Nano)
sidebar_label: Commodore 64
sidebar_position: 2
---

# Commodore 64 (C64Nano)

**Status: ✓ Working**

The C64 core runs the Commodore 64 (1982) — featuring an accurate 6510 CPU, SID sound chip, VIC-II graphics, and CIA timers.

Based on [C64Nano](https://github.com/Papilio-Retrocade/C64Nano) — ported to the Retrocade by Papilio Works.

---

## Compatibility

:::note Content Coming Soon
ROM and disk image compatibility details will be added here.
:::

- Disk image formats: `.d64`, `.g64`
- Tape formats: `.tap`
- Cartridge formats: `.crt`
- Program files: `.prg`

## SD Card Setup

Place ROMs and disk images in `/c64/` on your FAT32-formatted SD card.

## Keyboard Input

The C64 core supports USB HID keyboards via the ESP32-S3 USB port. Connect a USB keyboard for BASIC input and games with keyboard controls.

## Controls

:::note Content Coming Soon
Joystick button mapping for Xbox/PS4/PS5 will be added here. The C64 used a 1-button joystick — mapping is straightforward.
:::

## Known Issues

:::note Content Coming Soon
Known issues and workarounds will be listed here as they are identified.
:::

---

## 🎓 Want to Go Deeper?

Curious how the SID chip synthesis works, or how the C64's bus arbitration is replicated in FPGA logic?

**[Retro Game Core Development on Papilio Retrocade →](https://learn.papilioworks.com)**
