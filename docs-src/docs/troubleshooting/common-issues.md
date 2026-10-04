---
id: common-issues
title: Common Issues
sidebar_label: Common Issues
sidebar_position: 3
---

# Common Issues

Known issues and workarounds for the Papilio Retrocade.

---

:::note[Content Coming Soon]
This page will be updated as issues are identified during the beta program. Check [community.papilioworks.com](https://community.papilioworks.com) for the latest known issues.
:::

---

## Known Issues

| Issue | What to do |
|---|---|
| Commodore 64 disk (`.d64`) games don't load reliably | Use cartridge (`.crt`) images for now |
| ROM loading crashes or restarts the board | The SD card's `/roms` folder may be damaged, often after a write was interrupted. Back up your files, delete the folder with a card reader, and copy your ROMs again |
| The USB serial port disappears | The board is in USB Host mode. Press the **BOOT** button to switch back |
| The picture freezes or looks wrong after several restarts | Software restarts don't restart the FPGA chip. Unplug the board and plug it back in |
| The first WiFi request after a pause fails | Try again. A board that has been idle can drop the first request |
| Loading a ROM over WiFi says the card write failed | Insert a FAT-formatted SD card |

---

## Reporting Issues

Found a bug? Please report it:
- Hardware issues: [GitHub Issues — papilio_retrocade_hardware](https://github.com/Papilio-Retrocade)
- Firmware issues: [GitHub Issues — FPGA-Companion](https://github.com/Papilio-Retrocade/FPGA-Companion)
- Core issues: Open an issue on the relevant core repo
