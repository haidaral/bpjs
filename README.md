# BPJS Payroll Simulator (v2)

A static web app to simulate Indonesian payroll take-home outcomes with:
- BPJS Kesehatan + Ketenagakerjaan contributions
- Optional PPh21 (TER / progressive estimate)
- THR and THR-prorata handling
- Current vs new-offer comparison
- Annual take-home and monthly cashflow timeline
- Scenario save/load, CSV export, print/PDF
- Accent theme + dark mode

## Project Files

- `index.html` - app layout and UI controls
- `styles.css` - theme + responsive styling
- `script.js` - calculator logic, scenario state, rendering
- `netlify.toml` - Netlify static deployment config
- `vercel.json` - Vercel static deployment config
- `.replit` - Replit run config

## Run Locally

Using Python:

```powershell
python -m http.server 4173
```

Open:
- `http://127.0.0.1:4173`

## Deploy

### Netlify

1. Create a new site from this folder/repo.
2. Build command: *(empty)*
3. Publish directory: `.`

`netlify.toml` already includes SPA fallback + security headers.

### Vercel

1. Import project.
2. Framework: `Other`
3. Build command: *(empty)*
4. Output directory: `.`

`vercel.json` already routes all paths to `index.html`.

### Replit

1. Import files into a Replit static project.
2. Run button uses `.replit` command.

## Notes

- This simulator is educational, not legal/tax advice.
- Tax regulations can change; verify with official DJP updates.
- For payroll-grade accuracy, add final-period reconciliation logic and complete TER policy branches.
