---
id: faq
title: Troubleshooting FAQ
sidebar_label: FAQ
sidebar_position: 1
---

# Troubleshooting FAQ

Quick answers to the most common problems.

---

:::note Content Coming Soon
This FAQ will be populated from real support questions as they come in. Check back after launch, or ask your question at [community.papilioworks.com](https://community.papilioworks.com).
:::

---

## Setup Issues

**Nothing on screen after powering on**
- Confirm HDMI is connected to the Retrocade board, not the Tang Primer 20K
- Confirm ESP32-S3 is fully seated in the header
- Confirm you're using the Retrocade USB-C for power, not the Tang Primer 20K's USB

**FPGA-Companion OSD appears but no core loaded**
- Load a core bitfile — see [Load a Core](../getting-started/load-a-core)

---

## ROM / SD Card Issues

**SD card not detected**
- Ensure card is inserted in the ESP32-S3 SuperMini slot
- Ensure card is formatted FAT32 (not exFAT)

**ROMs don't appear in the browser**
- Check folder names are lowercase: `/a2600/`, `/c64/`
- Check file extensions match what the core expects

---

## Controller Issues

**Bluetooth controller won't pair**
- Put controller in **pairing mode** (not just powered on) — see [Pair Your Controller](../getting-started/pair-your-controller)

**Controller disconnects during gameplay**
- Try moving closer to the board
- Some USB-C chargers cause RF interference — try a different power source

---

## Video / Audio Issues

**No audio from 3.5mm jack**
- Confirm you have a working stereo cable
- Some cores require audio to be enabled in the core's OSD settings

**Screen tearing or display issues**
- Try a different HDMI cable
- Some monitors don't handle non-standard refresh rates well — test with another display

---

## Still Stuck?

Ask on the community forum — the AI bot can answer common questions 24/7, and Jack checks in regularly.

**[community.papilioworks.com →](https://community.papilioworks.com)**

---

## 🎓 Want to Go Deeper?

For debugging FPGA synthesis errors, timing violations, and core-level issues:

**[FPGA Debugging with AI →](https://learn.papilioworks.com)**
