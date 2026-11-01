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
