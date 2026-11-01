// Checks that saved data and backups with built-in words or wrong types are cleaned safely.
// Run from apps/credentials: node --test test/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const src = f => readFileSync(new URL("../src/" + f, import.meta.url), "utf8");
const core = src("1-core.js").replace(/^\(\(\) => \{\n/, "");
const accents = src("2-render.js").split("\n").find(l => l.startsWith("const ACCENTS = "));
const code = `(() => {${core}\n${src("1b-packs.js")}\n${accents}\nreturn { clean, migrate, validState, okId, sample, PACKS };})()`;
const box = { window: {}, matchMedia: () => ({ matches: false }), document: {}, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, setTimeout, console };
const app = vm.runInNewContext(code, box);
const open = s => app.migrate(app.clean(JSON.parse(JSON.stringify(s))));
const base = () => { const s = app.sample("nursing"); s.sample = false; return JSON.parse(JSON.stringify(s)); };
const WORDS = ["constructor", "__proto__", "toString", "valueOf", "hasOwnProperty", "isPrototypeOf"];

test("built-in words never pick a profession, id, link or color", () => {
  for (const w of WORDS) {
    const s = base();
    s.profile.pack = w; s.creds[0].id = w; s.ce[0].applies = [w]; s.ce[0].photo = w; s.rules[0].subs = { [w]: 3 };
    s.look = { accent: w, theme: "auto", hidden: [w] };
    const o = open(s);
    assert.equal(o.profile.pack, "nursing", w);
    assert.notEqual(o.creds[0].id, w);
    assert.ok(!o.ce[0].applies.includes(w));
    assert.equal(o.ce[0].photo, "");
    assert.ok(!Object.prototype.hasOwnProperty.call(o.rules[0].subs, w));
    assert.equal(o.look.accent, undefined);
    assert.deepEqual(o.look.hidden, []);
    assert.ok(!app.okId(w));
  }
});

test("wrong types become safe text, numbers, or true/false", () => {
  for (const bad of [123, true, null, {}, ["a"]]) {
    const s = base();
    s.creds.forEach(c => { c.issuer = bad; c.privStatus = bad; c.title = bad; });
    s.ce.forEach(e => { e.date = bad; e.title = bad; e.hours = bad; e.approved = bad; });
    s.todos.forEach(t => { t.text = bad; t.done = bad; });
    s.ce.unshift({});
    const o = open(s);
    for (const c of o.creds) for (const k of ["issuer", "privStatus", "title"]) assert.equal(typeof c[k], "string");
    for (const e of o.ce) { assert.equal(typeof e.date, "string"); assert.equal(typeof e.title, "string"); assert.ok(Number.isFinite(e.hours ?? 0)); }
    for (const t of o.todos) { assert.equal(typeof t.text, "string"); assert.equal(typeof t.done, "boolean"); }
  }
});

test("the example data passes through cleaning unchanged in shape", () => {
  const s = base(), o = open(s);
  assert.equal(o.creds.length, s.creds.length);
  assert.equal(o.ce.length, s.ce.length);
  assert.equal(o.profile.pack, "nursing");
});
