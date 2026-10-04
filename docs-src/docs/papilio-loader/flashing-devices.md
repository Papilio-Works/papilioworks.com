---
id: flashing-devices
title: Flashing Devices
sidebar_label: Flashing Devices
sidebar_position: 2
---

# Flashing Devices

The Loader has two cards: one for the **FPGA** and one for the **ESP32**. Pick a file, press the program button, and Loader handles the rest. It connects over USB, starts the bootloader on your board, and chooses the best way to send the file.

---

## Connect Your Board

1. Plug the ESP32-S3 into your computer with a USB data cable.
2. Click **Connect USB** and choose the board's serial port.
3. To program over WiFi, the board needs to be on your network and Loader needs its IP address:
   - **Desktop App:** click **Scan LAN for Devices**.
   - **Web Edition:** open **Board Status** and click **Find My IP**, or type the IP address and click **Use This IP**.

If the board is not on WiFi yet, enter your network name and password and click **Send WiFi Credentials**. You only need to do this once.

---

## Programming the FPGA

Use this to load a game core or your own design.

1. Click the file picker on the **FPGA Flash** card and choose a Gowin `.bin` bitstream.
2. Click **Program FPGA**.
3. Watch the progress bar. When it finishes, the board returns to your application automatically and the new core starts.

The core is written to the FPGA's flash, so it is still there after you power the board off.

:::warning[Only .bin files work]
Loader needs Gowin's headerless **Binary File** (`.bin`) export. It checks the file before sending and rejects `.fs` files, ESP32 firmware, and anything else that isn't a Gowin bitstream.
:::

---

## Programming the ESP32

Use this to install or update FPGA-Companion.

1. Click the file picker on the **ESP32 Flash** card and choose a firmware `.bin`.
2. Click **Program ESP32**.

Loader detects which kind of file you chose:

| File | What Loader does |
|---|---|
| **Merged image** (for a new or recovered board) | Writes the whole flash over USB, including the bootloader. Use this for first-time setup and recovery. |
| **App-only image** (an FPGA-Companion update) | Starts the bootloader and installs the update beside your current version. The board restarts into the new version when it is done. |

An app-only update never touches the bootloader, so it can't lock you out of your board.

---

## USB or WiFi?

By default, Loader uses WiFi when it knows your board's IP address and falls back to USB when it doesn't. To choose yourself, open **Advanced options** and set **FPGA transport**:

- **Auto** uses WiFi when available.
- **OTA / WiFi only** never uses USB.
- **USB / Serial only** never uses WiFi.

WiFi is faster and needs no cable to your computer. USB works any time the board is plugged in.

---

## Board Status and Recovery

The **Board Status** panel shows whether the board is running the **bootloader** or your **application** (FPGA-Companion), plus its IP address. Under **Advanced options**:

- **Start ESP Bootloader** restarts the board into the bootloader.
- **Resume User App** returns to your application. Loader does this for you after programming.

If a board won't start, click **Recover via USB** in the connection panel. See [Troubleshooting](./troubleshooting).

---

## The Status Log

Every action is logged with timestamps. Use **Open Log** to watch the board's live boot messages over USB, which is useful when something goes wrong.

---

## Next Step

Keep your favorite cores and firmware handy:

**[Saved Files Library →](./saved-files-library)**

---

## 🎓 Want to Go Deeper?

Ever wondered how a bitstream gets from your computer into the FPGA's flash? The FPGA Fundamentals course covers flash memory, the link between the ESP32 and FPGA, and how to debug programming problems with AI.

**[FPGA Fundamentals: AI as Your Co-Developer →](https://learn.papilioworks.com)**
