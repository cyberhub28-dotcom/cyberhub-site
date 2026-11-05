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

## Windows (sheets)
- Every window in the app comes from one function, `openSheet` (src/3-forms.js). Each one is a frosted glass card that rises from the bottom of the screen you are looking at, 8 points in from the edges (14 on the open foldable and iPad), with all four corners rounded. There are no centered pop-up windows, on any screen size.
- The page behind never moves: opening or closing a window keeps your place.
- It follows Budget's iPhone design rules (apps/budget/DESIGN-RULES.md): 44 x 44 tap areas, readable gray, green and orange text in light mode, Reduce Transparency makes the card solid, Increase Contrast adds a border.

## Big screens (open foldable iPhone, iPad)
- Phones never change: the big-screen layout only turns on when the screen is at least 600 wide and 500 tall, which no phone is, upright or sideways.
- 600 wide and up: the page scrolls inside the app (the body is the scroller) instead of the whole screen moving, because on the open iPhone Duo the whole-screen scroll let the tab bar and top bar slide away with the page. Scripts read and set the scroll through getY() and scrollToY() (src/1-core.js), which pick the right scroller. The tab bar is a centered capsule with a soft fade under it, the Home money card shows its number and what's next side by side, and Clients, Money, Calendar, Tools and Menu sit in a centered column. Lists stay one column until 860 wide.
- 860 wide and up (the open foldable held sideways, iPad): Home splits into two columns. The money card and Needs You Today are on the left; quick add, This Week and Tools are on the right. The sections under them (owed, next, profit and so on) deal into the two columns in the business type's order, first left, second right. A small script does this and puts them back in one column when the screen gets narrow again.
- On every screen, the big title fades out over the first few points of scrolling and the bar title takes over, so it never slides under the app name. The gray line under the title hands over to the small line under the bar title in one quick step, so the two never show at once.
- iPhone Duo side strip: Safari 27.1 doesn't let web pages draw behind the side column of controls on the outer display; it fills that strip with the page's background color (WebKit's Safari 27.1 notes). So on big screens the page uses one plain background (no tint at the top), and the page background (html and body) and the theme-color tags are kept equal to the app's background in light, dark and a hand-picked Appearance.
- iPhone Duo sizes (Safari 27.1): open upright about 669 x 870, open sideways about 951 x 585; folded it is a phone. Folding resizes the page without a reload, so all of this is CSS that follows the size. Inside the claude.ai preview frame on a touch screen, the frame can run a little past what Safari shows, so the app adds a "framed" class only there and lifts the tab bar, toasts and the bottom of windows clear of it. Safari and the Home Screen never get it.
- Held sideways on a wide screen (900 wide, 500 tall, landscape: the open iPhone Duo, iPad) the app gets a "rail" class (railQ in src/1-core.js). The tab bar becomes a glass column of icons down the right side, the current tab in a tinted circle, and Menu and Add sit in a matching glass column at the top right, like the iPhone's own apps. Only the bar moves; page layouts stay the same. The body keeps 80 points clear on the right so nothing sits under the column. Regular iPhones held sideways are under 500 tall and keep the bottom bar. In the claude.ai frame (about 951 x 440 on the open Duo) 380 tall is enough, and on a touch screen the icons sit just under Menu and Add so the frame can't cut them off.
