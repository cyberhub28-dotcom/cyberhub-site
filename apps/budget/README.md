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
