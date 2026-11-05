# Credentials Tracker

- `index.html`: the whole app. Rebuild it with `python3 src/build.py` after editing `src/`.
- `lib/`: the PDF tools (jsPDF 2.5.1, pdf-lib 1.17.1), copied unchanged from npm. Licenses in `lib/LICENSES.txt`. If a file is missing, the app loads the same version from cdnjs and checks its fingerprint.
- `sw.js` and `manifest.webmanifest`: let the Home Screen app open with no signal, with its own icon from `icons/`.
- When publishing to cyberhubsoftware.com, copy this whole folder, not just `index.html`.
- `src/test-hook.js` is for automated tests only. `python3 src/build.py --test FILE` writes a test copy with it. Buyers never get it.
- `src/preview-only.js` is for the Claude preview only (file saving inside the Claude app). `python3 src/build.py --preview FILE` writes the preview copy with it. The build stops if any of it reaches `index.html`.
- `build.py` also sets the offline cache name in `sw.js` from the PDF tools, icons and manifest. Commit `sw.js` when it changes.
- The manifest has no `start_url` on purpose, so the Home Screen icon keeps the unlock link (`#key=…`). Buyers should open the unlock link in Safari first, then Add to Home Screen, then open the app from the new icon.
- If saved data can't be opened, the app keeps the original under `cyberhub-credentials-v1-unreadable`, opens the example, and offers "Save it as a file" on Home and in Menu.
- `test/`: checks that saved data and backups with odd values are cleaned safely. Run `node --test test/*.test.mjs` from this folder before each release.

## Big screens (open foldable iPhone, iPad)
- Phones never change: the big-screen layout only turns on when the screen is at least 600 wide and 500 tall, which no phone is, upright or sideways. A sideways phone keeps its own look from the 780-wide rules.
- 600 wide and up: the page scrolls inside the app (`document.body` is the scroller), so the tab bar and top bar stay put on the open iPhone Duo, upright and sideways. Scripts read and set the scroll with `getY()` and `scrollToY()` from `1-core.js`, never `window.scrollY` directly. The background is one plain color, so the Duo's side strip matches it. The tab bar is a centered capsule with a soft fade under it, and Menu, the card stack, the Calendar switch and To-do and Notes sit in the middle of the screen.
- 860 wide and up (the open foldable held sideways, iPad): Home splits into two columns (next deadline, Quick add and the tiles on the left; each profession's sections, in its own order, on the right). Credentials shows the cards with Documents beside them. Calendar shows the month and the chosen day on the left and Coming up on the right.
- On every screen, the big title and the line under it only fade once they slide under the top bar. The bar title takes over once the big title is gone, and the small line under it only shows once the page's own line is gone, so the date never shows twice.
- Held sideways on the open Duo (and iPad), the tab bar becomes a Liquid Glass icon rail down the right side, with the current tab highlighted. Pages keep their layout and only leave room on the right. Regular iPhones held sideways keep the bottom bar.
- Folding or unfolding keeps your place on the page, even though a different part of the page does the scrolling.
- Inside the Claude preview frame on a touch screen 600 wide or more, the tab bar, windows and messages sit 48 points higher, because the frame can run past the bottom of what's shown. Safari and the Home Screen never get this (`html.framed`).
- iPhone Duo side strip: Safari 27.1 doesn't let web pages draw behind the side column of controls (time, battery) on the outer display; it fills that strip with the page's background color (https://webkit.org/blog/18486/webkit-features-for-safari-27-1/). So the page's own background and the theme-color tags are kept equal to the app's background, also when Appearance is set to Light or Dark by hand.

## Windows (sheets)
Follows `apps/budget/DESIGN-RULES.md`.
- Every tap that opens a window uses `openSheet()` in `3-forms.js`. It is a frosted glass card that rises from the bottom of the screen you're on, wherever you've scrolled, and the page behind doesn't move. No centered pop-ups on any screen size.
- The card floats 8 points in from the edges (14 on big screens), has 32 point corners, is at most 520 wide and never taller than the screen.
- Close it with the X, by tapping outside it, by pulling it down, or with Escape. Focus goes back to what opened it.
- Reduce Transparency makes the card solid. Increase Contrast adds a 1 point edge.
- Headers and buttons are in sentence case, like Budget. Text meets 4.5:1 contrast in light and dark. Every tap target is at least 44 points.
