# Paycheck Budget

- `index.html` is the whole app. Edit it directly (no build step yet).
- `sw.js` and `manifest.webmanifest` let it open offline from the Home Screen. The offline helper only saves and serves Budget's own files (listed in `sw.js`); any other page under this folder is left alone. Keep shop or buy pages out of this folder anyway.
- `lib/` holds the PDF tool (jsPDF 2.5.1, MIT, see `lib/NOTICE.txt`). The app loads it from here first and from cdnjs (hash-checked) as a backup.
- `icons/` holds the Home Screen icons.
- `make-preview.py` makes the Claude preview copy (adds the preview's file-saving helper, drops the security tag). Never ship its output.
- `sw.js` has a `VERSION`: change it whenever a file in `lib/` or `icons/` changes.
- If saved data can't be opened, the app keeps it aside (never overwritten), opens the example, and offers Save a Copy and Get Help.
- `src/app.css` is a copy of the app's main style block, for reading (refresh it when the styles change). The other `src/` files are older notes.
- `DESIGN-RULES.md` lists the iPhone design rules Budget follows (glass sheets, tap sizes, type, lists, bars, dark mode, foldable), so the other apps can be brought to the same standard.

## Windows (sheets)
- Every window in the app comes from one function, `openSheet`. Each one is a frosted glass card that rises from the bottom of the screen you are looking at, 8 points in from the edges, with all four corners rounded. There are no centered pop-up windows, on any screen size.
- The page behind never moves: opening or closing a window keeps your place.

When publishing to cyberhubsoftware.com, copy this whole folder, not just `index.html`.

## Big screens (open foldable iPhone, iPad)
- Phones never change: the big-screen layout only turns on when the screen is at least 600 wide and 500 tall, which no phone is, upright or sideways.
- 600 wide and up: the page scrolls inside the app (the body is the scroller) instead of the whole screen moving, because on the open iPhone Duo the whole-screen scroll let the tab bar and top bar slide away with the page. The tab bar is a centered capsule with a soft fade under it, and Left to Spend shows its number and payday facts side by side. Lists stay one column until 860 wide. Scripts read and set the scroll through getY() and scrollToY(), which pick the right scroller.
- Inside a preview frame (the Claude preview), a small script adds a `framed` class to the page. On the open foldable only, that lifts the tab bar, cards and toast 48 points, because the frame can run past what Safari shows. Safari and the Home Screen never get it.
- Sideways on the open foldable or iPad (900 wide and up, wider than tall, 500 tall, or 400 inside a preview frame): the tab bar becomes a Liquid Glass column of icons on the right, and the … and + buttons become a glass pill above it, like a native iOS app. The page layouts don't change; they only leave room for the column. A regular iPhone held sideways keeps the bottom tab bar. This is checked again on every resize, so folding and unfolding switches it.
- 860 wide and up (the open foldable held sideways, iPad): Home splits into two columns. Goals and Debts moves to the left column there (a small script does this), and goes back to its usual place when the screen gets narrow again.
- On every screen, the big title fades out over the first few points of scrolling and the bar title takes over, so it never slides under the app name. The dates hand over to the small line under the bar title in one quick step, so the two never show at once.
- iPhone Duo side strip: Safari 27.1 doesn't let web pages draw behind the side column of controls (time, battery) on the outer display; it fills that strip with the page's background color (WebKit's Safari 27.1 notes). So on big screens the page uses one plain background (no tint at the top), and the page's own background (html and body) and the theme-color tags are kept equal to the app's background, also when Appearance is set to Light or Dark by hand. Native apps can draw there; web apps can't yet.
