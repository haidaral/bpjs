# bpjs-simulator-builder

Portable skill pack for Codex/Claude-style agents to build and improve this app.

## Use when

- Implementing new payroll simulation features
- Fixing UI/logic bugs from screenshots/user reports
- Hardening dark mode/mobile behavior
- Preparing release/deployment

## Workflow

### 1) Intake
- Confirm requested behavior and current policy assumptions.
- Identify if change touches: UI, formula, API, or deploy.

### 2) Implement
- Prefer minimal diff.
- Keep formula code deterministic.
- Keep month mapping canonical (`0..11`).

### 3) Validate
- Run:
  - `node --check script.js`
  - `npm run test:formula`
- Manual checks:
  - dark mode readability
  - mobile tap/overflow behavior
  - share-link load/copy

### 4) Release
- Update `CHANGELOG.md` and README if behavior changed.
- Deploy via Cloudflare Pages runbook in `docs/DEPLOYMENT.md`.

## Guardrails

- Do not commit secrets.
- Do not deploy from project root when cache dirs are present.
- Keep scratch files out of git (`*_live.*`, `payload.json`).
