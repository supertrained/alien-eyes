# Alien Eyes Design System

## Intent

Alien Eyes should feel like an external scan, not a generic SaaS dashboard. The interface needs to communicate three things immediately:

- this is an outside-in audit
- the tool can distinguish signal from noise
- the output is built to be acted on fast

## Core Tokens

Defined in [src/app/globals.css](/Volumes/tomme%204TB/Dropbox/00_tommeco/Supertrained/products/tool-tester/src/app/globals.css).

- Background: `#101418`
- Panel: translucent white over near-black
- Primary accent: electric violet `#7c3aed`
- Scan accent: acid green `#84cc16`
- Critical: `#ef4444`
- Warning: `#f59e0b`
- Pass: `#14b8a6`
- Body font: `IBM Plex Sans`, `Avenir Next`, `Segoe UI`, sans-serif
- Display font: `Space Grotesk`, `IBM Plex Sans`, sans-serif

## Severity Visual Weight

- `critical`: separate visual plane via stronger border and tinted background
- `high`: prominent badge treatment
- `medium`: standard finding card
- `low`: ambient finding card with lighter urgency
- `neutral`: metadata and structural UI labels

## Emotional Moments

1. Anticipation
- Progress page narrates the audit phases instead of showing a blank spinner.

2. The drop
- Results begin with celebration and score, then findings.

3. Empowerment
- Copy action is treated as the main completion event, not a secondary utility.

## Component Inventory

- `Button`
- `Card`
- `Badge`
- Landing page sections
- Progress timeline
- Score hero
- Celebration section
- Findings list
- Format selector
- Copy action

## Accessibility Notes

- Dark mode is default.
- Light mode toggle is present in the shell header.
- Layout includes a skip link.
- Color pairings should remain high-contrast against both theme backgrounds.
- Pages are responsive down to narrow mobile widths through single-column fallbacks.

## Current Gaps

- Re-audit, PDF export, and false-positive feedback are visible but still placeholder actions.
- Results-page interaction design should still get a Claude review before Gate 4 is treated as complete.
