# AGENTS.md

This repository is optimized for AI coding agents (Codex, Claude, and similar) to build and maintain payroll simulation artifacts safely.

## Mission

Build decision-support payroll artifacts that are:
- Policy-transparent
- Calculation-stable
- Mobile-usable
- Release-ready

## Source of truth

- UI shell: `index.html`
- Styling/theme/mobile: `styles.css`
- Formula + orchestration: `script.js`
- API mode: `functions/api/calculate.js`, `functions/api/health.js`
- Formula checks: `tests/formula.spec.js`

## Required QA gate before commit

1. `node --check script.js`
2. `npm run test:formula`
3. Verify dark mode readability on result cards/tables
4. Verify THR month indexing (Jan..Dec = 0..11)
5. Verify share-link roundtrip (`?s=`)

## Deployment path

Use Cloudflare Pages publish folder flow:

```powershell
Copy-Item -LiteralPath index.html,styles.css,script.js -Destination publish -Force
Copy-Item -LiteralPath functions\api\health.js,functions\api\calculate.js -Destination publish\functions\api -Force
npx wrangler pages deploy publish --project-name bpjs-payroll-simulator --branch main
```

## Skills in this repo

- `ai/skills/bpjs-simulator-builder/SKILL.md`
- `ai/skills/release-artifacts-checklist.md`

Agents should load these first for feature work, bug fixes, and release tasks.
