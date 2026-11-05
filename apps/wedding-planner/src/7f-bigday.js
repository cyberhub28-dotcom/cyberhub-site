/* ================= The big day: timeline, wedding party, music, photos, gifts, kit, guest info, vows ================= */
const SHOT_START = [
  ['Getting ready', ['The dress or suit hanging up', 'Rings, shoes and jewelry', 'Invitation and details flat lay', 'Partner 1 getting ready', 'Partner 2 getting ready', 'Parents helping with the last touches']],
  ['Ceremony', ['Guests arriving and the venue', 'Walking down the aisle', 'Seeing each other for the first time', 'Exchanging vows and rings', 'The first kiss', 'Walking back up the aisle']],
  ['Family', ['Couple with both families', 'Couple with each set of parents', 'Couple with grandparents', 'Couple with brothers and sisters']],
  ['Wedding party', ['The whole wedding party', 'Each side of the wedding party', 'A fun, silly group shot']],
  ['Just the two of you', ['Golden hour portraits', 'Close-up of hands and rings', 'A wide shot with the venue']],
  ['Reception', ['Grand entrance', 'Room and table details before guests sit', 'First dance', 'Toasts and reactions', 'Cake cutting', 'Parent dances', 'Packed dance floor', 'The send-off']]
];
const KIT_START = ['Sewing kit and safety pins', 'Stain remover pen', 'Fashion tape', 'Pain reliever and bandages', 'Blotting papers and powder', 'Lipstick for touch-ups', 'Deodorant and mints', 'Hair pins and hairspray', 'Phone charger', 'Tissues for happy tears', 'Snacks and water', 'Flat shoes for dancing', 'Umbrella', 'A printed copy of your vows', 'Envelopes with vendor tips', 'Your marriage license'];
const MOMENTS = ['Guests arriving', 'Walking down the aisle', 'Walking back up the aisle', 'Cocktail hour', 'Grand entrance', 'First dance', 'Parent dances', 'Cake cutting', 'Last dance', 'Send-off', 'Please don’t play'];
const ROLES = ['Maid of honor', 'Best man', 'Person of honor', 'Bridesmaid', 'Groomsman', 'Attendant', 'Flower girl', 'Ring bearer', 'Reader', 'Usher', 'Officiant', 'Parent', 'Other'];
const INFO_FIELDS = [
  ['hotel', 'Hotel for guests', 'Name of the hotel'], ['hotelCode', 'Booking code or group name', 'Optional'], ['hotelLink', 'Booking link', 'Optional'], ['hotelBy', 'Book by', 'Optional, like May 1'],
  ['dress', 'Dress code', 'Cocktail, black tie, garden party'], ['parking', 'Parking', 'Where to park'], ['shuttle', 'Shuttle or rides', 'Optional'], ['registry', 'Registry', 'Where you’re registered'], ['site', 'Wedding website', 'Optional'], ['notes', 'Anything else', 'Kids, weather, plus-ones']
];
function blankExtra() {
  let n = 0; const id = () => uid() + (n++);
  return {
    day: [], party: [], music: [], gifts: [],
    lists: { shots: SHOT_START.flatMap(([g, list]) => list.map(t => ({ id: id(), g, t, done: false }))), kit: KIT_START.map(t => ({ id: id(), t, done: false })) },
    info: Object.fromEntries(INFO_FIELDS.map(f => [f[0], ''])), words: { a: '', b: '', toasts: '' }
  };
}
function normalizeExtra(p, out) {
  const b = blankExtra(), str = (v, d, n) => typeof v === 'string' ? v.slice(0, n || 500) : typeof v === 'number' && isFinite(v) ? String(v) : d;
  const arr = (x, f) => objs(x).slice(0, 1000).map(f);
  out.day = arr(p.day, x => ({ id: cleanId(x.id) || uid(), time: /^\d{2}:\d{2}$/.test(x.time || '') ? x.time : '12:00', t: str(x.t, 'Moment'), who: str(x.who, ''), where: str(x.where, '') }));
  out.party = arr(p.party, x => ({ id: cleanId(x.id) || uid(), name: str(x.name, 'Someone'), role: str(x.role, 'Other'), phone: str(x.phone, ''), notes: str(x.notes, '') }));
  out.music = arr(p.music, x => ({ id: cleanId(x.id) || uid(), moment: str(x.moment, MOMENTS[0]), song: str(x.song, 'Song'), artist: str(x.artist, '') }));
  out.gifts = arr(p.gifts, x => ({ id: cleanId(x.id) || uid(), from: str(x.from, ''), gift: str(x.gift, ''), kind: ['item', 'money', 'experience'].includes(x.kind) ? x.kind : 'item', use: str(x.use, ''), thanked: !!x.thanked }));
  const ob = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  const L = ob(p.lists);
  out.lists = {
    shots: Array.isArray(L.shots) ? arr(L.shots, x => ({ id: cleanId(x.id) || uid(), g: str(x.g, 'Other'), t: str(x.t, ''), done: !!x.done })).filter(x => x.t) : b.lists.shots,
    kit: Array.isArray(L.kit) ? arr(L.kit, x => ({ id: cleanId(x.id) || uid(), t: str(x.t, ''), done: !!x.done })).filter(x => x.t) : b.lists.kit
  };
  const I = ob(p.info);
  out.info = Object.fromEntries(INFO_FIELDS.map(f => [f[0], str(I[f[0]], '')]));
  const W = ob(p.words);
  out.words = { a: str(W.a, '', 20000), b: str(W.b, '', 20000), toasts: str(W.toasts, '', 5000) };
  return out;
}
function sampleExtra(p) {
  const P = (name, role, phone, notes) => p.party.push({ id: uid(), name, role, phone, notes: notes || '' });
  P('Ava Thompson', 'Maid of honor', '(843) 555-0142', 'Hair at 11:00. Holds the rings.'); P('Chloe Ramirez', 'Bridesmaid', '', 'Hair at 11:45.');
  P('Noah Carter', 'Best man', '(843) 555-0188', 'Gives the first toast.'); P('Ethan Carter', 'Groomsman', '', 'Helps the ushers.');
  P('Lily Carter', 'Flower girl', '', 'Age 6. Her mom walks with her.');
  const M = (moment, song, artist) => p.music.push({ id: uid(), moment, song, artist });
  M('Walking down the aisle', 'Canon in D', 'Pachelbel'); M('Walking back up the aisle', 'Signed, Sealed, Delivered', 'Stevie Wonder');
  M('First dance', 'At Last', 'Etta James'); M('Last dance', 'Don’t Stop Me Now', 'Queen'); M('Please don’t play', 'The Chicken Dance', '');
  p.gifts.push({ id: uid(), from: 'Grace Bennett', gift: 'Stand mixer (shower gift)', kind: 'item', use: '', thanked: true }, { id: uid(), from: 'Ruth Bennett', gift: 'Check', kind: 'money', use: 'our honeymoon', thanked: false });
  Object.assign(p.info, { hotel: 'The Harbor Inn', hotelCode: 'Olivia & James Wedding', hotelBy: 'May 1', dress: 'Garden formal', parking: 'Free lot beside the barn', shuttle: 'Shuttle from the hotel at 3:45 PM' });
  p.lists.shots.slice(0, 4).forEach(x => { x.done = true; });
  return p;
}

