/* Claude preview builds only (build.py --preview): file saving inside the Claude app. Never in the shipped index.html. */
try { if (window.claude && claude.use) claude.use("downloads").then(n => { downloads = n; }, () => {}); } catch (e) {}
