# Test results

Tested locally on 2026-10-12, using Node.js and headless Microsoft Edge through Playwright.

- 3 automated core tests passed: due boundary, immutable answer updates, advancement/cap at box 5, wrong-answer reset, filters, backup roundtrip and invalid backup rejection.
- Browser integration passed: reveal/correct/wrong, save across reload, undo, Persian search/no results, card dialog, export, reset, import, invalid JSON rejection, offline reload after service-worker installation, legacy URL redirect, corrupt storage preservation, and zero uncaught page errors.
- At 390 × 844, no horizontal page overflow was detected; a full-page screenshot was inspected.
- JavaScript syntax check passed.

Reproduce core checks with `node --test core.test.js`.
For optional browser checks, install Playwright in a separate test environment, make it resolvable by Node, have Microsoft Edge installed, then run `node browser-test.cjs`. Port 8080 must be free. The script starts/stops its own server, uses isolated browser profiles, and writes a test backup and screenshot to the OS temporary directory. Playwright is not a runtime dependency of the app.

Not verified: live Vercel deployment, installation on a physical phone, Safari/Firefox behavior, native speech output or OS install prompt. The online repository was not changed. The original 850-word dataset was unavailable; the delivered app contains the one original card.