/* ---------- Pages ---------- */
let bdOpen = null;
const BD_TOOLS = [
  { k: 'timeline', icon: 'clock', name: 'Day-of timeline', info: () => S.day.length ? S.day.length + ' moments · starts ' + timeWords(dayItems()[0].time) : 'Build it in one tap' },
  { k: 'party', icon: 'people', name: 'Wedding party', info: () => S.party.length ? S.party.length + ' people' : 'Who’s standing with you' },
  { k: 'music', icon: 'music', name: 'Music', info: () => S.music.length ? S.music.length + ' songs' : 'First dance and more' },
  { k: 'shots', icon: 'camera', name: 'Photo shot list', info: () => { const l = S.lists.shots; return l.filter(x => x.done).length + ' of ' + l.length + ' picked'; } },
  { k: 'gifts', icon: 'gift', name: 'Gifts & thank-yous', info: () => S.gifts.length ? S.gifts.filter(g => g.thanked).length + ' of ' + S.gifts.length + ' thanked' : 'Track gifts and notes' },
  { k: 'kit', icon: 'bag', name: 'Day-of kit', info: () => { const l = S.lists.kit; return l.filter(x => x.done).length + ' of ' + l.length + ' packed'; } },
  { k: 'info', icon: 'info', name: 'Guest info', info: () => { const n = INFO_FIELDS.filter(f => S.info[f[0]]).length; return n ? n + ' details ready to share' : 'Hotel, dress code, parking'; } },
  { k: 'words', icon: 'pen', name: 'Vows & toasts', info: () => { const w = wordCount(S.words.a) + wordCount(S.words.b); return w ? w + ' words written' : 'Write them here, privately'; } }
];
const dayItems = () => S.day.slice().sort((a, b) => hm(a.time) - hm(b.time));
const wordCount = t => (String(t || '').trim().match(/\S+/g) || []).length;
const speakTime = n => { const m = n / 130; return m < 1 ? 'under a minute' : 'about ' + Math.round(m) + ' minute' + (Math.round(m) === 1 ? '' : 's'); };

