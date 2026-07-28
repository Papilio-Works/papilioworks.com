---
id: api-and-automation
title: API & Automation
sidebar_label: API & Automation
sidebar_position: 5
---

# API & Automation

Everything the web interface does is also available programmatically. The same server exposes a REST API for scripts and an MCP server for AI assistants.

---

## REST API

Interactive API documentation (Swagger UI) is served at:

```
http://localhost:8000/docs
```

From there you can browse every endpoint, see request/response schemas, and try calls directly in the browser. Typical automation examples:

```bash
# List available serial ports
curl http://localhost:8000/ports

# Flash ESP32 firmware over USB (auto-detect port)
curl -X POST http://localhost:8000/flash/esp32 \
  -F "file=@firmware.bin" \
  -F "port=AUTO"
```

:::note
If you've set a `PAPILIO_API_KEY`, include it as a header: `-H "X-API-Key: your_key"`.
:::

---

## MCP Server (AI Assistants)

The loader is also a [Model Context Protocol](https://modelcontextprotocol.io) server, so AI assistants like Claude or GitHub Copilot can flash your hardware for you. Connect via SSE at:

```
http://localhost:8000/sse
```

Available tools:

| MCP Tool | Purpose |
|---|---|
| `list_serial_ports` | Enumerate connected USB serial devices |
| `get_device_info` | Query chip type, MAC address, flash size |
| `flash_device` | Flash FPGA or ESP32 over USB/serial |
| `discover_ota_devices` | Scan the network for OTA-capable devices |
| `check_device_ip` | Verify a specific IP responds to OTA |
| `flash_device_ota` | Flash FPGA or ESP32 over WiFi |
| `get_flash_status` | Check progress of an in-flight flash |

With this connected, you can literally say *"flash the latest A2600 core to my Retrocade at 10.0.4.35"* and let the assistant do it.

---

## Configuration

The server is configured entirely through environment variables (prefix `PAPILIO_`):

| Variable | Default | Purpose |
|---|---|---|
| `PAPILIO_BIND_ADDRESS` | `0.0.0.0` | Interface to listen on |
| `PAPILIO_PORT` | `8000` | Server port |
| `PAPILIO_REQUIRE_WEB_AUTH` | `false` | Require login for the web UI |
| `PAPILIO_WEB_USERNAME` | `admin` | Web login username |
| `PAPILIO_WEB_PASSWORD` | `admin` | Web login password |
| `PAPILIO_SESSION_SECRET_KEY` | auto | Session cookie signing key |
| `PAPILIO_API_KEY` | unset | Optional key required for REST calls |
| `PAPILIO_MAX_UPLOAD_SIZE` | 50 MB | Maximum firmware upload size |

Example — run on port 9000 with auth enabled:

```bash
# Windows (PowerShell)
$env:PAPILIO_PORT = "9000"
$env:PAPILIO_REQUIRE_WEB_AUTH = "true"
$env:PAPILIO_WEB_PASSWORD = "a_strong_password"
python -m papilio_loader_mcp.api

# Mac/Linux
PAPILIO_PORT=9000 PAPILIO_REQUIRE_WEB_AUTH=true \
PAPILIO_WEB_PASSWORD=a_strong_password \
python -m papilio_loader_mcp.api
```

---

## Network Access & Security

Because the server binds to `0.0.0.0` by default, other machines on your network can reach it at `http://YOUR_PC_IP:8000/web/upload` — useful for flashing from a laptop or tablet.

If you allow network access:

:::warning
1. **Enable web authentication** (`PAPILIO_REQUIRE_WEB_AUTH=true`) and change the default `admin`/`admin` credentials
2. **Set an API key** (`PAPILIO_API_KEY`) so the REST endpoints aren't open
3. **Never expose the loader to the internet** — it's designed for trusted local networks only
:::

For a strictly local setup, bind to loopback instead: `PAPILIO_BIND_ADDRESS=127.0.0.1`.

---

## Next Step

Something not working?

**[Troubleshooting →](./troubleshooting)**

---

## 🎓 Want to Go Deeper?

AI-driven hardware workflows are the heart of the Papilio approach. The FPGA Fundamentals course shows you how to put an AI assistant in the loop for building, flashing, and debugging.

**[FPGA Fundamentals: AI as Your Co-Developer →](https://learn.papilioworks.com)**
