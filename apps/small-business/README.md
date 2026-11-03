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

## Big screens (open foldable iPhone, iPad)
- Phones never change: the big-screen layout only turns on when the screen is at least 600 wide and 500 tall, which no phone is, upright or sideways.
- 600 wide and up: the tab bar is a centered capsule with a soft fade under it, the Home money card shows its number and what's next side by side, the four Home tool shortcuts sit in one row, and Clients, Money, Calendar, Tools and Menu sit in a centered column.
- 860 wide and up (the open foldable held sideways, iPad): Home splits into two columns. The money card and Needs You Today are on the left; quick add, This Week and Tools are on the right. The sections under them (owed, next, profit and so on) deal into the two columns in the business type's order, first left, second right. A small script does this and puts them back in one column when the screen gets narrow again.
- On every screen, the big title and the gray line under it only fade once they slide under the top bar, and the gray line then shows small under the bar title.
- iPhone Duo side strip: Safari 27.1 doesn't let web pages draw behind the side column of controls on the outer display; it fills that strip with the page's background color (WebKit's Safari 27.1 notes). So the page background (html and body) and the theme-color tags are kept equal to the app's background in light, dark and a hand-picked Appearance.