R.bigday = function () {
  const t = bdOpen && BD_TOOLS.find(x => x.k === bdOpen);
  if (t) return '<button class="backlink" type="button" data-act="bd-close">' + ic('back', 'sm') + 'Big day</button>' + BD_VIEW[t.k]();
  bdOpen = null;
  const w = weddingDay(), n = w ? daysBetween(today0(), w) : null;
  return '<div class="phead"><div><div class="eyebrow">The day itself</div><h1>Big day</h1><p>' + (n != null && n >= 0 ? (n === 0 ? 'It’s today' : n + ' days to go') : '') + '</p></div></div>' +
    '<div class="bdgrid">' + BD_TOOLS.map(x => '<button type="button" class="bdtile" data-act="bd-open" data-k="' + x.k + '"><span class="bdic">' + ic(x.icon) + '</span><b>' + x.name + '</b><small>' + esc(x.info()) + '</small></button>').join('') + '</div>' +
    '<section class="card helpercall" style="margin-top:16px"><span class="bdic">' + ic('wand') + '</span><div><b>Not sure where to start?</b><p class="muted small" style="margin:2px 0 0">Smart helpers can build your day, figure out drinks and seat everyone for you.</p></div><a class="btn small" href="#helpers">Open</a></section>';
};
R.bigdayAfter = function (main) { if (bdOpen === 'words') wireWords(main); };
function toolHead(eyebrow, title, sub, btns) {
  return '<div class="phead"><div><div class="eyebrow">' + eyebrow + '</div><h1>' + title + '</h1><p>' + sub + '</p></div>' + (btns ? '<div class="actions">' + btns + '</div>' : '') + '</div>';
}
const BD_VIEW = {
  timeline() {
    const items = dayItems();
    return toolHead('Hour by hour', 'Day-of timeline', items.length ? 'Share it with your wedding party and vendors so everyone knows the plan.' : 'Tap Build it for me and get a full day from your ceremony time.',
      '<button class="btn" type="button" data-act="helper" data-k="day">' + ic('wand') + 'Build it for me</button>' + (items.length ? '<button class="btn" type="button" data-act="pdf-day">' + ic('pdf') + 'PDF</button>' : '') + '<button class="btn primary" type="button" data-act="day-add">' + ic('plus') + 'Add</button>') +
      (items.length ? '<section class="card"><ol class="tl dayl">' + items.map(x => '<li class="tli' + (/ceremony|i do|vows/i.test(x.t) ? ' big' : '') + '"><button type="button" class="tlb" data-act="day-edit" data-id="' + esc(x.id) + '"><span class="tld"><i class="num">' + esc(timeWords(x.time).replace(/\s?[AP]M$/i, '')) + '</i><b>' + esc((timeWords(x.time).match(/[AP]M$/i) || [''])[0]) + '</b></span><span class="tldot" aria-hidden="true"></span><span class="tlx"><b>' + esc(x.t) + '</b>' + (x.who || x.where ? '<small>' + esc([x.who, x.where].filter(Boolean).join(' · ')) + '</small>' : '') + '</span></button></li>').join('') + '</ol></section>'
        : '<div class="card empty"><div class="big">Your day, hour by hour</div>Hair and makeup, photos, the ceremony, dinner and dancing, all timed from your ceremony start.<br><button class="btn primary" type="button" data-act="helper" data-k="day">' + ic('wand') + 'Build it for me</button></div>');
  },
  party() {
    return toolHead('Your people', 'Wedding party', 'Who’s standing with you, what they do and how to reach them.', '<button class="btn" type="button" data-act="helper" data-k="msg" data-for="party">' + ic('chat') + 'Message them</button><button class="btn primary" type="button" data-act="party-add">' + ic('plus') + 'Add</button>') +
      (S.party.length ? '<div class="pgrid">' + S.party.map(p => '<button type="button" class="card person" data-act="party-edit" data-id="' + esc(p.id) + '"><span class="avatar" aria-hidden="true">' + esc(initials(p.name)) + '</span><span class="tx"><b>' + esc(p.name) + '</b><span class="pill accent">' + esc(p.role) + '</span>' + (p.notes ? '<small>' + esc(p.notes) + '</small>' : '') + '</span></button>').join('') + '</div>'
        : '<div class="card empty"><div class="big">Add your wedding party</div>Maid of honor, best man, flower girl, readers and anyone else with a job that day.<br><button class="btn primary" type="button" data-act="party-add">' + ic('plus') + 'Add someone</button></div>');
  },
  music() {
    const used = MOMENTS.filter(m => S.music.some(x => x.moment === m)).concat([...new Set(S.music.map(x => x.moment))].filter(m => !MOMENTS.includes(m)));
    const left = MOMENTS.filter(m => !used.includes(m));
    return toolHead('Your soundtrack', 'Music', 'The songs for each moment, ready to send to your DJ or band.', (S.music.length ? '<button class="btn" type="button" data-act="share-music">' + ic('share') + 'Send to DJ</button>' : '') + '<button class="btn primary" type="button" data-act="song-add">' + ic('plus') + 'Add song</button>') +
      '<div class="stack">' + used.map(m => '<section class="card"><div class="card-head"><h2>' + esc(m) + '</h2><button class="linkbtn" type="button" data-act="song-add" data-m="' + esc(m) + '">Add</button></div><div class="list">' + S.music.filter(x => x.moment === m).map(x => '<div class="row tap" role="button" tabindex="0" data-act="song-edit" data-id="' + esc(x.id) + '"><div class="vicon">' + ic(m === 'Please don’t play' ? 'x' : 'music') + '</div><div class="main"><div class="t">' + esc(x.song) + '</div>' + (x.artist ? '<div class="s">' + esc(x.artist) + '</div>' : '') + '</div></div>').join('') + '</div></section>').join('') + '</div>' +
      (left.length ? '<div class="kh2">Still to pick</div><div class="chiprow">' + left.map(m => '<button type="button" class="chipbtn" data-act="song-add" data-m="' + esc(m) + '">' + ic('plus', 'sm') + esc(m) + '</button>').join('') + '</div>' : '');
  },
  shots() { return checklistView('shots', 'For your photographer', 'Photo shot list', 'Tick the photos you want. Then send the list to your photographer.', true); },
  kit() { return checklistView('kit', 'Pack it the day before', 'Day-of kit', 'A little bag of rescues for the big day. Tick things off as you pack.', false); },
  gifts() {
    const done = S.gifts.filter(g => g.thanked).length;
    return toolHead('With love', 'Gifts & thank-yous', S.gifts.length ? done + ' of ' + S.gifts.length + ' thank-you notes sent.' : 'Write down each gift as it comes, so thank-yous are easy.', '<button class="btn primary" type="button" data-act="gift-add">' + ic('plus') + 'Add gift</button>') +
      (S.gifts.length ? '<section class="card"><div class="list">' + S.gifts.map(g => '<div class="row"><button class="check' + (g.thanked ? ' on' : '') + '" type="button" data-act="gift-thank" data-id="' + esc(g.id) + '" aria-pressed="' + g.thanked + '" aria-label="' + (g.thanked ? 'Thank-you sent' : 'Mark thank-you sent') + ': ' + esc(g.from) + '">' + ic('check') + '</button><div class="main tap" role="button" tabindex="0" data-act="gift-edit" data-id="' + esc(g.id) + '"><div class="t">' + esc(g.from || 'Someone') + '</div><div class="s">' + esc(g.gift || (g.kind === 'money' ? 'Money gift' : 'Gift')) + (g.thanked ? ' · Thanked' : '') + '</div></div><button class="btn small" type="button" data-act="helper" data-k="thanks" data-id="' + esc(g.id) + '">' + ic('wand', 'sm') + 'Write note</button></div>').join('') + '</div></section>'
        : '<div class="card empty"><div class="big">No gifts yet</div>Shower gifts count too. Add each one and the app helps you write the thank-you note.<br><button class="btn primary" type="button" data-act="gift-add">' + ic('plus') + 'Add a gift</button></div>');
  },
  info() {
    const rows = INFO_FIELDS.filter(f => S.info[f[0]]);
    return toolHead('For your guests', 'Guest info', 'Everything guests ask you. Share it by text, email or PDF.', (rows.length ? '<button class="btn" type="button" data-act="share-info">' + ic('share') + 'Share</button><button class="btn" type="button" data-act="pdf-info">' + ic('pdf') + 'PDF</button>' : '') + '<button class="btn primary" type="button" data-act="info-edit">' + ic('edit') + 'Edit</button>') +
      (rows.length ? '<section class="card"><div class="kv">' + rows.map(f => '<div><span>' + f[1] + '</span><b>' + esc(S.info[f[0]]) + '</b></div>').join('') + '</div></section>'
        : '<div class="card empty"><div class="big">Answer guest questions once</div>Hotel, dress code, parking and registry, all in one note you can text to anyone.<br><button class="btn primary" type="button" data-act="info-edit">' + ic('edit') + 'Add the details</button></div>');
  },
  words() {
    const box = (k, who) => { const n = wordCount(S.words[k]); return '<section class="card"><div class="card-head"><h2>' + esc(who) + '</h2><span class="faint small" data-wc="' + k + '">' + (n ? n + ' words · ' + speakTime(n) + ' out loud' : 'Not started') + '</span></div><textarea class="input vows" data-words="' + k + '" placeholder="Start anywhere. A memory, a promise, a funny moment." aria-label="' + esc(who) + '">' + esc(S.words[k]) + '</textarea></section>'; };
    return toolHead('Only on this phone', 'Vows & toasts', 'Write in private. It saves as you type and stays on this phone.', '<button class="btn" type="button" data-act="helper" data-k="vows">' + ic('wand') + 'Ideas to start</button>') +
      '<div class="stack">' + box('a', (S.couple.a || 'Partner 1') + '’s vows') + box('b', (S.couple.b || 'Partner 2') + '’s vows') +
      '<section class="card"><div class="card-head"><h2>Toasts, in order</h2></div><textarea class="input" data-words="toasts" placeholder="1. Best man&#10;2. Maid of honor&#10;3. Parents" aria-label="Toasts in order" style="min-height:110px">' + esc(S.words.toasts) + '</textarea></section></div>';
  }
};
function checklistView(key, eyebrow, title, sub, grouped) {
  const l = S.lists[key];
  const row = x => '<div class="task' + (x.done ? ' done' : '') + '"><button class="check" type="button" data-act="li-toggle" data-l="' + key + '" data-id="' + esc(x.id) + '" aria-pressed="' + x.done + '" aria-label="' + esc(x.t) + '">' + ic('check') + '</button><div class="tx" role="button" tabindex="0" data-act="li-edit" data-l="' + key + '" data-id="' + esc(x.id) + '">' + esc(x.t) + '</div></div>';
  const groups = grouped ? [...new Set(l.map(x => x.g))] : [null];
  return toolHead(eyebrow, title, sub, (l.length ? '<button class="btn" type="button" data-act="li-share" data-l="' + key + '">' + ic('share') + 'Share</button>' : '') + '<button class="btn primary" type="button" data-act="li-add" data-l="' + key + '">' + ic('plus') + 'Add</button>') +
    '<div class="card" style="display:flex;align-items:center;gap:14px;margin-bottom:16px"><span style="display:grid;place-items:center">' + ringSVG(l.length ? l.filter(x => x.done).length / l.length : 0, 52, 6) + '</span><div><b style="font:600 20px var(--f-display)">' + l.filter(x => x.done).length + ' of ' + l.length + '</b><div class="muted small">' + (key === 'kit' ? 'packed' : 'picked') + '</div></div></div>' +
    '<div class="stack">' + groups.map(g => '<section class="card">' + (g ? '<div class="card-head"><h2>' + esc(g) + '</h2></div>' : '') + '<div class="list">' + l.filter(x => !grouped || x.g === g).map(row).join('') + '</div></section>').join('') + '</div>' +
    (l.length ? '' : '<div class="card empty"><button class="btn" type="button" data-act="li-start" data-l="' + key + '">Load the starter list</button></div>');
}
function wireWords(main) {
  let t = null;
  $$('textarea[data-words]', main).forEach(ta => ta.addEventListener('input', () => {
    S.words[ta.dataset.words] = ta.value.slice(0, 20000);
    const lab = $('[data-wc="' + ta.dataset.words + '"]', main); if (lab) { const n = wordCount(ta.value); lab.textContent = n ? n + ' words · ' + speakTime(n) + ' out loud' : 'Not started'; }
    clearTimeout(t); t = setTimeout(persist, 400);
  }));
}

