---
id: pair-your-controller
title: Pair Your Controller
sidebar_label: Pair Your Controller
sidebar_position: 5
---

# Pair Your Controller

FPGA-Companion supports Bluetooth BLE gamepads out of the box. USB HID keyboards and gamepads are also supported if you prefer wired.

---

## Supported Controllers

| Controller | Protocol | Notes |
|---|---|---|
| **Xbox Series X / S** | BLE | Recommended — best tested |
| **PS4 DualShock 4** | BLE | Fully supported |
| **PS5 DualSense** | BLE | Fully supported |
| USB keyboard | USB HID | For C64 text input |
| USB gamepad | USB HID | Generic HID gamepads |

:::note
Original Xbox One controllers (pre-Series) use a proprietary wireless protocol and are **not** supported. Use a Series X/S controller.
:::

---

## Pairing a Bluetooth Controller

:::note Content Coming Soon
OSD screenshots for the pairing process will be added here.
:::

### Xbox Series X/S

1. Power on your controller (press the Xbox button)
2. Put the controller in pairing mode: **hold the small sync button** on the top of the controller for 3 seconds until the Xbox button flashes rapidly
3. On the Retrocade OSD, navigate to **Settings → Bluetooth → Pair New Device**
4. The controller should appear in the device list within a few seconds
5. Select it to pair — the Xbox button will go solid when paired

### PS4 DualShock 4

1. Make sure the controller is off
2. Hold **Share + PS button** simultaneously until the light bar flashes white (pairing mode)
3. On the Retrocade OSD, navigate to **Settings → Bluetooth → Pair New Device**
4. Select the DualShock 4 from the list
5. Light bar turns blue when paired

### PS5 DualSense

1. Make sure the controller is off
2. Hold **Create button + PS button** simultaneously until the light bar flashes (pairing mode)
3. On the Retrocade OSD, navigate to **Settings → Bluetooth → Pair New Device**
4. Select the DualSense from the list
5. Light bar turns solid when paired

---

## Button Mapping

:::note Content Coming Soon
Default button mapping tables for each core (A2600, C64) will be added here.
:::

Default mapping varies by core. The OSD menu allows remapping all buttons.

---

## Using a USB Keyboard or Gamepad

Plug into the **USB-C port** on the ESP32-S3 SuperMini using a USB-C adapter or OTG cable. USB HID devices are recognized automatically — no pairing needed.

:::tip C64 Users
A USB keyboard is very useful for the C64 core, which supports full keyboard input for BASIC and games that use keyboard controls.
:::

---

## Pairing Remembers Your Controllers

FPGA-Companion stores paired controller info in flash memory. Your controller will reconnect automatically on next power-on — no re-pairing needed.

To remove a paired controller, navigate to **Settings → Bluetooth → Manage Devices**.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Controller doesn't appear in scan | Make sure controller is in **pairing mode** (flashing light), not just powered on |
| Controller paired but inputs not working | Check the ROM browser — some button presses may open the OSD rather than pass to the game |
| Xbox controller keeps disconnecting | Try pairing via USB cable first, then disconnect |
| PS5 controller shows "DualSense" but doesn't respond | Confirm FPGA-Companion version — PS5 support was added in v0.9 |

---

## You're Ready to Play

Everything is set up. Connect your HDMI cable to a monitor, power on the Retrocade via USB-C, and use the OSD to select a ROM.

---

## 🎓 Want to Go Deeper?

The Bluetooth HID implementation — how BLE pairing works, how the ESP32-S3 translates gamepad buttons to the FPGA's input interface, how you could add support for a new controller — is covered in the FPGA + ESP32 Wishbone Development course.

**[FPGA + ESP32 Wishbone Development →](https://learn.papilioworks.com)**
