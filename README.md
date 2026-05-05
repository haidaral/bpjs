# BPJS Payroll Simulator

A practical simulator for Indonesian payroll decision-making. It helps users estimate net salary, THR month outcomes, yearly take-home, and compare career move scenarios with transparent assumptions.

## Live Demo

- Production: https://bpjs-payroll-simulator.pages.dev

## Why This App Exists

Many salary calculators stop at gross-to-net with limited transparency. This app is designed for real decision support:

- Show deduction components clearly (BPJS + tax + custom deductions)
- Model THR month separately from normal months
- Handle THR prorata for employees under 12 months tenure
- Compare current package vs new offer with annual impact
- Keep calculations easy to share and discuss (CSV, print, share link)

## Core Features

1. BPJS contributions simulation
- BPJS Kesehatan employee portion
- JHT and JP employee/employer investment components
- Monthly deduction and investment breakdown

2. Tax simulation (optional)
- TER monthly method (PP 58/2023 style approximation)
- Progressive annual fallback method
- PTKP status selector

3. THR handling
- Optional THR inclusion
- Optional prorata THR
- THR month-specific tax effect (TER applied in THR month)

4. Offer comparison
- Same company raise / new company scenario
- Current vs new monthly net and annual take-home comparison
- Sensitivity range (+/-%) for new salary outcomes

5. Decision support extras
- Target Net Finder (reverse estimate gross needed)
- Offer score summary
- Scenario history (save/load/rename/delete)
- Shareable scenario link (`?s=` payload)

6. UX and accessibility improvements
- Dark mode + accent color chips
- Mobile touch-friendly action buttons
- Scroll-safe chart/table rendering on narrow screens

## Calculation Scope and Assumptions

This project is educational and decision-support oriented, not official tax advice.

- Tax policy references are approximated to common payroll usage.
- TER tables and PTKP mappings are embedded in `script.js`.
- Final-year payroll reconciliation logic is not fully implemented.

For exact payroll/legal compliance, validate outputs with your payroll/legal/tax team.

## Tech Stack

- HTML + Bootstrap 5
- Vanilla JavaScript (single-engine calculator)
- CSS custom theming
- Cloudflare Pages Functions for API mode (`/api/calculate`, `/api/health`)

## Project Structure

- `index.html` : UI shell, forms, release/policy cards
- `styles.css` : theme tokens, dark mode, responsive/mobile behavior
- `script.js` : formula engine, rendering, state/history/share-link logic
- `functions/api/calculate.js` : server-side calculation endpoint
- `functions/api/health.js` : health endpoint
- `tests/formula.spec.js` : formula invariant checks
- `docs/` : architecture, policy, deployment docs

## Quick Start (Local)

### Prerequisites
- Node.js 18+
- Optional: Python (for basic static serving)

### Run static mode

```powershell
python -m http.server 4173
```

Open:
- `http://127.0.0.1:4173`

### Formula checks

```powershell
npm run test:formula
node --check script.js
```

## Deployment

### Cloudflare Pages (recommended)

```powershell
Copy-Item -LiteralPath index.html,styles.css,script.js -Destination publish -Force
Copy-Item -LiteralPath functions\api\health.js,functions\api\calculate.js -Destination publish\functions\api -Force
npx wrangler pages deploy publish --project-name bpjs-payroll-simulator --branch main
```

### Netlify
- Build command: empty
- Publish directory: `.`

### Vercel
- Framework preset: Other
- Build command: empty
- Output directory: `.`

## Backend Mode

Production host (`bpjs-payroll-simulator.pages.dev`) automatically uses API mode:
- `POST /api/calculate`
- `GET /api/health`

If API is unavailable, app falls back to local engine.

## QA Checklist Before Release

1. `node --check script.js` passes
2. `npm run test:formula` passes
3. Dark mode readability OK (cards, table, alerts, assumptions)
4. THR month mapping is correct (Jan..Dec = 0..11)
5. Share-link roundtrip works
6. Mobile layout/tap targets verified

## Troubleshooting

### Push rejected (non-fast-forward)
- Remote has existing commits.
- Run rebase flow before push.

### Cloudflare deploy fails due to file size
- Deploy `publish/` only, not project root.
- Keep caches out of deployment path.

### Dark mode text unreadable
- Check both selectors:
  - `html[data-theme="dark"]`
  - `body.dark-mode`

## Roadmap (Backlog)

- Short-link service for shared scenarios
- Result card PNG export
- Annual tax reconciliation estimator
- Benefit monetization module

## Contributing

See `CONTRIBUTING.md` for coding, testing, and PR rules.

## License

MIT (see `LICENSE`).
