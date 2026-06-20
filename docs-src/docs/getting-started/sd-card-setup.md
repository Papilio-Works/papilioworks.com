---
id: sd-card-setup
title: SD Card Setup
sidebar_label: SD Card Setup
sidebar_position: 4
---

# SD Card Setup

The SD card holds your ROM files and FPGA core bitfiles. Setting it up correctly takes about 5 minutes.

---

## SD Card Requirements

| Property | Requirement |
|---|---|
| Format | **FAT32** (not exFAT, not NTFS) |
| Size | Any size — 4 GB is more than enough |
| Speed | Any class (Class 10 or UHS-I recommended) |
| Type | microSD (use a full-size adapter if needed) |

---

## Step 1: Format as FAT32

:::note Content Coming Soon
Screenshots for Windows, Mac, and Linux formatting will be added here.
:::

**Windows**
- For cards ≤32 GB: right-click in File Explorer → Format → FAT32
- For cards >32 GB: use [guiformat](http://ridgecrop.co.uk/index.htm?guiformat.htm) (free tool)

**Mac**
- Open Disk Utility → select card → Erase → MS-DOS (FAT) format

**Linux**
```bash
sudo mkfs.fat -F 32 /dev/sdX1   # Replace sdX1 with your card's device
```

---

## Step 2: Create the Folder Structure

Create these folders at the root of the SD card:

```
/
├── a2600/          ← Atari 2600 ROMs (.bin, .a26)
├── c64/            ← Commodore 64 ROMs (.d64, .prg, .crt)
├── snes/           ← SNES ROMs (.sfc, .smc)  [for when SNESTang is ready]
├── nes/            ← NES ROMs (.nes)          [for when NESTang is ready]
└── cores/          ← FPGA bitfiles (.fs)      [optional — can also be at root]
```

:::tip
You only need to create folders for the cores you're using. The `/a2600/` and `/c64/` folders are the ones you need for the currently working cores.
:::

---

## Step 3: Copy Your ROMs

Drop your ROM files into the appropriate folder:

| System | Folder | File Extensions |
|---|---|---|
| Atari 2600 | `/a2600/` | `.bin`, `.a26` |
| Commodore 64 | `/c64/` | `.d64`, `.prg`, `.crt`, `.tap` |
| SNES | `/snes/` | `.sfc`, `.smc` |
| NES | `/nes/` | `.nes` |

:::note ROMs Are Not Included
ROM files are copyrighted. You'll need to source your own. Many classic games have been officially released as freeware — check [atariage.com](https://atariage.com) for public domain Atari 2600 homebrew.
:::

---

## Step 4: Insert and Test

1. Insert the microSD card into the **ESP32-S3 SuperMini** SD card slot (on the side)
2. Power on the Retrocade
3. In the OSD menu, navigate to the ROM browser for your loaded core
4. Your ROM files should appear in the list

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| SD card not detected | Re-seat the card. Confirm it's in the ESP32-S3, not the Tang Primer 20K |
| "No files found" in ROM browser | Check folder name exactly (`a2600/` not `Atari2600/`). FAT32 is case-insensitive but the expected folder names are lowercase |
| Card detected but can't read files | Re-format as FAT32. exFAT will not work |
| Some ROMs don't show up | The ROM browser filters by extension. Confirm your file extension matches the expected formats |

---

## Next Step

SD card is ready. Now pair your Bluetooth gamepad:

**[Pair Your Controller →](./pair-your-controller)**

---

## 🎓 Want to Go Deeper?

The SD card management system — how FPGA-Companion indexes ROMs, communicates file paths to the FPGA core, and manages multiple cores — is covered in depth in the FPGA Fundamentals course.

**[FPGA Fundamentals: AI as Your Co-Developer →](https://learn.papilioworks.com)**
