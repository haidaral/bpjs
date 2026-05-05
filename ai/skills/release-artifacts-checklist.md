# Release Artifacts Checklist

Use this before every production push.

## Code quality

- [ ] `node --check script.js` passes
- [ ] `npm run test:formula` passes
- [ ] No accidental debug code

## UX quality

- [ ] Light mode readable
- [ ] Dark mode readable (cards/table/alerts)
- [ ] Mobile action buttons easy to tap
- [ ] Chart/table overflow handled

## Policy consistency

- [ ] TER/THR/prorata behavior unchanged or intentionally updated
- [ ] THR month mapping still `0..11`

## Docs and release

- [ ] `CHANGELOG.md` updated
- [ ] `README.md` updated if user-facing behavior changed
- [ ] Deployment notes accurate
