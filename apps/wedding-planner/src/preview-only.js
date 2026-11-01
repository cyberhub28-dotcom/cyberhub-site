/* Claude preview builds only (build.py --preview): file saving inside the Claude app. Never in the shipped index.html. */
IS_PREVIEW = true;
hostDl = Promise.resolve().then(() => window.claude && typeof window.claude.use === 'function' ? window.claude.use('downloads') : null).catch(() => null);
