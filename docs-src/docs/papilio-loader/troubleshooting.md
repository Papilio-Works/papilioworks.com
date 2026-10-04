---
id: troubleshooting
title: Loader Troubleshooting
sidebar_label: Troubleshooting
sidebar_position: 6
---

# Loader Troubleshooting

Quick fixes for the most common Papilio Loader issues.

---

## Connecting

| Problem | Fix |
|---|---|
| The page says Web Serial isn't available | Use Chrome or Edge on a desktop computer. Other browsers can't talk to USB serial ports. |
| No serial ports listed | Try a different USB cable. It must be a data cable, not charge-only. |
| Connect fails because the port is busy | Close anything else using the port, such as a serial monitor, an IDE, or another Loader tab. |
| The port disappears after the board starts | The board is in USB Host mode, which turns off the USB serial port. Press the **BOOT** button on the ESP32-S3 to switch back. |
| The board is not on the list of ports | Show every port under **Advanced options** with **Show all USB serial ports**. |

---

## Programming

| Problem | Fix |
|---|---|
| "Not a Gowin FPGA bitstream" or "not ESP32 firmware" | You picked the file for the wrong card. FPGA files are Gowin `.bin` exports. ESP32 files are firmware `.bin` files. |
| `.fs` file rejected | Only Gowin's headerless **Binary File** (`.bin`) export works. Export it again from the Gowin tools. |
| WiFi programming fails partway | Move the board closer to your router, or switch **FPGA transport** to **USB / Serial only** in **Advanced options**. |
| Loader can't find the board's IP | In **Board Status**, click **Find My IP**, or use **Scan LAN for Devices** in the Desktop App. The board and computer must be on the same network. |
| The first WiFi request after a pause fails | Try again. A board that has been idle can drop the first request. |
| Nothing on screen after programming | Wait a few seconds for the board to restart. If it doesn't, click **Resume User App** under **Advanced options**. |

---

## A Board That Won't Start

Try these in order:

1. **Resume User App** or **Start ESP Bootloader** under **Advanced options**, to see whether the board answers.
2. **Recover via USB** in the connection panel. This forces the board into the bootloader without any button presses, and Loader tells you whether it recovered.
3. Hold **BOOT**, press **RESET**, and run the recovery again. Use this when USB Host mode has turned off the USB serial port.
4. Reinstall the board with the [Getting Started flasher](https://papilioworks.com/getting-started/).

:::tip
Software resets don't restart the FPGA chip. If the picture is frozen or garbled after several resets, unplug the board and plug it back in.
:::

---

## Web Edition Limits

| Missing in the Web Edition | Use instead |
|---|---|
| Scan LAN for Devices | **Find My IP** or type the IP address |
| WiFi Log Monitor | The **Status Log** over USB, or the Desktop App |
| Saved Files Library | The Desktop App |

---

## Still Stuck?

Open the **Status Log** and click **Open Log** to watch the board's boot messages, then paste the output into an AI assistant or the community forum for a quick diagnosis.

---

## 🎓 Want to Go Deeper?

Debugging hardware is a learnable skill. The FPGA Debugging with AI course teaches a systematic approach, from reading tool output to isolating faults, with AI as your debugging partner.

**[Explore the Courses →](https://learn.papilioworks.com)**
