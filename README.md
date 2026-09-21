# SuperTuxKart - Cloud Gaming Runner

High-performance cloud gaming runner workflow for **SuperTuxKart** (3D Kart Racing).

## Specifications
- **Virtual Display**: Xvfb (`1280x720 @ 60 FPS`) with Mesa `llvmpipe` 3D software acceleration
- **Streaming Protocol**: x11vnc + noVNC WebSockets
- **Public Tunnel**: Cloudflare Quick Tunnel (`https://*.trycloudflare.com`)
- **Auto-Restart**: 5-hour continuous workflow cycle with automated dispatch handoff
- **Input**: In-browser keyboard, mouse, and touch gamepad controls

## Manual Dispatch
You can trigger this workflow manually from GitHub Actions or it will execute on the scheduled cron trigger.
