# Architecture

## Runtime Modes

1. Local static mode
- Frontend runs formula engine in `script.js`.

2. Production API mode
- Host check enables `POST /api/calculate` on Cloudflare Pages.
- API failure triggers safe local fallback.

## Core Flow

1. Collect user inputs from form controls.
2. Validate required values.
3. Build current scenario package.
4. Optionally build comparison package.
5. Render cards/tables/chart with derived outputs.
6. Persist optional scenario history to localStorage.

## Modules in `script.js`

- Input formatting and controls
- Calculation engine (`hitungPaketKompensasi` + tax helpers)
- UI builders (`buildComparisonHtml`, `buildCashflowChartHtml`, etc.)
- State persistence and share-link serialization
- Theme application and dark mode synchronization

## Design notes

- Keep formula and UI separated in function design.
- Keep month indexing canonical (`0..11`).
- Use explicit fallback paths for API and parse failures.
