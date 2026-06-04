# papilioworks.com

Static website for papilioworks.com. Deployed via GitHub Actions SFTP to HostGator on every push to main.

## Structure

```
├── index.html              ← Main landing page
├── css/style.css           ← All styles
├── js/main.js              ← JavaScript
├── images/                 ← Product photos
└── .github/workflows/
    └── deploy.yml          ← GitHub Actions SFTP deployment
```

## Deployment

Every push to `main` auto-deploys to papilioworks.com via SFTP.

### Required GitHub Secrets
Set in repo Settings → Secrets → Actions:
- `FTP_HOST` — HostGator server hostname
- `FTP_USER` — HostGator FTP username
- `FTP_PASS` — HostGator FTP password
- `FTP_PATH` — Remote path (e.g. `/public_html/`)

## Local Development

Open `index.html` directly in a browser — no build step needed.
