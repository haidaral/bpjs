# Cloudflare Deploy Notes

This project can run in two Cloudflare modes:

1. Cloudflare Pages (static hosting) - best for current app
2. Cloudflare Worker (edge API + optional static assets)

## A) Cloudflare Pages (recommended now)

From this folder:

```powershell
npm run cf:pages:deploy
```

Or in Cloudflare dashboard:
- Create Pages project
- Upload this directory
- Build command: (empty)
- Output directory: `.`

## B) Cloudflare Worker API (optional backend)

This repo includes:
- `src/index.js` with:
  - `GET /api/health`
  - `POST /api/calculate`

Deploy Worker:

```powershell
npm run cf:deploy
```

Local dev:

```powershell
npm run cf:dev
```

## Minimal body for `/api/calculate`

```json
{
  "gaji": 10000000,
  "anggotaKeluarga": 3,
  "includeThr": true,
  "prorataThr": false,
  "monthsWorked": 12
}
```

## Notes
- Static frontend continues to work without Worker.
- Worker endpoint is for progressive migration to server-side calculations.
