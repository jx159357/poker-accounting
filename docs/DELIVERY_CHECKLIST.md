# Poker Accounting Delivery Checklist

## Core Flows
- Verify guest flow: enter app, create room, join room, record score, view history, open statistics.
- Verify registered flow: register, login, create room, invite players, end game, reopen history and statistics.
- Verify room sharing: share room, copy room code, save QR code image, scan QR code, manual room entry.
- Verify settings persistence: change theme and font size, refresh page, reopen app, confirm settings persist.

## Practical UX Checks
- Confirm first screen on `Home` is readable without scrolling on common mobile widths.
- Confirm `Statistics` defaults to summary-first and does not overwhelm on first open.
- Confirm all popups and drawers have a clear close action and consistent button hierarchy.
- Confirm guest upgrade prompts explain value clearly and do not block normal browsing unexpectedly.

## Edge Cases
- Empty states: no rooms, no history, no statistics, no recent games to export.
- Permission states: denied camera access, insecure browser context, clipboard/share fallback.
- Room states: ended room, non-member opening room link, creator deleting room, guest reaching room limit.
- Form states: empty nickname, mismatched password, short password, empty room code, empty custom type.

## Visual Consistency
- Check `Home`, `History`, `Statistics`, `Profile`, `GameRoom` on narrow mobile width.
- Check overlay components: tools popup, history search, settings drawer, invite popup, scan popup, register prompt, settlement popup.
- Confirm primary actions use the green gradient style and secondary actions use the neutral outline style.
- Confirm no English status chips remain in user-facing overlays unless intentionally technical.

## Engineering Verification
- Run frontend build: `npm run build` in `D:\cursor_pro\poker-accounting\frontend`.
- Run backend build: `npm run build` in `D:\cursor_pro\poker-accounting\backend`.
- Run backend tests: `npm test` in `D:\cursor_pro\poker-accounting\backend`.
- If backend API changes, smoke test login, profile, room CRUD, score records, stats endpoints.

## Release Readiness
- Confirm production env values and database path are correct.
- Confirm static frontend output is served from `backend/public` as expected.
- Confirm first-run onboarding copy matches current product positioning.
- Confirm no placeholder copy, debug logs, or temporary UI labels remain.

## Nice-to-Have Manual Pass
- Test on one real phone browser and one desktop browser.
- Test theme switching under all four themes.
- Test long room names, long nicknames, and larger font scale.
- Test slow network or backend restart recovery during room polling.
