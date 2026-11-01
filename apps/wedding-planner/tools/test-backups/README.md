# Test backups

Files here are broken on purpose. Use them to check that Restore stays safe.

- builtin-words.json: names like "constructor", "__proto__" and "toString" in every field,
  plus impossible dates and empty budget categories. Restoring it should open a normal plan
  (empty names fixed, bad dates cleared, the 12 default budget categories), every page
  should open, and nothing should crash.

How to try one: Menu, Restore from a file, pick the file.
Run this after any change to Restore or to how a saved plan is cleaned.