/* ---------- Edit sheets ---------- */
function editDay(id) {
  const x = id ? byId(S.day, id) : null;
  openSheet({
    title: x ? 'Edit moment' : 'New moment',
    fields: [{ row: [{ k: 'time', label: 'Time', type: 'time' }, { k: 't', label: 'What happens', required: true, ph: 'First dance' }] }, { k: 'who', label: 'Who', ph: 'Optional, like DJ or Ava' }, { k: 'where', label: 'Where', ph: 'Optional, like the garden' }],
    values: x || { time: S.couple.time || '16:00', where: S.couple.venue },
    onSave: v => { if (!/^\d{2}:\d{2}$/.test(v.time)) v.time = '12:00'; if (x) Object.assign(x, v); else S.day.push(Object.assign({ id: uid() }, v)); commit(); },
    onDelete: x ? close => { const snap = snapshot(); S.day = S.day.filter(y => y !== x); close(); commit(); toast('Moment removed', () => restoreSnapshot(snap)); } : null, deleteLabel: 'Remove moment'
  });
}
function editParty(id) {
  const x = id ? byId(S.party, id) : null;
  openSheet({
    title: x ? x.name : 'Add to wedding party',
    fields: [{ k: 'name', label: 'Name', required: true }, { k: 'role', label: 'Role', type: 'select', options: ROLES.map(r => ({ v: r, l: r })) }, { k: 'phone', label: 'Phone', ph: 'Optional' }, { k: 'notes', label: 'Their jobs that day', type: 'textarea', ph: 'Hair at 11:00, holds the rings, gives a toast' }],
    values: x || { role: ROLES[3] },
    body: x && x.phone ? '<a class="btn block" href="tel:' + esc(x.phone.replace(/[^\d+]/g, '')) + '">' + ic('phone') + 'Call ' + esc(firstOf(x.name)) + '</a>' : '',
    onSave: v => { if (x) Object.assign(x, v); else S.party.push(Object.assign({ id: uid() }, v)); commit(); },
    onDelete: x ? close => { const snap = snapshot(); S.party = S.party.filter(y => y !== x); close(); commit(); toast(x.name + ' removed', () => restoreSnapshot(snap)); } : null, deleteLabel: 'Remove'
  });
}
function editSong(id, moment) {
  const x = id ? byId(S.music, id) : null;
  openSheet({
    title: x ? 'Edit song' : 'Add a song',
    fields: [{ k: 'moment', label: 'For', type: 'select', options: MOMENTS.map(m => ({ v: m, l: m })) }, { k: 'song', label: 'Song', required: true }, { k: 'artist', label: 'Artist', ph: 'Optional' }],
    values: x || { moment: moment || 'First dance' },
    onSave: v => { if (x) Object.assign(x, v); else S.music.push(Object.assign({ id: uid() }, v)); commit(); },
    onDelete: x ? close => { const snap = snapshot(); S.music = S.music.filter(y => y !== x); close(); commit(); toast('Song removed', () => restoreSnapshot(snap)); } : null, deleteLabel: 'Remove song'
  });
}
function editGift(id) {
  const x = id ? byId(S.gifts, id) : null;
  openSheet({
    title: x ? 'Edit gift' : 'Add a gift',
    fields: [{ k: 'from', label: 'From', required: true, ph: 'Who gave it' }, { k: 'kind', label: 'Kind', type: 'seg', options: [{ v: 'item', l: 'Gift' }, { v: 'money', l: 'Money' }, { v: 'experience', l: 'Experience' }] }, { k: 'gift', label: 'What it was', ph: 'Stand mixer, check, cooking class' }, { k: 'use', label: 'What you’ll use it for', ph: 'Optional, like our honeymoon', showIf: v => v.kind !== 'item' }, { k: 'thanked', label: 'Thank-you note sent', type: 'toggle' }],
    values: x || { kind: 'item' },
    body: '<datalist id="gnames">' + S.guests.map(g => '<option value="' + esc(g.name) + '">').join('') + '</datalist>',
    onMount: sc => { const f = $('#f-from', sc); if (f) f.setAttribute('list', 'gnames'); },
    onSave: v => { if (x) Object.assign(x, v); else S.gifts.push(Object.assign({ id: uid() }, v)); commit(); },
    onDelete: x ? close => { const snap = snapshot(); S.gifts = S.gifts.filter(y => y !== x); close(); commit(); toast('Gift removed', () => restoreSnapshot(snap)); } : null, deleteLabel: 'Remove gift'
  });
}
function editListItem(key, id) {
  const l = S.lists[key], x = id ? byId(l, id) : null, grouped = key === 'shots';
  const groups = [...new Set(l.map(y => y.g).filter(Boolean).concat(SHOT_START.map(s => s[0])))];
  openSheet({
    title: x ? 'Edit' : (key === 'kit' ? 'Add to your kit' : 'Add a photo'),
    fields: [{ k: 't', label: key === 'kit' ? 'Item' : 'Photo', required: true }].concat(grouped ? [{ k: 'g', label: 'Part of the day', type: 'select', options: groups.map(g => ({ v: g, l: g })) }] : []),
    values: x || { g: 'Just the two of you' },
    onSave: v => { if (x) Object.assign(x, v); else l.push(Object.assign({ id: uid(), done: true }, v)); commit(); },
    onDelete: x ? close => { const snap = snapshot(); S.lists[key] = l.filter(y => y !== x); close(); commit(); toast('Removed', () => restoreSnapshot(snap)); } : null, deleteLabel: 'Remove'
  });
}
function editInfo() {
  openSheet({ title: 'Guest info', fields: INFO_FIELDS.map(f => ({ k: f[0], label: f[1], ph: f[2], type: f[0] === 'notes' ? 'textarea' : 'text' })), values: S.info, onSave: v => { Object.assign(S.info, v); commit(); toast('Guest info saved'); } });
}
function infoText() {
  const w = weddingMoment(), lines = [coupleNames(false) + (w ? ' · ' + fmtDate(w, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '')];
  if (w) lines.push('Ceremony at ' + w.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) + ([S.couple.venue, S.couple.city].filter(Boolean).length ? ', ' + [S.couple.venue, S.couple.city].filter(Boolean).join(', ') : ''));
  INFO_FIELDS.forEach(f => { if (S.info[f[0]]) lines.push(f[1] + ': ' + S.info[f[0]]); });
  return lines.join('\n');
}
function listText(key) {
  const l = S.lists[key];
  if (key === 'shots') { const picked = l.filter(x => x.done); const g = [...new Set(picked.map(x => x.g))]; return 'Photo list for ' + coupleNames(false) + '\n' + g.map(n => '\n' + n.toUpperCase() + '\n' + picked.filter(x => x.g === n).map(x => '- ' + x.t).join('\n')).join('\n'); }
  return 'Day-of kit\n' + l.map(x => (x.done ? '[x] ' : '[ ] ') + x.t).join('\n');
}
function musicText() {
  const g = [...new Set(S.music.map(x => x.moment))];
  return 'Music for ' + coupleNames(false) + '\n' + g.map(m => '\n' + m.toUpperCase() + '\n' + S.music.filter(x => x.moment === m).map(x => '- ' + x.song + (x.artist ? ' (' + x.artist + ')' : '')).join('\n')).join('\n');
}
function pdfDay() {
  if (!S.day.length) { toast('Add a moment first'); return; }
  makePdf('day-of-timeline', P => {
    P.head('Day-of timeline');
    if (S.couple.venue) P.text([S.couple.venue, S.couple.city].filter(Boolean).join(', '), { size: 10, color: P.grey, center: true, gap: 16 });
    dayItems().forEach(x => {
      P.ensure(34);
      P.row([{ t: timeWords(x.time), x: P.M, w: 80, font: P.F.bold }, { t: x.t, x: P.M + 80, w: 250, font: P.F.bold }, { t: [x.who, x.where].filter(Boolean).join(' · '), x: P.M + 330, w: 182 }], { size: 10.5 });
      P.gap(6);
    });
    if (S.party.length) { P.gap(14); P.text('WEDDING PARTY', { size: 8, font: P.F.bold, color: P.gold, gap: 6 }); S.party.forEach(p => P.text(p.name + ' (' + p.role + ')' + (p.phone ? '   ' + p.phone : '') + (p.notes ? '   ' + p.notes : ''), { size: 9.5, gap: 3 })); }
  });
}
function pdfInfo() {
  makePdf('guest-info', P => {
    P.head('Guest info');
    infoText().split('\n').slice(1).forEach(l => { const i = l.indexOf(': '); if (i > 0) { P.text(l.slice(0, i).toUpperCase(), { size: 7.5, font: P.F.bold, color: P.gold, gap: 2 }); P.wrap(l.slice(i + 2), { size: 11, gap: 10 }); } else P.wrap(l, { size: 11, center: true, gap: 14 }); });
  });
}

