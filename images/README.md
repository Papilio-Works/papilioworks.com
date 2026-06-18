# Product Photos

Drop the following files into this folder. The site uses them directly — no build step needed.

## Required Files

| Filename | Description | Recommended Size |
|---|---|---|
| `hero.jpg` | Hero shot — board alone on clean background | 1200×800 min |
| `assembled.jpg` | Full system assembled — all 3 boards together | 1200×800 min |
| `gaming.jpg` | HDMI connected to monitor showing a retro game | 1200×675 min |
| `pcb-detail.jpg` | Close-up PCB detail shot | 1200×800 min |

## Export from Google Photos

1. Open Google Photos, select the photo
2. Click the three-dot menu → **Download**
3. Rename to match the filename above
4. Drop into this folder
5. Commit and push — GitHub Actions deploys to papilioworks.com automatically

## Tips

- Export at full resolution; HostGator serves them statically
- JPEG at 85% quality is a good balance of size vs quality
- All 4 photos together should be under ~8 MB total for fast page loads
