import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

const root = path.resolve(import.meta.dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function polyfill(window) {
  window.matchMedia = function () {
    return { matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} };
  };
  window.requestAnimationFrame = function (cb) { return setTimeout(function () { cb(Date.now()); }, 0); };
  window.cancelAnimationFrame = function (id) { clearTimeout(id); };
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
}

async function loadForm(htmlRel, opts) {
  const dom = new JSDOM(read(htmlRel), { url: 'http://localhost/', runScripts: 'outside-only' });
  const { window } = dom;
  polyfill(window);
  const calls = [];
  window.fetch = function (url, init) {
    calls.push({ url: String(url), body: JSON.parse(init.body) });
    return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ success: true }); } });
  };
  window.eval(read('assets/js/form-config.js'));
  if (opts && opts.accessKey != null) window.CYBERHUB_FORM.accessKey = opts.accessKey;
  window.eval(read('assets/js/site.js'));
  return { window, document: window.document, calls };
}

function fillRequired(document, fields) {
  document.querySelector('#rf-name').value = fields.name || 'Ada Lovelace';
  document.querySelector('#rf-biz').value = fields.business || 'Analytical Engines';
  document.querySelector('#rf-email').value = fields.email || 'ada@example.com';
}

function submit(document) {
  const form = document.querySelector('#review-form');
  const event = new document.defaultView.Event('submit', { bubbles: true, cancelable: true });
  form.dispatchEvent(event);
}

test('unticked consent is posted as the line OK to text: No', async () => {
  const { document, calls } = await loadForm('contact/index.html');
  const box = document.querySelector('#rf-sms');
  assert.equal(box.required, false);
  assert.equal(box.hasAttribute('required'), false);
  assert.equal(box.checked, false);
  fillRequired(document, {});
  submit(document);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].body['OK to text'], 'No');
  assert.equal(Object.hasOwn(calls[0].body, 'text_consent'), false);
  assert.equal(Object.hasOwn(calls[0].body, 'no_website'), false);
  assert.equal(Object.hasOwn(calls[0].body, 'goals'), false);
});

test('ticked consent is posted as the line OK to text: Yes', async () => {
  const { document, calls } = await loadForm('contact/index.html');
  const box = document.querySelector('#rf-sms');
  box.checked = true;
  fillRequired(document, {});
  document.querySelector('#rf-nosite').checked = true;
  document.querySelector('input[name=goals][value="More calls/bookings"]').checked = true;
  submit(document);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].body['OK to text'], 'Yes');
  assert.equal(Object.hasOwn(calls[0].body, 'text_consent'), false);
  assert.equal(calls[0].body.no_website, 'Yes');
  assert.equal(calls[0].body.goals, 'More calls/bookings');
});

test('an unticked consent box does not block submit', async () => {
  const { document, calls } = await loadForm('services/index.html');
  fillRequired(document, {});
  submit(document);
  assert.equal(calls.length, 1);
  assert.equal(document.querySelector('.qerr-sum').hidden, true);
  await new Promise(function (resolve) { setTimeout(resolve, 20); });
  assert.match(document.querySelector('.qd-h').textContent, /^Thanks/);
});

test('missing required fields still fail without asking for consent', async () => {
  const { document, calls } = await loadForm('pricing/index.html');
  submit(document);
  assert.equal(calls.length, 0);
  assert.equal(document.querySelector('.qerr-sum').hidden, false);
  assert.doesNotMatch(document.querySelector('.qerr-sum').textContent, /text/i);
});

test('every lead form posts OK to text, including pages whose box is unticked by default', async () => {
  for (const page of ['index.html', 'apps/index.html', 'work/index.html', 'terms/index.html']) {
    const { document, calls } = await loadForm(page);
    fillRequired(document, {});
    const box = document.querySelector('#rf-sms');
    if (box) assert.equal(box.checked, false);
    submit(document);
    assert.equal(calls.length, 1, page);
    assert.equal(calls[0].body['OK to text'], 'No', page);
  }
});

test('mailto fallback also includes OK to text when the box is unticked', async () => {
  const { document } = await loadForm('contact/index.html', { accessKey: 'REPLACE_ME' });
  fillRequired(document, { business: 'Analytical Engines' });
  submit(document);
  const link = document.querySelector('.qd-actions a');
  assert.ok(link, 'expected a mailto link');
  const body = decodeURIComponent(link.getAttribute('href').split('body=')[1]);
  assert.match(body, /OK to text: No/);
});
