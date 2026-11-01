import pathlib, sys
# python3 build.py              -> ../index.html (the app buyers get)
# python3 build.py --preview F  -> F, plus file saving inside the Claude preview
# python3 build.py --test F     -> F, plus the preview code and a hook for the computer tests
d = pathlib.Path(__file__).parent
mode = sys.argv[1] if len(sys.argv) > 1 else ""
shell = (d / "shell.html").read_text()
css = (d / "app.css").read_text()
# Apple pass, shared with the other mini apps (owned by the Budget thread). Search parent folders for
# design/apple-pass.css, since the app folder sits at a different depth in the repo and the shared folder.
design = next(p / "design" / "apple-pass.css" for p in d.resolve().parents if (p / "design" / "apple-pass.css").exists())
layer = design.read_text()
part1 = layer.split("/* ---------- PART 1: tokens ---------- */")[1].split("/* ---------- PART 2")[0].strip()
part2 = "/* ---------- PART 2" + layer.split("/* ---------- PART 2")[1]
assert "/*APPLE-PART1*/" in css
css = css.replace("/*APPLE-PART1*/", part1) + "\n" + part2 + "\n" + (d / "app-apple.css").read_text()
js = "".join((d / f).read_text() for f in ["1-core.js", "1b-sample.js", "2-render.js", "3-forms.js", "4-data.js", "5-ask.js", "7-tools.js", "6-app.js"])
extra = ""
if mode in ("--preview", "--test"): extra += (d / "preview-only.js").read_text()
if mode == "--test": extra += (d / "test-hook.js").read_text()
assert "/*TESTHOOK*/" in js
js = js.replace("/*TESTHOOK*/", extra)
# content security policy: only in the shipped app (the Claude preview loads its own helper code)
CSP = ("default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline'; "
       "img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://keys.cyberhubsoftware.com; worker-src 'self'; "
       "manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'")
assert "<!--CSP-->" in shell
shell = shell.replace("<!--CSP-->", "" if mode else f'<meta http-equiv="Content-Security-Policy" content="{CSP}">')
out = shell.replace("/*CSS*/", css).replace("/*JS*/", js)
dest = pathlib.Path(sys.argv[2]) if mode else d.parent / "index.html"
dest.write_text(out)
print(dest.name, len(out), "bytes")
# the offline copy's name comes from the shipped files, so any change to the page, lib, icons or manifest
# makes phones fetch fresh copies (sw.js deletes the old ones when it takes over)
if not mode:
    import hashlib, re
    app = d.parent
    h = hashlib.sha256(out.encode())
    for f in sorted([app / "manifest.webmanifest", *(app / "lib").glob("*.js"), *(app / "icons").glob("*.png")]):
        h.update(f.name.encode()); h.update(f.read_bytes())
    sw = (app / "sw.js").read_text()
    assert re.search(r'const CACHE = "smallbiz-[^"]*";', sw)
    (app / "sw.js").write_text(re.sub(r'const CACHE = "smallbiz-[^"]*";', f'const CACHE = "smallbiz-{h.hexdigest()[:10]}";', sw))
