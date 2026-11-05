/* ================= Look & style: wedding styles, then any color, font or decoration ================= */
const VIBES = [
  { k: 'classic', name: 'Classic gold', sub: 'Navy, ivory and gold', l: '#846431', d: '#D6B47C', h1: '#1B2042', h2: '#2C2454', g: '#E3C690', font: 'classic', motif: 'sprig' },
  { k: 'garden', name: 'Garden blush', sub: 'Soft pink and rose', l: '#A94962', d: '#EC97AA', h1: '#3E1C29', h2: '#6A3045', g: '#F6CFC8', font: 'script', motif: 'florals' },
  { k: 'sage', name: 'Sage greenery', sub: 'Eucalyptus and cream', l: '#4A7558', d: '#95C5A1', h1: '#1A2C22', h2: '#2E4A3A', g: '#E6D6A6', font: 'soft', motif: 'sprig' },
  { k: 'dusty', name: 'Dusty blue', sub: 'Something blue', l: '#3C6091', d: '#94B5E0', h1: '#18273E', h2: '#2A4266', g: '#EBD8B2', font: 'classic', motif: 'florals' },
  { k: 'boho', name: 'Terracotta boho', sub: 'Desert, rust and sand', l: '#A4532F', d: '#E7A07C', h1: '#3A2117', h2: '#6B3A24', g: '#F2D2B6', font: 'soft', motif: 'sprig' },
  { k: 'fall', name: 'Burgundy & gold', sub: 'Rich fall romance', l: '#8A2A3D', d: '#E0899A', h1: '#2A0F16', h2: '#4E1A27', g: '#E6C27A', font: 'classic', motif: 'florals' },
  { k: 'lavender', name: 'Lavender fields', sub: 'Lilac and plum', l: '#6E4A8B', d: '#BCA0D8', h1: '#261836', h2: '#45295C', g: '#EBC9A2', font: 'script', motif: 'florals' },
  { k: 'coastal', name: 'Coastal', sub: 'Sea glass and sand', l: '#1B7480', d: '#7FD0D8', h1: '#0E2F3A', h2: '#1C5363', g: '#F3E3C3', font: 'soft', motif: 'rings' },
  { k: 'winter', name: 'Winter silver', sub: 'Frost and silver', l: '#4F5D73', d: '#B8C4D6', h1: '#1C2230', h2: '#33405A', g: '#DDE3EC', font: 'classic', motif: 'rings' },
  { k: 'rustic', name: 'Rustic barn', sub: 'Wood, linen and lights', l: '#7A5530', d: '#D2A877', h1: '#2B1E14', h2: '#4A3422', g: '#E8CFA4', font: 'soft', motif: 'sprig' },
  { k: 'blacktie', name: 'Black tie', sub: 'Black, white and champagne', l: '#2A2A31', d: '#E7E3DA', h1: '#0F0F12', h2: '#26262D', g: '#E9E2D2', font: 'classic', motif: 'rings' },
  { k: 'modern', name: 'Modern minimal', sub: 'Clean and simple', l: '#3A3A44', d: '#D8D8E0', h1: '#24242C', h2: '#3A3A46', g: '#F4F1EA', font: 'modern', motif: 'none' }
];
const FONTS = [
  { k: 'classic', name: 'Classic', css: '"Bodoni Moda","Didot","Bodoni 72",ui-serif,Georgia,serif' },
  { k: 'script', name: 'Romantic script', css: '"Snell Roundhand","Segoe Script","Brush Script MT","Dancing Script",cursive' },
  { k: 'soft', name: 'Soft serif', css: '"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif' },
  { k: 'modern', name: 'Modern', css: '"Avenir Next","Avenir","Segoe UI","Helvetica Neue",Arial,sans-serif' }
];
const MOTIFS = [['sprig', 'Greenery'], ['florals', 'Flowers'], ['rings', 'Rings'], ['hearts', 'Hearts'], ['none', 'None']];
const OLD_PALETTE = { midnight: 'classic', blush: 'garden', sage: 'sage', dusk: 'dusty', plum: 'lavender', blacktie: 'blacktie' };
const HEX = /^#[0-9a-f]{6}$/i;
function blankStyle() { return { vibe: 'classic', accent: '', hero1: '', hero2: '', gold: '', font: '', motif: '' }; }
function normStyle(s, palette) {
  s = s && typeof s === 'object' ? s : {};
  const out = blankStyle();
  out.vibe = VIBES.some(v => v.k === s.vibe) ? s.vibe : (own(OLD_PALETTE, palette) ? OLD_PALETTE[palette] : 'classic');
  ['accent', 'hero1', 'hero2', 'gold'].forEach(k => { out[k] = HEX.test(s[k] || '') ? s[k] : ''; });
  out.font = FONTS.some(f => f.k === s.font) ? s.font : '';
  out.motif = MOTIFS.some(m => m[0] === s.motif) ? s.motif : '';
  return out;
}
/* The style in use right now: the wedding style, with any of the couple's own changes on top. */
function styleNow() {
  const st = (S && S.settings.style) || blankStyle(), v = VIBES.find(x => x.k === st.vibe) || VIBES[0];
  return { vibe: v, accent: st.accent || v.l, accentDark: st.accent ? 'color-mix(in srgb,' + st.accent + ' 58%,#fff)' : v.d, hero1: st.hero1 || v.h1, hero2: st.hero2 || v.h2, gold: st.gold || v.g, font: st.font || v.font, motif: st.motif || v.motif, custom: !!(st.accent || st.hero1 || st.hero2 || st.gold || st.font || st.motif) };
}
function applyStyle() {
  const r = document.documentElement, set = (k, v) => r.style.setProperty(k, v);
  if (!S) { ['--accent-l', '--accent-d', '--hero-1', '--hero-2', '--hero-gold', '--f-title'].forEach(k => r.style.removeProperty(k)); r.removeAttribute('data-font'); return; }
  const s = styleNow(), f = FONTS.find(x => x.k === s.font) || FONTS[0];
  r.removeAttribute('data-palette');
  set('--accent-l', s.accent); set('--accent-d', s.accentDark); set('--hero-1', s.hero1); set('--hero-2', s.hero2); set('--hero-gold', s.gold);
  set('--f-title', f.css);
  r.setAttribute('data-font', s.font);
}

