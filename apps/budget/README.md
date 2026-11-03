# Paycheck Budget

- `index.html` is the whole app. Edit it directly (no build step yet).
- `sw.js` and `manifest.webmanifest` let it open offline from the Home Screen. The offline helper only saves and serves Budget's own files (listed in `sw.js`); any other page under this folder is left alone. Keep shop or buy pages out of this folder anyway.
- `lib/` holds the PDF tool (jsPDF 2.5.1, MIT, see `lib/NOTICE.txt`). The app loads it from here first and from cdnjs (hash-checked) as a backup.
- `icons/` holds the Home Screen icons.
- `make-preview.py` makes the Claude preview copy (adds the preview's file-saving helper, drops the security tag). Never ship its output.
- `sw.js` has a `VERSION`: change it whenever a file in `lib/` or `icons/` changes.
- If saved data can't be opened, the app keeps it aside (never overwritten), opens the example, and offers Save a Copy and Get Help.
- `src/app.css` is a copy of the app's main style block, for reading. The other `src/` files are older notes.

When publishing to cyberhubsoftware.com, copy this whole folder, not just `index.html`.

## Big screens (open foldable iPhone, iPad)
- Phones never change: the big-screen layout only turns on when the screen is at least 600 wide and 500 tall, which no phone is, upright or sideways.
- 600 wide and up: the tab bar is a centered capsule with a soft fade under it, Left to Spend shows its number and payday facts side by side, and lists sit in two columns.
- 860 wide and up (the open foldable held sideways, iPad): Home splits into two columns. Goals and Debts moves to the left column there (a small script does this), and goes back to its usual place when the screen gets narrow again.
- On every screen, the big title and the dates only fade once they slide under the top bar, and the dates then show small under the bar title.
- iPhone Duo side strip: Safari 27.1 doesn't let web pages draw behind the side column of controls (time, battery) on the outer display; it fills that strip with the page's background color (WebKit's Safari 27.1 notes). So the page's own background (html and body) and the theme-color tags are kept equal to the app's background, also when Appearance is set to Light or Dark by hand. Native apps can draw there; web apps can't yet.
