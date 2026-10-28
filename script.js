const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const MODELS = {
  openai: ['gpt-4o (recommended)', 'gpt-4o-mini', 'o3-mini'],
  anthropic: ['claude-sonnet (recommended)', 'claude-haiku', 'claude-opus'],
  google: ['gemini-1.5-pro (recommended)', 'gemini-1.5-flash'],
  more: ['Browse more providers...']
};

const state = { mode: 'auto', provider: 'openai', depth: 'balanced' };

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.id);
  toast.id = setTimeout(() => t.classList.remove('show'), 2200);
}

// Top navigation
$('#nav').addEventListener('click', e => {
  const a = e.target.closest('a');
  if (!a) return;
  e.preventDefault();
  $$('#nav a').forEach(x => x.classList.toggle('active', x === a));
});

// Character counter
const idea = $('#idea');
idea.addEventListener('input', () => {
  $('#count').textContent = `${idea.value.length}/2000`;
});

// Provider + model
function renderModels() {
  $('#model').innerHTML = MODELS[state.provider].map(m => `<option>${m}</option>`).join('');
}
$('#providers').addEventListener('click', e => {
  const b = e.target.closest('.prov');
  if (!b) return;
  state.provider = b.dataset.p;
  $$('.prov').forEach(x => x.classList.toggle('active', x === b));
  renderModels();
  setMode('manual');
});
renderModels();

// AI selection mode (auto vs manual)
function setMode(m) {
  state.mode = m;
  $('#autoCard').classList.toggle('selected', m === 'auto');
  $('#manualCard').classList.toggle('selected', m === 'manual');
}
$('#autoCard').addEventListener('click', () => setMode('auto'));
$('#manualCard').addEventListener('click', () => setMode('manual'));
$('#autoCard').addEventListener('keydown', e => { if (e.key === 'Enter') setMode('auto'); });
setMode('auto');

$('#changeKey').addEventListener('click', e => {
  e.preventDefault();
  e.stopPropagation();
  const key = prompt('Enter your API key');
  if (key) toast('API key updated');
});

// Depth selector
$('#depth').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  state.depth = b.dataset.d;
  $$('#depth button').forEach(x => x.classList.toggle('active', x === b));
});

// Templates
$('#templates').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  idea.value = 'Build ' + b.dataset.t + '.';
  idea.dispatchEvent(new Event('input'));
  idea.focus();
});

// Improve My Prompt (replace the fake step below with your real API call)
$('#improve').addEventListener('click', async () => {
  const text = idea.value.trim();
  if (!text) { toast('Describe your idea first'); idea.focus(); return; }
  const btn = $('#improve');
  btn.disabled = true;
  btn.textContent = 'Improving...';
  const payload = { idea: text, ...state, model: $('#model').value };
  console.log('Send to your backend:', payload);
  await new Promise(r => setTimeout(r, 1200)); // placeholder for fetch('/api/improve', ...)
  idea.value = `Create a production-ready app: ${text}\n\nInclude: user flows, data model, key screens, and tech stack.`;
  idea.dispatchEvent(new Event('input'));
  btn.disabled = false;
  btn.textContent = 'Improve My Prompt →';
  toast('Prompt improved');
});
document.querySelectorAll('.panel').forEach(p => p.addEventListener('mousemove', e => {
  const r = p.getBoundingClientRect();
  p.style.setProperty('--x', e.clientX - r.left + 'px');
  p.style.setProperty('--y', e.clientY - r.top + 'px');
}));
const c = document.createElement('canvas');
c.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none';
document.body.prepend(c);
const g = c.getContext('2d'); let W, H;
const size = () => { W = c.width = innerWidth; H = c.height = innerHeight; };
size(); addEventListener('resize', size);
const P = Array.from({length: 70}, () => ({x: Math.random()*innerWidth, y: Math.random()*innerHeight,
  vx: (Math.random()-.5)*.4, vy: (Math.random()-.5)*.4}));