/* ---------- Decorations for the countdown card ---------- */
function flowerSVG(cls) {
  const flower = (x, y, r, rot) => {
    let p = '';
    for (let i = 0; i < 5; i++) p += '<ellipse cx="0" cy="' + (-r * .62).toFixed(1) + '" rx="' + (r * .42).toFixed(1) + '" ry="' + (r * .66).toFixed(1) + '" transform="rotate(' + (i * 72 + rot) + ')"/>';
    return '<g transform="translate(' + x + ' ' + y + ')">' + p + '<circle r="' + (r * .2).toFixed(1) + '"/></g>';
  };
  const leaf = (x, y, a, L) => '<g transform="translate(' + x + ' ' + y + ') rotate(' + a + ')"><path d="M0 0Q' + L / 2 + ' ' + (-L * .3) + ' ' + L + ' 0Q' + L / 2 + ' ' + (L * .3) + ' 0 0Z"/><path d="M2 0H' + L * .8 + '" fill="none"/></g>';
  return '<svg class="sprig ' + cls + ' flowers" viewBox="0 0 220 250" aria-hidden="true"><path d="M30 235C60 170 110 120 190 40M120 110C150 110 175 125 200 150" fill="none"/>' +
    leaf(70, 170, -70, 40) + leaf(96, 138, 20, 36) + leaf(150, 112, -40, 30) + leaf(160, 128, 40, 30) +
    flower(190, 40, 34, 10) + flower(128, 92, 24, 30) + flower(200, 150, 20, 0) + flower(58, 196, 16, 20) + '</svg>';
}
function heartsSVG(cls) {
  const h = (x, y, s, a) => '<path transform="translate(' + x + ' ' + y + ') rotate(' + a + ') scale(' + s + ')" d="M0 6C-6-1-12 3-10 8-8 13 0 18 0 18S8 13 10 8C12 3 6-1 0 6Z"/>';
  return '<svg class="sprig ' + cls + ' hearts" viewBox="0 0 220 250" aria-hidden="true">' + h(170, 40, 3.2, 12) + h(110, 110, 2, -14) + h(196, 150, 1.5, 20) + h(60, 60, 1.2, -6) + h(140, 200, 1.1, 8) + '</svg>';
}
function ringsMotif(cls) {
  return '<svg class="sprig ' + cls + ' ringsm" viewBox="0 0 220 250" aria-hidden="true"><circle cx="120" cy="120" r="62" fill="none"/><circle cx="164" cy="120" r="62" fill="none"/><path d="M152 46l12-14 12 14-12 12z"/><circle cx="120" cy="120" r="54" fill="none" opacity=".5"/><circle cx="164" cy="120" r="54" fill="none" opacity=".5"/></svg>';
}
function heroMotif(cls) {
  const m = styleNow().motif;
  return m === 'florals' ? flowerSVG(cls) : m === 'hearts' ? heartsSVG(cls) : m === 'rings' ? ringsMotif(cls) : m === 'none' ? '' : sprigSVG(cls);
}

