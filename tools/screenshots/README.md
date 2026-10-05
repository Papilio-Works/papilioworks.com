# Loader documentation screenshots

The current screenshots use Playwright to drive Electron with the **real built
v0.4.8 renderer and preload**, plus isolated screenshot-only IPC responses.
Example file metadata and log lines are illustrative and labeled accordingly.
No USB device, UDP socket, MCP server, real user library, or WiFi credentials
are accessed. The web screenshot comes from the live hosted loader.

Build the web and desktop workspaces in `papilio-loader-mcp` first, including
its setup firmware. Then run from this directory:

```powershell
npm ci
npm run capture:loader
```

An optional first argument to `capture-loader-screenshots.mjs` selects another
loader checkout. Output is written to
`docs-src\static\img\papilio-loader`. Review images before publishing.
The script requires Electron from that checkout; it does not download a
separate browser.

`capture_loader_screenshots.py` is the legacy Python-server capture tool.
Do not use it to regenerate screenshots for the current Electron/web guides.
