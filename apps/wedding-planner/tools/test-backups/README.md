# Test backups

Files here are broken on purpose. Use them to check that Restore stays safe.

- builtin-words.json: names like "constructor", "__proto__" and "toString" in every field,
  plus impossible dates and empty budget categories. Restoring it should open a normal plan
  (empty names fixed, bad dates cleared, the 12 default budget categories), every page
  should open, and nothing should crash.

How to try one: Menu, Restore from a file, pick the file.
Run this after any change to Restore or to how a saved plan is cleaned.

## Nearly full phone (no file needed)

A phone that's almost out of space can't keep a spare copy of a plan that won't open.
What should happen: the message "We couldn't open your saved plan" shows, saving pauses
(Menu says "Saving is paused until you do"), and the old plan stays saved until you tap
"Save my old plan as a file" or "Start fresh instead". Restoring a backup on a full phone
should say "We couldn't save the restored plan on this phone. Your earlier plan is unchanged."
These were checked on a computer by filling browser storage to its limit first.
