# Policy Rules Reference

This document summarizes how current simulator logic models policy.

## PPh21 Mode

### TER Mode (default recommendation)
- Monthly tax estimated from TER table by category (A/B/C).
- Category derived from PTKP status.
- THR month uses gross + THR in that specific month.

### Progressive fallback mode
- Annualized gross minus PTKP.
- Progressive slabs applied yearly, then averaged monthly.

## THR Rules in Simulator

- THR optional toggle.
- THR prorata supported via `monthsWorked / 12`.
- Under TER flow, THR impacts only THR month tax calculation, not every month.

## BPJS Components

- BPJS Kesehatan employee percent with dependent threshold behavior.
- JHT + JP employee and employer contributions.
- JP ceiling applied in formula.

## Scope Limit

- Educational simulator only; not official payroll filing engine.
- Final-period reconciliation and edge-case legal interpretation are outside strict scope.
