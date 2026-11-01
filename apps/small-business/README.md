# Small Business mini app

Everything a buyer gets is in this folder. When publishing (for example to cyberhubsoftware.com/apps/small-business/), copy the whole folder, not just index.html:

- index.html: the app (built from src/)
- sw.js and manifest.webmanifest: let it open with no signal from the Home Screen
- icons/: Home Screen icons
- lib/: the PDF and QR code tools, plus their MIT license notice (lib/LICENSES.txt)

Build from src/:

    python3 src/build.py                     # index.html for buyers
    python3 src/build.py --preview FILE      # Claude preview copy (adds file saving inside the Claude app, no security tag)
    python3 src/build.py --test FILE         # copy for the computer tests (adds a test hook)

Only the plain build is ever published. The preview and test copies must never ship.
