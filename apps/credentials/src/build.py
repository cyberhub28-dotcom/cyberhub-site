"""Puts the app together into index.html.
`python3 src/build.py --test FILE` also writes a copy with a test-only hook (never shipped).
`python3 src/build.py --preview FILE` also writes the Claude preview copy, with src/preview-only.js (never shipped)."""
import hashlib, pathlib, re, sys
d = pathlib.Path(__file__).parent
shell = (d / "shell.html").read_text()
css = (d / "app.css").read_text()
js = "".join((d / f).read_text() for f in ["1-core.js", "1b-packs.js", "2-render.js", "3-forms.js", "4-data.js", "5-ask.js", "6-app.js"])
assert js.count("/*PREVIEW*/") == 1
out = shell.replace("/*CSS*/", css).replace("/*JS*/", js.replace("/*PREVIEW*/", ""))
assert "claude.use" not in out and "Inside the Claude app" not in out
(d.parent / "index.html").write_text(out)
print(len(out), "bytes")
# the offline copy's name changes whenever a PDF tool, icon or the manifest changes, so phones pick up the new files
h = hashlib.sha256()
for f in sorted(list((d.parent / "lib").iterdir()) + list((d.parent / "icons").iterdir()) + [d.parent / "manifest.webmanifest"]):
    h.update(f.name.encode()); h.update(f.read_bytes())
sw = d.parent / "sw.js"
sw.write_text(re.sub(r'const CACHE = "credentials-[^"]*";', 'const CACHE = "credentials-' + h.hexdigest()[:10] + '";', sw.read_text(), count=1))
if "--test" in sys.argv:
    hook = (d / "test-hook.js").read_text()
    i = js.rstrip().rfind("})();")
    tjs = js[:i] + hook + js[i:]
    pathlib.Path(sys.argv[sys.argv.index("--test") + 1]).write_text(shell.replace("/*CSS*/", css).replace("/*JS*/", tjs.replace("/*PREVIEW*/", "")))
if "--preview" in sys.argv:
    pjs = js.replace("/*PREVIEW*/", (d / "preview-only.js").read_text())
    pathlib.Path(sys.argv[sys.argv.index("--preview") + 1]).write_text(shell.replace("/*CSS*/", css).replace("/*JS*/", pjs))
