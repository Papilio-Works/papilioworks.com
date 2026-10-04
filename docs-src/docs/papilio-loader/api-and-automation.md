---
id: api-and-automation
title: API & Automation
sidebar_label: API & Automation
sidebar_position: 5
---

# API & Automation

The Desktop App includes a built-in [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server, so AI assistants like Claude or GitHub Copilot can program your hardware for you.

---

## Connecting an AI Assistant

While the Desktop App is running, the MCP server listens on your own computer only:

```
http://127.0.0.1:3939/mcp
```

Add that address as an MCP server in your assistant. The Desktop App's system tray tooltip shows the same address.

Available tools:

| MCP Tool | Purpose |
|---|---|
| `list_serial_ports` | Enumerate connected USB serial devices |
| `get_device_info` | Query chip type, MAC address, flash size |
| `flash_device` | Program the FPGA or ESP32 over USB |
| `discover_ota_devices` | Scan the network for boards that can be programmed over WiFi |
| `check_device_ip` | Verify that a specific IP address responds |
| `flash_device_ota` | Program the FPGA or ESP32 over WiFi |
| `get_flash_status` | Check progress of a flash in progress |

With this connected, you can say *"flash the latest A2600 core to my Retrocade at 10.0.4.35"* and let the assistant do it.

:::note
The server only accepts connections from your own computer, so other machines on your network can't program your board through it.
:::

---

## Next Step

Something not working?

**[Troubleshooting →](./troubleshooting)**

---

## 🎓 Want to Go Deeper?

AI-driven hardware workflows are the heart of the Papilio approach. The FPGA Fundamentals course shows you how to put an AI assistant in the loop for building, flashing, and debugging.

**[FPGA Fundamentals: AI as Your Co-Developer →](https://learn.papilioworks.com)**
