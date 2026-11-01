/* Claude preview only: never part of the shipped index.html. build.py adds this with --preview. */
try { if (window.claude && claude.use) claude.use("downloads").then(n => { downloads = n; }, () => {}); } catch (e) {}
PREVIEW_ICS_NOTE = `<p class="muted" style="margin:0 0 10px">Inside the Claude app this file can't be saved. Use the app from your Home Screen in Safari for this one.</p>`;
