import hashlib, pathlib, re, sys
# python3 build.py              -> ../index.html (the app buyers get), and stamps sw.js's cache name
# python3 build.py --preview F  -> F, for the Claude preview: adds file saving inside the Claude app,
#                                  and leaves out the security tag and Home Screen manifest
d = pathlib.Path(__file__).parent
app = d.parent
preview = len(sys.argv) > 2 and sys.argv[1] == "--preview"
shell = (d / "shell.html").read_text()
css = (d / "app.css").read_text() + (d / "family.css").read_text() + (d / "apple.css").read_text()
fonts = (d / "fonts.css").read_text()
parts = ["1-core.js", "2-ui.js", "3-shell.js", "4-views.js", "5-more.js", "6-app.js"]
extra = sorted(p.name for p in d.glob("7*.js"))
js = "".join((d / f).read_text() for f in parts[:-1] + extra + parts[-1:])
assert js.count("/*PREVIEW*/") == 1
js = js.replace("/*PREVIEW*/", (d / "preview-only.js").read_text() if preview else "")
CSP = ("default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline'; "
       "img-src 'self' data: blob:; font-src 'self' data:; connect-src https://keys.cyberhubsoftware.com; worker-src 'self'; "
       "manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'")
assert "<!--CSP-->" in shell and "<!--MANIFEST-->" in shell
shell = shell.replace("<!--CSP-->\n", "" if preview else f'<meta http-equiv="Content-Security-Policy" content="{CSP}">\n')
shell = shell.replace("<!--MANIFEST-->\n", "" if preview else '<link rel="manifest" href="manifest.webmanifest">\n')
out = shell.replace("/*FONTS*/", fonts).replace("/*CSS*/", css).replace("/*JS*/", js)
if preview:
    dest = pathlib.Path(sys.argv[2])
else:
    dest = app / "index.html"
    # The offline cache name changes whenever the PDF maker, icons or manifest change, so phones pick up the new files.
    h = hashlib.sha256()
    for f in sorted([*(app / "lib").glob("*"), *app.glob("icon-*.png"), app / "manifest.webmanifest"]):
        h.update(f.name.encode()); h.update(f.read_bytes())
    sw = app / "sw.js"
    sw.write_text(re.sub(r"const CACHE = '[^']*';", f"const CACHE = 'wedding-cc-{h.hexdigest()[:10]}';", sw.read_text(), count=1))
dest.write_text(out)
print(dest.name, len(out), "bytes")