/* ---------- The Look & style page ---------- */
R.style = function () {
  const s = styleNow(), st = S.settings.style, c = S.couple;
  const w = weddingDay();
  const swatchBg = v => 'background:linear-gradient(140deg,' + v.h1 + ',' + v.h2 + ')';
  const colorRow = (k, label, sub, val) => '<label class="colrow"><span class="cdot" style="background:' + esc(val) + '"><input type="color" data-color="' + k + '" value="' + esc(val) + '" aria-label="' + esc(label) + '"></span><span class="tx"><b>' + label + '</b><small>' + sub + '</small></span>' + (st[k] ? '<button type="button" class="linkbtn" data-act="color-reset" data-k="' + k + '">Reset</button>' : '<span class="faint small">From style</span>') + '</label>';
  return '<div class="phead"><div><div class="eyebrow">Make it yours</div><h1>Look &amp; style</h1></div></div>' +
    '<section class="hero stylehero" aria-label="Preview"><div class="grain"></div>' + heroMotif('br') +
      '<div class="monogram" aria-hidden="true">' + esc((c.a.trim()[0] || '♡').toUpperCase()) + '<i>&amp;</i>' + esc((c.b.trim()[0] || '♡').toUpperCase()) + '</div>' +
      '<div class="eyebrow">The wedding of</div><h2>' + coupleNames(true) + '</h2>' +
      '<div class="when">' + esc(w ? fmtDate(w, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Your wedding date') + '</div>' +
      '<div class="stylebtns"><span class="sb1">' + ic('check', 'sm') + 'Buttons</span><span class="sb2">Rings</span></div>' +
    '</section>' +
    '<h2 class="sect-title" style="margin:24px 2px 12px">Wedding styles</h2>' +
    '<div class="vibes">' + VIBES.map(v => '<button type="button" class="vibe" data-act="vibe" data-k="' + v.k + '" aria-pressed="' + (st.vibe === v.k) + '"><span class="vsw" style="' + swatchBg(v) + '"><i style="background:' + v.g + '"></i><i style="background:' + v.l + '"></i><em style="font-family:' + esc((FONTS.find(f => f.k === v.font) || FONTS[0]).css) + ';color:' + v.g + '">A&amp;B</em></span><b>' + esc(v.name) + '</b><small>' + esc(v.sub) + '</small></button>').join('') + '</div>' +
    '<div class="cols" style="margin-top:20px">' +
      '<section class="card"><div class="card-head"><h2>Colors</h2>' + (s.custom ? '<button class="linkbtn" type="button" data-act="style-reset">Back to ' + esc(s.vibe.name) + '</button>' : '') + '</div>' +
        '<div class="colrows">' +
          colorRow('accent', 'Main color', 'Buttons, links and progress rings', s.accent) +
          colorRow('hero1', 'Countdown card', 'The big card on Home', s.hero1) +
          colorRow('hero2', 'Countdown card glow', 'The second color it fades into', s.hero2) +
          colorRow('gold', 'Detail color', 'Names, lines and decorations', s.gold) +
        '</div>' +
        '<div class="flabel" style="margin:14px 0 8px">Quick main colors</div><div class="quickc">' + [['#846431', 'Antique gold'], ['#A94962', 'Rose'], ['#A84E69', 'Blush pink'], ['#4A7558', 'Sage green'], ['#3C6091', 'Dusty blue'], ['#1B7480', 'Teal'], ['#6E4A8B', 'Lavender'], ['#8A2A3D', 'Burgundy'], ['#A4532F', 'Terracotta'], ['#2A2A31', 'Charcoal']].map(([x, n]) => '<button type="button" data-act="quick-accent" data-c="' + x + '" style="background:' + x + '" aria-label="' + n + '" title="' + n + '" aria-pressed="' + (s.accent.toLowerCase() === x.toLowerCase()) + '"></button>').join('') + '</div>' +
      '</section>' +
      '<section class="card"><div class="card-head"><h2>Font for your names</h2></div>' +
        '<div class="fontpick">' + FONTS.map(f => '<button type="button" data-act="font" data-k="' + f.k + '" aria-pressed="' + (s.font === f.k) + '"><span style="font-family:' + esc(f.css) + '" class="fp-' + f.k + '">' + esc(coupleNames(false) === 'Our wedding' ? 'Olivia & James' : coupleNames(false)) + '</span><small>' + f.name + '</small></button>').join('') + '</div>' +
        '<p class="hint" style="margin:10px 0 0">Script looks different on iPhone, Android and computers, since each has its own handwriting font.</p>' +
      '</section>' +
      '<section class="card"><div class="card-head"><h2>Decoration</h2></div>' +
        '<div class="seg motifseg" role="group" aria-label="Decoration">' + MOTIFS.map(m => '<button type="button" data-act="motif" data-k="' + m[0] + '" aria-pressed="' + (s.motif === m[0]) + '">' + m[1] + '</button>').join('') + '</div>' +
        '<div class="flabel" style="margin:16px 0 8px">Light or dark</div>' +
        '<div class="seg" role="group" aria-label="Appearance">' + [['auto', 'Match phone'], ['light', 'Light'], ['dark', 'Dark']].map(m => '<button type="button" data-act="mode" data-k="' + m[0] + '" aria-pressed="' + (S.settings.mode === m[0]) + '">' + m[1] + '</button>').join('') + '</div>' +
        '<div class="flabel" style="margin:16px 0 8px">Your photo</div>' +
        '<button class="btn block" type="button" data-act="edit-couple">' + ic('camera') + (c.photo ? 'Change the countdown photo' : 'Add a photo of you two') + '</button>' +
      '</section>' +
    '</div>';
};
R.styleAfter = function (main) {
  $$('input[data-color]', main).forEach(inp => {
    inp.addEventListener('input', () => { S.settings.style[inp.dataset.color] = inp.value; applyStyle(); inp.parentElement.style.background = inp.value; });
    inp.addEventListener('change', () => { S.settings.style[inp.dataset.color] = inp.value; commit({ quiet: true }); });
  });
};
Object.assign(EXTRA_ACTS, {
  'vibe': el => { S.settings.style = Object.assign(blankStyle(), { vibe: el.dataset.k }); applyTheme(); commit({ quiet: true }); toast((VIBES.find(v => v.k === el.dataset.k) || {}).name + ' style on'); },
  'font': el => { S.settings.style.font = el.dataset.k; applyTheme(); commit({ quiet: true }); },
  'motif': el => { S.settings.style.motif = el.dataset.k; commit({ quiet: true }); },
  'quick-accent': el => { S.settings.style.accent = el.dataset.c; applyTheme(); commit({ quiet: true }); },
  'color-reset': el => { S.settings.style[el.dataset.k] = ''; applyTheme(); commit({ quiet: true }); },
  'style-reset': () => { const snap = snapshot(); S.settings.style = Object.assign(blankStyle(), { vibe: S.settings.style.vibe }); applyTheme(); commit({ quiet: true }); toast('Back to the style’s own look', () => restoreSnapshot(snap)); }
});
