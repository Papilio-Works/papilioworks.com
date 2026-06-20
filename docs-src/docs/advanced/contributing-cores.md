---
id: contributing-cores
title: Contributing Cores
sidebar_label: Contributing Cores
sidebar_position: 1
---

# Contributing Cores

How to port an existing FPGA retro core to the Papilio Retrocade, or develop a new one.

---

:::note Content Coming Soon
The complete core porting guide will be written here, covering:

- Understanding the Retrocade CST (constraint) file and pin assignments
- Differences from the Tang Primer 20K standalone (SDRAM addressing, HDMI output)
- FPGA-Companion integration (OSD, ROM loading, input mapping)
- Testing and validation workflow
- Submitting a pull request to the Papilio-Retrocade GitHub org

The guide will use A2600Nano and C64Nano as worked examples.
:::

---

## Quick Reference: Retrocade Constraints

The Retrocade's pin assignments (CST file) are available at:  
[github.com/Papilio-Retrocade/papilio_retrocade_hardware](https://github.com/Papilio-Retrocade)

---

## Get Involved

Have a core you'd like to see on the Retrocade?  
Start a discussion at [community.papilioworks.com](https://community.papilioworks.com) in the **Core Development** category.

---

## 🎓 Want to Go Deeper?

The Retro Game Core Development course walks through a complete core port step by step, using AI at every stage — from reading the original RTL to debugging timing on the Gowin toolchain.

**[Retro Game Core Development on Papilio Retrocade →](https://learn.papilioworks.com)**
