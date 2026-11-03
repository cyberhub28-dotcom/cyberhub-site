# iPhone design rules (from Paycheck Budget)

Budget is the model app. These are the rules it follows, so Credentials, Wedding Planner and Small Business can be brought to the same standard one at a time. Each app keeps its own copy of the styles; nothing here changes another app by itself.

## 1. Windows are frosted glass cards (sheets)
Every tap that opens something (a form, a picker, a question, a "restore this backup?") opens a sheet. There are no centered pop-up windows on any screen size.

- One function opens all of them (`openSheet` in Budget). Never build a one-off pop-up.
- The sheet rises from the bottom of the screen you are looking at, wherever you have scrolled. The page behind does not move and is not scrolled to the top.
- Look: floats 8 points in from the left, right and bottom edges (14 on the open foldable and iPad), 32 point corners on all four sides, at most 520 wide, frosted background (`--sheet-bg` at 80%, blur 30, saturate 1.8), a hairline edge and a soft shadow. Rows inside it are solid cards.
- Top of the sheet: a grabber, then a bar with a round Close (X) on the left, the title in the middle and a round check on the right to save. A long action ("Save Calendar File") is a full-width button at the bottom instead.
- Close it by: the X, tapping the dimmed page, pulling it down by its top, or Escape on a keyboard. Focus goes back to the button that opened it.
- Delete is a red row at the bottom and needs two taps ("Tap again to delete"), then a toast offers Undo.
- When one sheet opens another, the card stays up and its contents slide across instead of dropping and rising again.
- It never goes taller than the screen minus the top safe area; longer content scrolls inside the card, and that scroll never drags the page behind.
- Reduce Transparency: the card turns solid. Increase Contrast: a 1 point border.

## 2. Tap targets
- Every button, link, switch and row is at least 44 x 44 points to tap.
- When a control looks smaller (chips, segmented buttons, small round arrows), keep the look and add an invisible 44 x 44 tap area with `::after` (see the list of selectors near "tap area" in Budget's styles).
- Text fields are at least 44 tall.

## 3. Type
- Apple's text styles, in `rem`, so they follow the phone's text size setting (1rem is 17 points by default): Large Title 2rem (34), Title 1, Title 2, Title 3, Body 1rem (17), Callout, Subheadline, Footnote, Caption 1, Caption 2 (11, the smallest allowed). Tab bar labels are 10.
- Group headers in sentence case, not all caps.
- Money and numbers use tabular figures (`.num`) so columns line up.

## 4. Lists and cards
- Inset grouped lists: rounded cards (26 points) on the gray page background, rows at least 44 tall (46 in sheets), hairline separators that start 16 points in.
- A row that opens something ends with a gray chevron. A row that does something right away has no chevron.
- Destructive rows use red text, never a red background until the second tap.

## 5. Bars
- Top bar: app mark on the left, one glass button group (44 tall) on the right. The big page title fades out over the first few points of scrolling and the small bar title fades in, so the two never overlap.
- Tab bar: a floating glass capsule, 62 tall, 21 points from the sides and bottom, 4 tabs with icon and label.
- Glass is `--glass` with blur 20 to 24 and `--glass-edge`. Reduce Transparency makes every glass piece solid.

## 6. Color and dark mode
- Use Apple's system colors as variables (`--sys-green`, `--sys-red` and so on) with their dark-mode versions, never fixed hex values in components.
- Every screen is checked in light and dark, and Appearance can force either.
- Text meets contrast 4.5:1 (3:1 for large text).

## 7. Motion
- Springy ease `cubic-bezier(.32,.72,0,1)` for sheets and screen changes.
- Reduce Motion turns every animation and smooth scroll off.

## 8. Phone sizes and the foldable
- Phones are never changed by big-screen rules: those turn on only at 600 wide and 500 tall or more.
- At that size (open iPhone Duo, iPad) the page scrolls inside the body, not the whole window, so the top bar, tab bar and sheets stay pinned. Scripts read and set scroll with `getY()` and `scrollToY()`.
- 860 wide and up: two columns where it helps.
- The page background (html, body, theme-color) matches the app background, because Safari fills the Duo side strip with it.
- Respect all four safe areas (notch, home bar, landscape sides).

## 9. Data
- Buyer data stays on the device. Every app has Backup and Restore, and a restore asks first in a sheet.

## Checklist for the next app
1. Route every pop-up through one sheet function and give it the glass card styles from section 1.
2. Run the tap check (nothing under 44 x 44 without an invisible tap area).
3. Check type sizes, sentence-case headers, contrast, light and dark.
4. Add the big-screen body scroller and test folded, open, sideways and a regular iPhone.
5. Open every window while scrolled to the bottom of every screen and check it lands at the bottom of the screen with the page unmoved.
6. Test Backup and Restore.
