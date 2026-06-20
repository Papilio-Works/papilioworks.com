---
id: wishbone-overview
title: Wishbone Bus Architecture
sidebar_label: Wishbone Overview
sidebar_position: 2
---

# Wishbone Bus Architecture

The Papilio ecosystem uses the **Wishbone B4** open-source bus standard as the internal interconnect between the FPGA core and peripheral IP blocks.

---

:::note Content Coming Soon
This overview will cover:

- What Wishbone is and why Papilio uses it
- The master/slave/interconnect topology used in the Retrocade firmware
- How FPGA-Companion on the ESP32-S3 talks to Wishbone peripherals in the FPGA
- The `papilio_wishbone_*` library and how to use it to add custom peripherals
- Worked example: adding a new peripheral to the Retrocade FPGA design
:::

---

## Source Code

Wishbone library: [github.com/Papilio-Labs/papilio_wishbone_bus](https://github.com/Papilio-Labs)

---

## 🎓 Want to Go Deeper?

The Wishbone development course covers the complete Papilio peripheral development workflow — from Wishbone spec to working hardware, using AI to generate and debug the Verilog at every step.

**[FPGA + ESP32 Wishbone Development →](https://learn.papilioworks.com)**