Object.assign(EXTRA_ACTS, {
  'bd-open': el => { bdOpen = el.dataset.k; if (route !== 'bigday') go('bigday'); else { render(); toTop(); } },
  'bd-close': () => { bdOpen = null; render(); toTop(); },
  'day-add': () => editDay(null), 'day-edit': el => editDay(el.dataset.id), 'pdf-day': pdfDay,
  'party-add': () => editParty(null), 'party-edit': el => editParty(el.dataset.id),
  'song-add': el => editSong(null, el.dataset.m), 'song-edit': el => editSong(el.dataset.id), 'share-music': () => shareText('Our wedding music', musicText()),
  'gift-add': () => editGift(null), 'gift-edit': el => editGift(el.dataset.id),
  'gift-thank': el => { const g = byId(S.gifts, el.dataset.id); if (!g) return; g.thanked = !g.thanked; commit(); if (g.thanked) toast('Thank-you to ' + firstOf(g.from) + ' marked sent'); },
  'li-toggle': el => { const x = byId(S.lists[el.dataset.l], el.dataset.id); if (!x) return; x.done = !x.done; commit({ quiet: true }); },
  'li-edit': el => editListItem(el.dataset.l, el.dataset.id), 'li-add': el => editListItem(el.dataset.l, null),
  'li-share': el => shareText(el.dataset.l === 'shots' ? 'Our photo list' : 'Day-of kit', listText(el.dataset.l)),
  'li-start': el => { S.lists[el.dataset.l] = blankExtra().lists[el.dataset.l]; commit(); },
  'info-edit': editInfo, 'share-info': () => shareText('Wedding info', infoText()), 'pdf-info': pdfInfo
});