let mx = -999, my = -999;
addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
(function loop(){
  g.clearRect(0, 0, W, H);
  for (const p of P) {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > W) p.vx *= -1;
    if (p.y < 0 || p.y > H) p.vy *= -1;
    g.fillStyle = 'rgba(200,245,28,.7)'; g.fillRect(p.x, p.y, 2, 2);
    for (const q of P) {
      const d = Math.hypot(p.x-q.x, p.y-q.y);
      if (d < 110) {
        g.strokeStyle = `rgba(47,123,255,${.25*(1-d/110)})`;
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke();
      }
    }
    if (Math.hypot(p.x-mx, p.y-my) < 160) { p.x += (p.x-mx)*.01; p.y += (p.y-my)*.01; }
  }
  requestAnimationFrame(loop);
})();
const em = document.querySelector('h1 em'), final = em.textContent, sym = '!<>-_\\/[]{}=+*^?#';
let f = 0;
const t = setInterval(() => {
  em.textContent = final.split('').map((ch, i) => i < f/2 ? ch : ch === ' ' ? ' ' : sym[Math.random()*sym.length|0]).join('');
  if (++f > final.length*2 + 2) { em.textContent = final; clearInterval(t); }
}, 30);
const cta = document.querySelector('#improve');
cta.addEventListener('mousemove', e => {
  const r = cta.getBoundingClientRect();
  cta.style.transform = `translate(${(e.clientX-r.left-r.width/2)*.25}px,${(e.clientY-r.top-r.height/2)*.35}px)`;
});
cta.addEventListener('mouseleave', () => cta.style.transform = '');
const ideas = ['a food delivery app for my college canteen', 'a Docker monitoring dashboard', 'a portfolio site with 3D animations'];
let i = 0, j = 0, del = false;
(function type(){
  if (document.activeElement !== idea && !idea.value) {
    const s = ideas[i];
    j += del ? -1 : 1;
    idea.placeholder = s.slice(0, j) + '|';
    if (!del && j === s.length) { del = true; return setTimeout(type, 1400); }
    if (del && j === 0) { del = false; i = (i + 1) % ideas.length; }
  }
  setTimeout(type, del ? 30 : 60);
})();
(() => {
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const c = document.createElement('canvas');
  c.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none';
  document.body.prepend(c);
  const g = c.getContext('2d');
  let W, H, t = 0;
  const m = { x: -9999, y: -9999, down: 0 };

  const resize = () => {
    W = c.width = innerWidth; H = c.height = innerHeight;
    g.fillStyle = '#02050f'; g.fillRect(0, 0, W, H);
  };
  resize();
  addEventListener('resize', resize);
  addEventListener('mousemove', e => { m.x = e.clientX; m.y = e.clientY; });
  addEventListener('mousedown', () => m.down = 1);
  addEventListener('mouseup', () => m.down = 0);

  const P = Array.from({ length: 650 }, () => ({
    x: Math.random() * innerWidth, y: Math.random() * innerHeight,
    vx: 0, vy: 0, lime: Math.random() < .35
  }));

  (function frame() {
    t += .003;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgba(2,5,15,.09)';          // fading layer = light trails
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';    // additive glow

    for (const p of P) {
      // flowing current
      const a = (Math.sin(p.x * .004 + t * 2) + Math.cos(p.y * .005 - t)) * Math.PI;
      p.vx += Math.cos(a) * .05;
      p.vy += Math.sin(a) * .05;

      // mouse: push away + swirl (click = pull in)
      const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy) || 1;
      if (d < 220) {
        const f = (1 - d / 220) * .35, s = m.down ? -1 : 1;
        p.vx += (dx / d * s * 1.2 - dy / d * 1.6) * f;
        p.vy += (dy / d * s * 1.2 + dx / d * 1.6) * f;
      }

      p.vx *= .95; p.vy *= .95;
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

      const sp = Math.min(Math.hypot(p.vx, p.vy) / 3, 1);   // faster = brighter
      g.fillStyle = p.lime ? `rgba(200,245,28,${.25 + sp * .6})` : `rgba(47,123,255,${.25 + sp * .6})`;
      const s2 = 1.6 + sp * 1.5;
      g.fillRect(p.x, p.y, s2, s2);
    }
    requestAnimationFrame(frame);
  })();
})();
const pupils = document.querySelectorAll('.pupil');
addEventListener('mousemove', e => {
  pupils.forEach(p => {
    const r = p.parentElement.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const a = Math.atan2(e.clientY - cy, e.clientX - cx);
    const d = Math.min(14, Math.hypot(e.clientX - cx, e.clientY - cy) / 12);
    p.style.transform = `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px)`;
  });
});

