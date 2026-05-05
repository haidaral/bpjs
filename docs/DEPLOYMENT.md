# Deployment Runbook

## Cloudflare Pages (primary)

### Prepare publish folder

```powershell
Copy-Item -LiteralPath index.html,styles.css,script.js -Destination publish -Force
Copy-Item -LiteralPath functions\api\health.js,functions\api\calculate.js -Destination publish\functions\api -Force
```

### Deploy production

```powershell
npx wrangler pages deploy publish --project-name bpjs-payroll-simulator --branch main
```

### Verify

- Open production URL and hard refresh.
- Check `/api/health` returns OK JSON.
- Run one sample calculation to confirm API mode banner.

## Netlify / Vercel fallback

- Deploy static root when needed.
- Keep function-specific behavior documented when not available.
