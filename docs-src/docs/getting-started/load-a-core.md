---
id: load-a-core
title: Load a Core (OTA JTAG)
sidebar_label: Load a Core
sidebar_position: 3
---

# Load a Core via OTA JTAG

The Papilio Retrocade loads FPGA bitfiles wirelessly over WiFi — no programmer cables needed after the initial firmware flash. This process is called **OTA JTAG** and is handled by FPGA-Companion.

---

## How It Works

1. Bitfile (`.fs` file for Gowin) lives on the SD card or is pushed via WiFi
2. FPGA-Companion reads the bitfile and programs the Tang Primer 20K's FPGA flash over JTAG
3. On power-up, the FPGA loads from flash automatically
4. Switching cores = selecting a new `.fs` file from the OSD menu

---

## Prerequisites

- FPGA-Companion firmware flashed (see [Flash the Firmware](./flash-firmware))
- The Retrocade is powered and showing the OSD on HDMI
- Your WiFi network credentials
- The core bitfile you want to load

---

## Step 1: Connect to WiFi

:::note Content Coming Soon
WiFi configuration screenshots will be added here.
:::

1. From the OSD menu, navigate to **Settings → WiFi**
2. Select your network and enter the password
3. The ESP32-S3 will remember your credentials across reboots

---

## Step 2: Download Core Bitfiles

:::note Content Coming Soon
Direct download links for each core will be added here once the first release is published.
:::

Available cores:

| Core | System | Status | Filename |
|---|---|---|---|
| A2600Nano | Atari 2600 | ✓ Working | `a2600.fs` |
| C64Nano | Commodore 64 | ✓ Working | `c64.fs` |
| SNESTang | SNES | In Progress | `snes.fs` |
| NESTang | NES | In Progress | `nes.fs` |

Download from: [https://github.com/Papilio-Retrocade](https://github.com/Papilio-Retrocade)

---

## Step 3: Load via OSD Menu

:::note Content Coming Soon
OSD menu navigation screenshots will be added here.
:::

**Option A — From SD Card**
1. Copy the `.fs` file to the root of your SD card
2. In the OSD menu, navigate to **Core → Load from SD**
3. Select your `.fs` file
4. FPGA-Companion programs the FPGA flash (~15 seconds)
5. The system reboots into the new core automatically

**Option B — Via WiFi (OTA Push)**
1. In the OSD menu, find the device's IP address under **Settings → Network**
2. Open a browser on your computer and navigate to `http://<device-ip>/`
3. Upload the `.fs` file via the web interface
4. FPGA-Companion programs the FPGA flash and reboots

---

## Step 4: Verify the Core Loaded

After the FPGA reboots:
- The HDMI output should change to match the selected core
- The RGB LED color will change to indicate which core is active
- You should see the core's startup screen or ROM browser

---

## Switching Between Cores

You can store multiple `.fs` files on the SD card and switch between them without reflashing:

1. Press the OSD button to open the menu
2. Navigate to **Core → Switch Core**
3. Select the core you want to load
4. FPGA reprograms in ~15 seconds

---

## Next Step

Core is loaded. Now set up your SD card with ROMs:

**[Set Up Your SD Card →](./sd-card-setup)**

---

## 🎓 Want to Go Deeper?

The OTA JTAG system — how the ESP32-S3 talks to the FPGA over SPI/JTAG, how bitfiles are structured, how core switching works — is exactly the kind of thing covered in the FPGA Fundamentals course.

**[FPGA Fundamentals: AI as Your Co-Developer →](https://learn.papilioworks.com)**
