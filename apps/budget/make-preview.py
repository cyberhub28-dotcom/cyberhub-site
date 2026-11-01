"""Make the Claude preview copy of Paycheck Budget.

The shipped index.html has no Claude-only code. The preview inside the Claude app
needs its "downloads" helper to save files, and opens without the content security
policy tag (the preview frame loads its own helpers). Run:

    python3 make-preview.py OUTPUT.html

and publish OUTPUT.html as the preview. Never ship the output.
"""
import pathlib
import sys

here = pathlib.Path(__file__).resolve().parent
src = (here / "index.html").read_text(encoding="utf-8")

MARK = "/*@@preview-downloads@@*/"
if src.count(MARK) != 1:
    sys.exit("preview marker not found in index.html")
src = src.replace(MARK, 'try { if (window.claude && claude.use) claude.use("downloads").then(n => { downloads = n; }, () => {}); } catch (e) {}')

lines = src.split("\n")
lines = [l for l in lines if not l.startswith('<meta http-equiv="Content-Security-Policy"')]
src = "\n".join(lines)
src = src.replace("<title>Paycheck Budget</title>", '<title>Paycheck Budget</title>\n<meta name="claude:viewport-fit-sides" content="cover">', 1)

out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "preview.html")
out.write_text(src, encoding="utf-8")
print("preview written:", out)
