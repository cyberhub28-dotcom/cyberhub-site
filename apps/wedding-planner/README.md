# Wedding Command Center

The app is `index.html`, built from `src/` with `python3 src/build.py`.

## Publishing it

Copy the whole folder, not just `index.html`. The app needs these files beside it:

- `lib/pdf-lib.min.js` and `lib/LICENSES.txt`: the PDF maker, so PDFs work offline (falls back to cdnjs with a fixed hash if the copy is missing)
- `sw.js`: lets the app open offline from the Home Screen. Never keeps key server answers.
- `manifest.webmanifest` and the `icon-*.png` files: Home Screen name and icon

The manifest has no `start_url` on purpose. The buyer's link ends in `#key=...`, and leaving `start_url` out keeps the page's own address, key included, when it's added to the Home Screen.

## Credits

Bodoni Moda font (SIL Open Font License 1.1, full text in the app under Menu > Credits and licenses). pdf-lib (MIT, see `lib/LICENSES.txt`). The app icon is drawn in code by `tools/make_icon.py` (no outside art). Run `python3 tools/make_icon.py` from this folder to remake the PNGs; it prints the data URL used in `src/shell.html`.
