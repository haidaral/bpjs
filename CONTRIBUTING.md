# Contributing Guide

Thanks for contributing to BPJS Payroll Simulator.

## Branching

- Main branch: `main`
- Feature branch naming:
  - `feat/<short-name>`
  - `fix/<short-name>`
  - `docs/<short-name>`

## Commit Style

Use clear imperative messages, for example:
- `feat: add share-link scenario loader`
- `fix: correct THR month index mapping`
- `docs: expand deployment runbook`

## Local Validation (required)

Run before opening PR:

```powershell
node --check script.js
npm run test:formula
```

## PR Checklist

- [ ] Scope is focused and minimal
- [ ] Formula logic verified against existing invariants
- [ ] Dark mode checked for readability
- [ ] Mobile checked for tap targets and overflow
- [ ] Release notes/changelog updated when behavior changes

## Coding Notes

- Keep calculation logic deterministic.
- Avoid mixing UI formatting and core formula behavior in the same patch when possible.
- Preserve month indexing consistency (Jan..Dec = `0..11`).

## Security / Safety

- Do not commit secrets or tokens.
- Keep `.env` local-only.
- Sanitize user-rendered text paths where needed (history/share labels).
