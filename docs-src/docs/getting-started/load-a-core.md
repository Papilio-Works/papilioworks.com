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
- The core bitfile you want to load
- **Optional:** a custom-built firmware binary with your WiFi credentials, if you want to push cores over WiFi instead of an SD card (see Step 1 below)

---

## Step 1: WiFi Is Optional (and Not Yet Configurable from the OSD)

FPGA-Companion does not currently have an in-menu WiFi setup screen — there's no way to type an SSID/password into the OSD. WiFi credentials are compiled into the firmware binary itself, not entered at runtime.

The official pre-built release (`fpga-companion-esp32s3-v1.0.0-merged.bin`) ships with a **placeholder SSID** and will never connect to a real network. This is intentional — the maintainers don't bake real credentials into a public binary.

:::tip Most users can skip WiFi entirely
Loading cores from an SD card (**Step 3, Option A** below) works fully offline and needs no WiFi at all. Only use the steps below if you specifically want OTA core pushing or remote WiFi logging.
:::

### Building firmware with your own WiFi credentials

1. Install [ESP-IDF v5.2.2](https://docs.espressif.com/projects/esp-idf/en/v5.2.2/esp32s3/get-started/index.html) and set up the `esp32s3` target toolchain
2. Clone the firmware source:
   ```bash
   git clone --recursive https://github.com/Papilio-Retrocade/FPGA-Companion.git
   cd FPGA-Companion/src/esp32
   ```
3. Copy the credentials template and fill in your network:
   ```bash
   cp sdkconfig.defaults.local.example sdkconfig.defaults.local
   ```
   Edit `sdkconfig.defaults.local`:
   ```
   CONFIG_WIFI_LOG_SSID="YourNetworkName"
   CONFIG_WIFI_LOG_PASSWORD="YourNetworkPassword"
   ```
4. Build the firmware:
   ```bash
   idf.py set-target esp32s3
   idf.py build
   ```
5. Flash the resulting `build/fpga_companion.bin` using Papilio Loader (**USB/Serial**, Advanced Options → Flash Address `0x10000`) or directly with `idf.py -p <port> flash`

:::warning
`sdkconfig.defaults.local` is gitignored on purpose — never commit real WiFi credentials to a public fork or share your compiled binary publicly.
:::

:::note Roadmap
A future release may add in-OSD WiFi provisioning (enter SSID/password without rebuilding). Until then, building from source is the only way to bake in real credentials.
:::

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
