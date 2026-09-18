(() => {
  'use strict';

  const NUM_MOOSE = 7;
  const MAX_NAMES = 500;
  const FINISH_X = 4500;
  const START_X = 160;

  const LANE_COLORS = [
    '#e8590c', '#1971c2', '#c2255c', '#5f3dc4', '#0ca678', '#f59f00',
    '#2b8a3e', '#862e9c', '#0b7285', '#a61e4d', '#e67700', '#495057',
    '#d6336c', '#5c940d'
  ];

  const COMMENT_LINES = [
    (n) => `${n} smells DONUTS — full sprint!`,
    (n) => `Is ${n} being chased by a bee?!`,
    (n) => `${n} just remembered they left the oven on...`,
    (n) => `${n} finds a perfect stick. Priorities.`,
    (n) => `Scientists are baffled by ${n}'s speed.`,
    (n) => `${n} argues with a squirrel. Loses.`,
    (n) => `Crowd goes absolutely WILD for ${n}!`,
    (n) => `${n} is running on pure coffee and spite.`,
    (n) => `Local hero ${n} waves to the fans!`,
    (n) => `${n} passes ALL the other moose!`,
    (n) => `${n} spots a puddle. Splash! So graceful.`,
    (n) => `${n} considers a snack break. Decides against it.`,
    (n) => `Did ${n} just speed-walk? Illegal! Ref agrees.`,
    (n) => `A tiny bird rides along with ${n}!`,
    (n) => `${n}'s antlers are aerodynamic. Probably.`,
    (n) => `Tourists throw confetti at ${n}. Whoosh!`
  ];

  const WIN_LINES = [
    'Champion of the forest!',
    'Undefeated snack champion.',
    'Certified fastest moose alive.',
    'The trees applaud. Literally, they sway.',
    'Wins by a nose (a very big nose).',
    'Flawless victory. The squirrel concedes.'
  ];

  const SNACK_BUBBLES = ['berries?', 'nut?', 'leafy...', 'snack~', 'one sec', '*munch*'];
  const SURGE_BUBBLES = ['ZOOM!', 'vroom vroom!', 'gassed!', 'need for speed!'];
  const STUMBLE_BUBBLES = ['oof', 'my leg!', 'stupid log', 'wheee— ow.'];
  const CHATTER_BUBBLES = ['hi mom!', 'i got this', 'easy peasy', 'moosing around', 'bet i look cool'];

  const ROS1_LATE = ['Indigo', 'Jade', 'Kinetic', 'Lunar', 'Melodic', 'Noetic'];
  const ROS2_LATE = ['Eloquent', 'Foxy', 'Galactic', 'Humble', 'Iron', 'Jazzy', 'Kilted'];

  const STAMP_PRE = ['Sir', 'Lady', 'Baron', 'Baroness', 'Professor', 'Captain', 'Duke', 'Duchess', 'Grandma', 'Grandpa', 'Agent', 'Mayor', 'DJ', 'Sergeant', 'Wizard', 'Admiral', 'Sheriff', 'Doctor', 'Warlord', 'Count'];
  const STAMP_ADJ = ['Antlered', 'Snuffle', 'Bog', 'Berry', 'Bramble', 'Thunder', 'Blizzard', 'Mossy', 'Pinecone', 'Maple', 'Frosty', 'Wiggly', 'Turbo', 'Snazzy', 'Disco', 'Nacho', 'Pickled', 'Velvet', 'Grumpy', 'Radiant', 'Soggy', 'Zesty', 'Polite', 'Chaotic', 'Majestic', 'Aerodynamic', 'Lumbering', 'Sparkle', 'Bouncy', 'Loyal', 'Sassy', 'Cosmic', 'Gnarly', 'Dainty', 'Unbothered', 'Feral'];
  const STAMP_CORE = ['Moose', 'Mossbeard', 'Snoot', 'Thunderhoof', 'Bogsnuffle', 'Antlerz', 'Noodle', 'Moosketeer', 'Twigbeard', 'Chomps', 'Fernfluff', 'Puddles', 'Twiggy', 'Leafus', 'Brambletooth', 'Acornzilla', 'Stompy', 'Beardmore', 'Dewdrop', 'Birchbranch', 'Fjordfinder', 'Swampdonut', 'Pondscum', 'Barkbeard', 'Muddlehorn', 'Bogtrotter'];

  function stampedeNames(n) {
    const set = new Set();
    let guard = 0;
    while (set.size < n && guard++ < n * 60) {
      const pre = Math.random() < 0.15 ? '' : pick(STAMP_PRE) + ' ';
      set.add(pre + pick(STAMP_ADJ) + ' ' + pick(STAMP_CORE));
    }
    return [...set].slice(0, n).join('\n');
  }

  const $ = (id) => document.getElementById(id);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const els = {
    entryScreen: $('entry-screen'), raceScreen: $('race-screen'), winnerScreen: $('winner-screen'),
    names: $('names-input'), startBtn: $('start-btn'), demoBtn: $('demo-btn'), entryError: $('entry-error'),
    canvas: $('track'), commentary: $('commentary'), muteBtn: $('mute-btn'),
    standings: $('standings'), countdown: $('countdown'), finishBanner: $('finish-banner'),
    winnerImg: $('winner-moose-img'), winnerName: $('winner-name'), winnerSub: $('winner-sub'),
    rerunBtn: $('rerun-btn'), editBtn: $('edit-btn'), entryCount: $('entry-count')
  };

  const canvas = els.canvas;
  const sfxLast = {};
  function canPlay(key, ms) {
    const t = performance.now();
    if (!sfxLast[key] || sfxLast[key] + ms < t) { sfxLast[key] = t; return true; }
    return false;
  }
  const spriteCache = new Map();
  let hotLanes = new Set();
  let nextBreakawayT = 0;
  let zoom = 1, camPX = 0, camPY = 0, overlayShown = false;
  const mooseImgs = [];
  let names = [];
  let lanes = [];
  let decor = null;
  let state = 'idle';
  let camX = 0;
  let raceT = 0;
  let lastFrame = 0;
  let winner = null;
  let confetti = [];
  let particles = [];
  let lastLeaderIdx = -1;
  let soundOn = true;
  let actx = null;

  for (let i = 1; i <= NUM_MOOSE; i++) {
    const im = new Image();
    im.src = `img/moose${i}.png`;
    mooseImgs.push(im);
  }

  function ac() {
    if (!actx) {
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* noop */ }
    }
    return actx;
  }

  function tone(f0, f1, dur, type = 'square', g = 0.12, delay = 0) {
    if (!soundOn) return;
    const a = ac();
    if (!a) return;
    const t0 = a.currentTime + delay;
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
    gain.gain.setValueAtTime(g, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(a.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  const sfx = {
    tick: () => tone(540, 540, 0.14, 'square', 0.15),
    go: () => { tone(700, 1200, 0.5, 'sawtooth', 0.14); tone(350, 600, 0.5, 'square', 0.1); },
    cheer: () => [0, .07, .14, .21].forEach((d, i) => tone(500 + i * 160, 600 + i * 160, .18, 'triangle', .1, d)),
    stumble: () => tone(220, 90, 0.3, 'square', 0.15),
    surge: () => tone(300, 900, 0.25, 'sawtooth', 0.08),
    win: () => [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, f, 0.22, 'triangle', 0.14, i * 0.13))
  };

  function assignMooseImages(n) {
    const out = [];
    let pool = [];
    let last = -1;
    while (out.length < n) {
      if (pool.length === 0) pool = Array.from({ length: NUM_MOOSE }, (_, i) => i);
      shuffle(pool);
      if (pool.length > 1 && pool[0] === last) {
        let j = pool.findIndex((v) => v !== last);
        if (j > 0) [pool[0], pool[j]] = [pool[j], pool[0]];
      }
      last = pool.shift();
      out.push(last);
    }
    return out;
  }

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function genDecor() {
    const d = { clouds: [], mountains: [], midTrees: [], nearTrees: [], pathDecor: [], ferns: [] };
    for (let i = 0; i < 5; i++) d.clouds.push({ off: rand(0, 2600), y: rand(28, 120), s: rand(.6, 1.4) });
    for (let i = 0; i < 7; i++) d.mountains.push({ off: rand(0, 1400), s: rand(.7, 1.5) });
    for (let i = 0; i < 9; i++) d.midTrees.push({ off: rand(0, 900), s: rand(.7, 1.2) });
    for (let i = 0; i < 11; i++) d.nearTrees.push({ off: rand(0, 1000), s: rand(.7, 1.3), birch: Math.random() < .3 });
    let x = rand(60, 200);
    while (x < FINISH_X + 500) {
      d.pathDecor.push({ x, type: pick(['flower', 'mushroom', 'rock', 'stump', 'grass', 'grass', 'flower']) });
      x += rand(110, 260);
    }
    for (let i = 0; i < 6; i++) d.ferns.push({ off: rand(0, 1300), s: rand(.8, 1.5), flip: Math.random() < .5 });
    return d;
  }

  function makeLane(name, idx, imgIdx) {
    return {
      name, idx, imgIdx, color: LANE_COLORS[idx % LANE_COLORS.length],
      x: START_X + rand(0, 26), v: 0,
      base: rand(152, 174),
      p1: rand(0, 7), p2: rand(0, 7), p3: rand(0, 7),
      w1: rand(.35, .6), w2: rand(.8, 1.4), w3: rand(1.6, 2.6),
      nextEventT: rand(1.5, 4),
      action: 'none', actionUntil: 0,
      bubbleText: null, bubbleUntil: 0,
      secondWindDone: false,
      finished: false, place: 0
    };
  }

  function parsedNames() {
    const raw = els.names.value.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    const seen = new Set();
    return raw.filter((n) => { const k = n.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  }

  function updateEntryCount() {
    const n = parsedNames().length;
    els.entryCount.textContent = n > 0 ? `🫎 ${n} moose ready!` : '';
  }

  function startRace() {
    names = parsedNames();
    els.entryError.classList.add('hidden');
    if (names.length < 2) { return showError('Enter at least 2 names!'); }
    if (names.length > MAX_NAMES) { return showError(`Too many moose! Max ${MAX_NAMES}.`); }
    launch();
  }

  function showError(msg) {
    els.entryError.textContent = msg;
    els.entryError.classList.remove('hidden');
  }

  function launch() {
    els.entryScreen.classList.add('hidden');
    els.winnerScreen.classList.add('hidden');
    els.raceScreen.classList.remove('hidden');
    els.countdown.classList.remove('hidden');
    els.countdown.textContent = '';
    els.finishBanner.classList.add('hidden');

    const imgs = assignMooseImages(names.length);
    lanes = names.map((n, i) => makeLane(n, i, imgs[i]));
    decor = genDecor();
    camX = 0;
    raceT = 0;
    winner = null;
    confetti = [];
    particles = [];
    lastLeaderIdx = -1;
    hotLanes = new Set();
    nextBreakawayT = rand(3.5, 6);
    overlayShown = false;
    zoom = 1;
    camPX = canvas.clientWidth / 2;
    camPY = canvas.clientHeight / 2;
    state = 'countdown';
    setCommentary('The moose line up... the forest holds its breath...');
    renderStandings();
    runCountdown();
  }

  function runCountdown() {
    const seq = ['3', '2', '1', 'MOOSE OUT!'];
    let i = 0;
    const step = () => {
      if (state !== 'countdown') return;
      els.countdown.textContent = seq[i];
      els.countdown.classList.remove('tick');
      void els.countdown.offsetWidth;
      els.countdown.classList.add('tick');
      if (i < 3) sfx.tick(); else sfx.go();
      i++;
      if (i < seq.length) {
        setTimeout(step, 800);
      } else {
        setTimeout(() => {
          els.countdown.classList.add('hidden');
          state = 'racing';
          lastFrame = performance.now();
          setCommentary('🏁 AND THEY\'RE OFF!');
        }, 600);
      }
    };
    step();
  }

  let commentaryQueue = [];
  function setCommentary(text) {
    els.commentary.textContent = text;
    els.commentary.classList.remove('pop');
    void els.commentary.offsetWidth;
    els.commentary.classList.add('pop');
  }

  function update(dtRaw) {
    let leader = null;
    let leaderX = 0, secondX = 0;
    for (const l of lanes) {
      if (!l.finished && (!leader || l.x > leader.x)) leader = l;
      if (l.x > leaderX) { secondX = leaderX; leaderX = l.x; } else if (l.x > secondX) secondX = l.x;
    }

    const xs = lanes.map((l) => l.x).sort((a, b) => a - b);
    const medianX = xs[Math.floor(xs.length / 2)];

    const photoFinish = state === 'racing' && leaderX > FINISH_X - 160;
    const top = lanes.filter((l) => !l.finished).sort((a, b) => b.x - a.x).slice(0, 8);
    hotLanes = new Set(lanes.length > 12 ? top.map((l) => l.idx) : lanes.map((l) => l.idx));
    if (winner) hotLanes.add(winner.idx);

    const dt = dtRaw * (photoFinish ? 0.42 : 1);
    raceT += dt;

    let activeBubbles = 0;
    for (const l of lanes) if (l.bubbleUntil > raceT) activeBubbles++;
    const showBubble = (l, text, until) => {
      if (hotLanes.has(l.idx) && activeBubbles < 12) { activeBubbles++; l.bubbleText = text; l.bubbleUntil = until; }
    };

    if (leader && leader.idx !== lastLeaderIdx && raceT > 1.5 && state === 'racing') {
      if (lastLeaderIdx !== -1 && canPlay('lead', 2200)) {
        setCommentary(`🔥 ${leader.name} TAKES THE LEAD!`);
        if (canPlay('cheer', 1800)) sfx.cheer();
        leader.action = 'surge';
        leader.actionUntil = raceT + 0.7;
      }
      lastLeaderIdx = leader.idx;
    }

    if (state === 'racing' && raceT >= nextBreakawayT) {
      nextBreakawayT = raceT + rand(4.5, 8);
      const contenders = lanes.filter((l) => !l.finished && Math.abs(l.x - medianX) < 300 && l.x < FINISH_X - 550);
      if (contenders.length) {
        const l = pick(contenders);
        l.action = 'surge';
        l.actionUntil = raceT + rand(1.2, 1.9);
        showBubble(l, pick(SURGE_BUBBLES), raceT + 1.4);
        setCommentary(`💨 ${l.name} BREAKS AWAY FROM THE HERD!`);
        if (canPlay('cheer', 1800)) sfx.cheer();
      }
    }

    const dustRate = Math.min(1, 40 / lanes.length);
    for (const l of lanes) {
      if (l.finished) { l.v *= 0.98; l.x += l.v * dtRaw; continue; }

      if (state === 'racing' && raceT >= l.nextEventT) {
        l.nextEventT = raceT + rand(1.4, 3.4);
        const nearFinish = l.x > FINISH_X - 450;
        let action = pick(['surge', 'surge', 'surge', 'stumble', 'stumble', 'snack', 'chatter', 'none', 'none']);
        if (nearFinish && (action === 'stumble' || action === 'snack')) action = 'chatter';
        if (action === 'surge') {
          l.action = 'surge'; l.actionUntil = raceT + rand(0.9, 1.6);
          showBubble(l, pick(SURGE_BUBBLES), raceT + 1.1);
          if (canPlay('surge', 500)) sfx.surge();
        } else if (action === 'stumble') {
          l.action = 'stumble'; l.actionUntil = raceT + rand(0.5, 0.9);
          showBubble(l, pick(STUMBLE_BUBBLES), raceT + 0.9);
          if (canPlay('stumble', 450)) sfx.stumble();
        } else if (action === 'snack') {
          l.action = 'snack'; l.actionUntil = raceT + rand(0.8, 1.5);
          showBubble(l, pick(SNACK_BUBBLES), raceT + 1.2);
        } else if (action === 'chatter') {
          showBubble(l, pick(CHATTER_BUBBLES), raceT + 1.3);
        } else {
          l.action = 'none';
        }
      }

      if (!l.secondWindDone && state === 'racing' && l.x / FINISH_X > rand(0.5, 0.8)) {
        l.secondWindDone = true;
        l.action = 'surge';
        l.actionUntil = raceT + rand(1.0, 1.4);
        showBubble(l, 'SECOND WIND!', raceT + 1.4);
      }

      let mult = 1
        + 0.12 * Math.sin(l.w1 * raceT + l.p1)
        + 0.07 * Math.sin(l.w2 * raceT + l.p2)
        + 0.05 * Math.sin(l.w3 * raceT + l.p3);

      if (raceT < l.actionUntil) {
        if (l.action === 'surge') mult *= rand(1.8, 2.05);
        else if (l.action === 'stumble' || l.action === 'snack') mult = 0.02;
      } else if (l.action !== 'none' && raceT >= l.actionUntil) {
        l.action = 'none';
      }

      if (state === 'racing') {
        const gapToHerd = medianX - l.x;
        if (gapToHerd > 90) mult *= 1 + Math.min(0.5, gapToHerd * 0.00045);
        else if (gapToHerd < -90) mult *= Math.max(0.8, 1 + gapToHerd * 0.00022);
        if (gapToHerd > 900) mult *= 1.35;
        if (l.x === leaderX && leaderX - secondX > 350) mult *= 0.88;
        if (l.x > FINISH_X * 0.84) {
          if (l.x === leaderX) mult *= 0.92;
          else mult *= 1 + Math.min(0.45, (leaderX - l.x) * 0.00028);
        }
        if (l.x > FINISH_X - 450) mult *= 1.1;
      } else if (state === 'countdown') {
        mult = 0;
      }

      const target = l.base * mult;
      l.v += (target - l.v) * Math.min(1, dt * 3.2);
      l.x += l.v * dt;

      if (l.v > 55 && Math.random() < dt * l.v * 0.05 * dustRate && particles.length < 320) {
        particles.push({ x: l.x - rand(0, 30), lane: l.idx, age: 0, life: rand(.4, .8), r: rand(3, 8) });
      }

      if (state === 'racing' && !winner && l.x >= FINISH_X) {
        l.finished = true;
        l.place = 1;
        winner = l;
        state = 'finishing';
        l.v = 0;
        l.bubbleText = 'WOOO!!!';
        l.bubbleUntil = raceT + 3.5;
        els.finishBanner.classList.remove('hidden');
        const margin = leaderX - secondX;
        if (margin < 60) {
          setCommentary(`📸 PHOTO FINISH!! ${l.name} wins by a whisker!!`);
          if (canPlay('cheer', 0)) sfx.cheer();
        } else {
          setCommentary(`🏆 ${l.name} CROSSES THE LINE FIRST!!`);
        }
        spawnConfetti();
        setTimeout(showWinner, 2600);
      }
    }

    for (const p of particles) p.age += dtRaw;
    particles = particles.filter((p) => p.age < p.life);

    for (const c of confetti) {
      c.age += dtRaw;
      c.x += c.vx * dtRaw;
      c.y += c.vy * dtRaw;
      c.vy += 220 * dtRaw;
      c.rot += c.vr * dtRaw;
    }
    confetti = confetti.filter((c) => c.age < 4);

    const targetCam = Math.max(0, Math.min(leaderX - canvas.clientWidth * 0.38, FINISH_X - canvas.clientWidth + 260));
    camX += (targetCam - camX) * Math.min(1, dtRaw * 2.2);
  }

  function showWinner() {
    if (!winner) return;
    state = 'done';
    renderStandings();
    els.winnerImg.src = `img/moose${winner.imgIdx + 1}.png`;
    els.winnerName.textContent = winner.name;
    els.winnerSub.textContent = pick(WIN_LINES);
    overlayShown = true;
    els.winnerScreen.classList.remove('hidden');
    spawnConfetti();
    sfx.win();
  }

  function spawnConfetti() {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    for (let i = 0; i < 200; i++) {
      confetti.push({
        x: rand(0, W), y: rand(-H * 0.5, 0), vx: rand(-40, 40), vy: rand(30, 140),
        rot: rand(0, 6), vr: rand(-6, 6), age: 0,
        w: rand(6, 12), h: rand(3, 7),
        color: pick(['#ffd43b', '#ff6b6b', '#4dabf7', '#69db7c', '#da77f2', '#ff922b', '#fff'])
      });
    }
  }

  function renderStandings() {
    const sorted = [...lanes].sort((a, b) => b.x - a.x);
    if (winner) {
      const wi = sorted.indexOf(winner);
      if (wi > 0) { sorted.splice(wi, 1); sorted.unshift(winner); }
    }
    els.standings.innerHTML = '';
    const shown = sorted.slice(0, 15);
    shown.forEach((l, i) => {
      const li = document.createElement('li');
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      li.innerHTML = `<span>${medal}</span><span class="swatch" style="background:${l.color}"></span><span></span>`;
      li.children[2].textContent = l.name;
      if (i === 0 && lanes.length > 1) li.classList.add('me-leader');
      els.standings.appendChild(li);
    });
    if (sorted.length > 15) {
      const li = document.createElement('li');
      li.style.opacity = '.6';
      li.textContent = `…and ${sorted.length - 15} more moose`;
      els.standings.appendChild(li);
    }
  }

  function layout() {
    const H = canvas.clientHeight, N = lanes.length;
    const horizonY = H * 0.40;
    const laneTop = horizonY + H * 0.07;
    const laneBottom = H - 6;
    const spacing = (laneBottom - laneTop) / N;
    const mooseH = Math.max(Math.min(64, H * 0.13), Math.min(spacing * 2.35, H * 0.32, 170));
    return { H, horizonY, laneTop, laneBottom, spacing, mooseH };
  }

  function baselineY(i, L) { return L.laneTop + (i + 0.62) * L.spacing; }

  function draw() {
    const ctx = canvas.getContext('2d');
    const W = canvas.clientWidth, H = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    const L = layout();
    let zT = 1, pxT = W / 2, pyT = H / 2, sxT = W / 2, syT = H / 2;
    if (winner && (state === 'finishing' || state === 'done')) {
      sxT = winner.x - camX;
      syT = baselineY(winner.idx, L) - L.mooseH * 0.42;
      if (overlayShown) { zT = 2.4; pxT = W * 0.23; pyT = H * 0.55; }
      else { zT = 2.75; pxT = W * 0.5; pyT = H * 0.55; }
    }
    zoom += (zT - zoom) * 0.06;
    camPX += (pxT - camPX) * 0.06;
    camPY += (pyT - camPY) * 0.06;
    if (zT === 1 && zoom < 1.002) zoom = 1;
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * (camPX - sxT * zoom), dpr * (camPY - syT * zoom));
    const vl = sxT - camPX / zoom;
    const vr = sxT + (W - camPX) / zoom;
    const vt = syT - camPY / zoom;
    const vb = syT + (H - camPY) / zoom;

    const sky = ctx.createLinearGradient(0, 0, 0, L.horizonY);
    sky.addColorStop(0, '#79c7ec');
    sky.addColorStop(1, '#cdeef5');
    ctx.fillStyle = sky;
    ctx.fillRect(vl, Math.min(0, vt) - 4, vr - vl + 4, L.horizonY + 6 - Math.min(0, vt));

    drawSun(ctx, W);
    drawParallax(ctx, decor.clouds, 0.08, 2600, (x, o) => drawCloud(ctx, x, o.y, o.s));
    drawParallax(ctx, decor.mountains, 0.16, 1400, (x, o) => drawHill(ctx, x, L.horizonY, o.s));
    drawParallax(ctx, decor.midTrees, 0.38, 900, (x, o) => drawPine(ctx, x, L.horizonY + 4, o.s, '#3f6f4f'));
    drawParallax(ctx, decor.nearTrees, 0.62, 1000, (x, o) => o.birch ? drawBirch(ctx, x, L.horizonY + 10, o.s) : drawPine(ctx, x, L.horizonY + 10, o.s, '#2b5537'));

    ctx.fillStyle = '#4e8f4e';
    ctx.fillRect(vl - 2, L.horizonY, vr - vl + 4, L.laneTop - L.horizonY + 12);
    ctx.fillStyle = '#a8794a';
    ctx.fillRect(vl - 2, L.laneTop + 8, vr - vl + 4, Math.max(H, vb) - L.laneTop - 8);
    ctx.fillStyle = '#8a6238';
    ctx.fillRect(vl - 2, L.laneTop + 8, vr - vl + 4, 5);
    ctx.fillStyle = '#b98a55';
    for (let i = 0; i < 60; i++) {
      const gx = ((i * 231 + 137) % (W + 120)) - 60 - ((camX * 1) % 120);
      ctx.globalAlpha = .25;
      ctx.beginPath();
      ctx.ellipse(gx, L.laneTop + 30 + ((i * 97) % (H - L.laneTop - 40)), 16, 4, 0, 0, 7);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    for (const d of decor.pathDecor) {
      const sx = d.x - camX;
      if (sx < -60 || sx > W + 60) continue;
      drawWorldDecor(ctx, sx, d, L);
    }

    drawBanner(ctx, START_X - camX, 'START', '#1971c2', L, H);
    drawBanner(ctx, FINISH_X - camX, 'FINISH', '#c92a2a', L, H, true);

    ctx.fillStyle = 'rgba(160,130,90,.55)';
    for (const p of particles) {
      const lane = lanes[p.lane];
      if (!lane) continue;
      ctx.globalAlpha = Math.max(0, 1 - p.age / p.life) * .6;
      ctx.beginPath();
      ctx.arc(p.x - camX - p.age * 60, baselineY(p.lane, L) - 4 + ((p.lane * 7) % 5), p.r * (1 + p.age), 0, 7);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (let i = 0; i < lanes.length; i++) drawMoose(ctx, lanes[i], i, L);

    drawParallax(ctx, decor.ferns, 1.14, 1300, (x, o) => drawFern(ctx, x, H, o));

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const c of confetti) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
      ctx.restore();
    }
  }

  function drawParallax(ctx, items, par, period, fn) {
    const base = camX * par + (par > 1 ? 0 : 0);
    const W = canvas.clientWidth;
    const first = Math.floor((base - 250) / period);
    const last = Math.ceil((base + W + 250) / period);
    for (let i = first; i <= last; i++) {
      for (const o of items) fn(i * period + o.off - base, o);
    }
  }

  function drawSun(ctx, W) {
    const x = W * 0.12, y = 74, r = 34;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(raceT * 0.1);
    ctx.strokeStyle = 'rgba(255,220,90,.8)';
    ctx.lineWidth = 4;
    for (let i = 0; i < 10; i++) {
      ctx.rotate(Math.PI / 5);
      ctx.beginPath();
      ctx.moveTo(r + 6, 0);
      ctx.lineTo(r + 18, 0);
      ctx.stroke();
    }
    ctx.restore();
    const g = ctx.createRadialGradient(x, y, 4, x, y, r);
    g.addColorStop(0, '#fff6bf');
    g.addColorStop(1, '#ffd43b');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 7);
    ctx.fill();
  }

  function drawCloud(ctx, x, y, s) {
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.beginPath();
    ctx.arc(x, y, 20 * s, 0, 7);
    ctx.arc(x + 24 * s, y - 8 * s, 16 * s, 0, 7);
    ctx.arc(x + 46 * s, y, 18 * s, 0, 7);
    ctx.arc(x + 22 * s, y + 6 * s, 15 * s, 0, 7);
    ctx.fill();
  }

  function drawHill(ctx, x, baseY, s) {
    ctx.fillStyle = '#93bda0';
    ctx.beginPath();
    ctx.moveTo(x - 220 * s, baseY);
    ctx.quadraticCurveTo(x - 60 * s, baseY - 150 * s, x + 40 * s, baseY - 90 * s);
    ctx.quadraticCurveTo(x + 140 * s, baseY - 40 * s, x + 260 * s, baseY);
    ctx.closePath();
    ctx.fill();
  }

  function drawPine(ctx, x, baseY, s, color) {
    ctx.fillStyle = '#5b4331';
    ctx.fillRect(x - 5 * s, baseY - 26 * s, 10 * s, 26 * s);
    ctx.fillStyle = color;
    for (let k = 0; k < 3; k++) {
      const w = (46 - k * 10) * s, yTop = baseY - (30 + k * 34) * s, yBot = baseY - (8 + k * 30) * s;
      ctx.beginPath();
      ctx.moveTo(x, yTop);
      ctx.lineTo(x - w, yBot);
      ctx.lineTo(x + w, yBot);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawBirch(ctx, x, baseY, s) {
    ctx.fillStyle = '#e8e3d8';
    ctx.fillRect(x - 4 * s, baseY - 70 * s, 8 * s, 70 * s);
    ctx.fillStyle = '#5c6e52';
    ctx.beginPath();
    ctx.arc(x, baseY - 84 * s, 30 * s, 0, 7);
    ctx.arc(x - 22 * s, baseY - 68 * s, 20 * s, 0, 7);
    ctx.arc(x + 22 * s, baseY - 68 * s, 20 * s, 0, 7);
    ctx.fill();
  }

  function drawWorldDecor(ctx, sx, d, L) {
    const y = L.laneTop + 4;
    if (d.type === 'flower') {
      ctx.strokeStyle = '#3f7a3f';
      ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx, y - 10); ctx.stroke();
      ctx.fillStyle = pick2(sx, ['#ff6b6b', '#ffd43b', '#da77f2', '#fff']);
      ctx.beginPath(); ctx.arc(sx, y - 13, 4, 0, 7); ctx.fill();
    } else if (d.type === 'mushroom') {
      ctx.fillStyle = '#f1f0ea'; ctx.fillRect(sx - 2, y - 8, 4, 8);
      ctx.fillStyle = '#e03131';
      ctx.beginPath(); ctx.arc(sx, y - 8, 7, Math.PI, 0); ctx.fill();
    } else if (d.type === 'rock') {
      ctx.fillStyle = '#8b8b8b';
      ctx.beginPath(); ctx.ellipse(sx, y - 3, 9, 6, 0, 0, 7); ctx.fill();
    } else if (d.type === 'stump') {
      ctx.fillStyle = '#6b4a2b'; ctx.fillRect(sx - 8, y - 12, 16, 12);
      ctx.fillStyle = '#b98a55';
      ctx.beginPath(); ctx.ellipse(sx, y - 12, 8, 3, 0, 0, 7); ctx.fill();
    } else {
      ctx.strokeStyle = '#3f7a3f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, y); ctx.lineTo(sx - 4, y - 9);
      ctx.moveTo(sx, y); ctx.lineTo(sx, y - 11);
      ctx.moveTo(sx, y); ctx.lineTo(sx + 4, y - 9);
      ctx.stroke();
    }
  }

  const pickCache = {};
  function pick2(seed, arr) { return arr[Math.abs(Math.floor(seed)) % arr.length]; }

  function drawBanner(ctx, sx, text, color, L, H, checkered) {
    if (sx < -120 || sx > canvas.clientWidth + 120) return;
    ctx.fillStyle = '#5b4331';
    ctx.fillRect(sx - 74, L.horizonY - 40, 8, H - L.horizonY + 40);
    ctx.fillRect(sx + 66, L.horizonY - 40, 8, H - L.horizonY + 40);
    ctx.fillStyle = color;
    ctx.fillRect(sx - 78, L.horizonY - 44, 156, 34);
    if (checkered) {
      for (let i = 0; i < 9; i++) for (let j = 0; j < 2; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillStyle = '#111';
          ctx.fillRect(sx - 78 + i * 17, L.horizonY - 44 + j * 17, 17, 17);
        }
      }
      ctx.fillStyle = '#fff';
    }
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, sx, L.horizonY - 20);
  }

  function drawMoose(ctx, l, i, L) {
    const sx = l.x - camX;
    const W = canvas.clientWidth;
    const mooseH = L.mooseH;
    const im = mooseImgs[l.imgIdx];
    const aspect = im && im.naturalWidth ? im.naturalWidth / im.naturalHeight : 1.9;
    const mw = mooseH * aspect;
    const by = baselineY(i, L);

    if (sx < -mw - 40 || sx > W + 40) return;

    const celebrating = (state === 'finishing' || state === 'done') && winner === l;
    const running = l.v > 8 && (state === 'racing' || state === 'finishing') && !celebrating;
    const gait = running ? Math.sin(raceT * 12 + l.p1) : 0;
    const bob = running ? -Math.abs(Math.sin(raceT * 12 + l.p1)) * mooseH * 0.06 : 0;
    const celebrateBounce = celebrating ? -Math.abs(Math.sin(raceT * 5.5)) * mooseH * 0.55 : 0;
    const stumbling = !celebrating && l.action === 'stumble' && raceT < l.actionUntil;
    const surging = l.action === 'surge' && raceT < l.actionUntil;
    const lean = celebrating ? Math.sin(raceT * 4) * 0.07 : (stumbling ? -0.22 : gait * 0.03 + (surging ? 0.07 : 0));
    const squash = celebrating ? 1 + 0.07 * Math.abs(Math.sin(raceT * 5.5)) : 1 + 0.03 * Math.cos(raceT * 12 + l.p1);

    ctx.save();
    ctx.translate(sx, by + bob + celebrateBounce);
    ctx.rotate(lean);
    if (surging) ctx.scale(1.05, 0.98);

    if (surging) {
      ctx.strokeStyle = 'rgba(255,255,255,.65)';
      ctx.lineWidth = 3;
      for (let k = 0; k < 3; k++) {
        const ly = -mooseH * (0.25 + k * 0.28);
        ctx.beginPath();
        ctx.moveTo(-mw * 0.55, ly);
        ctx.lineTo(-mw * 0.55 - 26, ly);
        ctx.stroke();
      }
    }

    ctx.fillStyle = `rgba(0,0,0,${lanes.length > 40 ? 0.05 : 0.18})`;
    ctx.beginPath();
    ctx.ellipse(0, 2, mw * 0.36, 7, 0, 0, 7);
    ctx.fill();

    if (im && im.complete && im.naturalWidth > 0) {
      const sKey = l.imgIdx + '|' + Math.round(mooseH);
      let spr = spriteCache.get(sKey);
      if (!spr) {
        spr = document.createElement('canvas');
        spr.width = Math.max(1, Math.round(mw));
        spr.height = Math.max(1, Math.round(mooseH));
        spr.getContext('2d').drawImage(im, 0, 0, spr.width, spr.height);
        spriteCache.set(sKey, spr);
      }
      ctx.save();
      ctx.scale(squash, 2 - squash);
      ctx.drawImage(spr, -mw / 2, -mooseH);
      ctx.restore();
    } else {
      ctx.font = `${mooseH * 0.8}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText('🫎', 0, -mooseH * 0.1);
    }

    if (stumbling && mooseH > 20) {
      ctx.fillStyle = '#ffd43b';
      ctx.strokeStyle = '#b0810a';
      for (let k = 0; k < 3; k++) {
        const a = raceT * 6 + k * 2.1;
        const rx = Math.cos(a) * mw * 0.3;
        const ry = -mooseH - 10 + Math.sin(a) * 8;
        ctx.beginPath();
        ctx.arc(rx, ry, 4, 0, 7);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();

    const chipY = by + bob - mooseH - 16;
    if (hotLanes.has(l.idx) && mooseH > 14) {
      ctx.font = 'bold 15px "Comic Sans MS", "Comic Sans", sans-serif';
      const tw = ctx.measureText(l.name).width;
      const cw = tw + 20;
      const cx = sx - cw / 2;
      ctx.fillStyle = 'rgba(253,246,227,.94)';
      roundRect(ctx, cx, chipY - 13, cw, 22, 11);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = l.color;
      roundRect(ctx, cx, chipY - 13, cw, 22, 11);
      ctx.stroke();
      ctx.fillStyle = '#23301f';
      ctx.textAlign = 'center';
      ctx.fillText(l.name, sx, chipY + 3);
    }

    if (l.bubbleText && raceT < l.bubbleUntil && hotLanes.has(l.idx)) {
      ctx.font = 'bold 16px "Comic Sans MS", "Comic Sans", sans-serif';
      const bw = ctx.measureText(l.bubbleText).width + 20;
      const bx = sx - bw / 2, byy = chipY - 40;
      ctx.fillStyle = '#fff';
      roundRect(ctx, bx, byy, bw, 26, 10);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      roundRect(ctx, bx, byy, bw, 26, 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx - 5, byy + 26);
      ctx.lineTo(sx + 6, byy + 26);
      ctx.lineTo(sx, byy + 34);
      ctx.closePath();
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#23301f';
      ctx.textAlign = 'center';
      ctx.fillText(l.bubbleText, sx, byy + 18);
    }
  }

  function drawFern(ctx, x, H, o) {
    ctx.save();
    ctx.translate(x, H);
    if (o.flip) ctx.scale(-1, 1);
    ctx.fillStyle = '#1c3a24';
    ctx.beginPath();
    ctx.moveTo(-10, 10);
    ctx.quadraticCurveTo(-30 * o.s, -50 * o.s, 5 * o.s, -80 * o.s);
    ctx.quadraticCurveTo(18 * o.s, -40 * o.s, 30, 10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, 10);
    ctx.quadraticCurveTo(50 * o.s, -40 * o.s, 70 * o.s, -55 * o.s);
    ctx.quadraticCurveTo(55 * o.s, -20 * o.s, 50, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function loop(now) {
    if (state === 'racing' || state === 'finishing') {
      const dt = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;
      if (dt > 0) update(dt);
    } else if (state === 'countdown') {
      lastFrame = now;
      raceT += 0.016;
    } else if (state === 'done') {
      const dt = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;
      raceT += dt;
      for (const c of confetti) {
        c.age += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 220 * dt; c.rot += c.vr * dt;
      }
      confetti = confetti.filter((c) => c.age < 4);
    }
    if (lanes.length) draw();
    requestAnimationFrame(loop);
  }

  let standingsTimer = 0;
  setInterval(() => {
    if (state === 'racing' && lanes.length) renderStandings();
  }, 400);

  els.startBtn.addEventListener('click', () => { ac(); startRace(); });
  els.names.addEventListener('input', updateEntryCount);
  els.demoBtn.addEventListener('click', () => {
    els.names.value = pick([
      () => ROS1_LATE.join('\n'),
      () => ROS2_LATE.join('\n'),
      () => [...ROS1_LATE, ...ROS2_LATE].join('\n'),
      () => stampedeNames(500)
    ])();
    updateEntryCount();
  });
  els.rerunBtn.addEventListener('click', launch);
  els.editBtn.addEventListener('click', () => {
    state = 'idle';
    els.winnerScreen.classList.add('hidden');
    els.raceScreen.classList.add('hidden');
    els.entryScreen.classList.remove('hidden');
  });
  els.muteBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    els.muteBtn.textContent = soundOn ? '🔊' : '🔇';
  });

  requestAnimationFrame(loop);
})();
