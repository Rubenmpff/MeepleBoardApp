#!/usr/bin/env node
// Side-by-side comparison page from a JSON spec.
//   node tools/visual-preview/compare.mjs spec.json
// spec: { "title", "out": "docs/.../comparacao.html", "left": {"label","dir"}, "right": {"label","dir"},
//         "pairs": [{ "title", "left": "file.png", "right": "file.png", "note": "html" }] }
// Images are copied as JPEG next to the page (folders "a/" and "b/"), so the page is self-contained in the repo.
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = path.resolve(spec.out), dir = path.dirname(out);
const copy = (src, sub) => { if (!src) return ''; const name = path.basename(src).replace(/\.png$/, '.jpg'); fs.mkdirSync(path.join(dir, sub), { recursive: true });
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '82', path.resolve(spec[sub === 'a' ? 'left' : 'right'].dir, src), '--out', path.join(dir, sub, name)], { stdio: 'ignore' }); return `${sub}/${name}`; };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const rows = spec.pairs.map(p => { const a = copy(p.left, 'a'), b = copy(p.right, 'b');
  return `<div class="pair"><figure>${a ? `<span>${esc(spec.left.label)}</span><img src="${a}" alt="${esc(spec.left.label)}: ${esc(p.title)}">` : ''}</figure><figure>${b ? `<span>${esc(spec.right.label)}</span><img src="${b}" alt="${esc(spec.right.label)}: ${esc(p.title)}">` : ''}</figure><div class="note"><h3>${esc(p.title)}</h3>${p.note || ''}</div></div>`; }).join('\n');
fs.writeFileSync(out, `<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(spec.title)}</title><style>
:root{--bg:#F3F1F5;--ink:#2A2433;--muted:#5E6570;--line:#E2DDE7}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#17141B;--ink:#ECE8F0;--muted:#A9A3B2;--line:#37303F}}
:root[data-theme="dark"]{--bg:#17141B;--ink:#ECE8F0;--muted:#A9A3B2;--line:#37303F}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:0 16px 64px}.doc{max-width:1180px;margin:0 auto}h1{font-size:30px;margin:36px 0 8px}
.pair{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(200px,280px);gap:20px;margin:28px 0;align-items:start}figure{margin:0;display:flex;flex-direction:column;gap:6px}
figure span{font-size:13px;font-weight:600;color:var(--muted)}img{width:100%;max-width:402px;border-radius:22px;border:1px solid var(--line)}.note p,.note li{font-size:15px}
@media (max-width:820px){.pair{grid-template-columns:1fr 1fr}.note{grid-column:1/-1}}@media (max-width:520px){.pair{grid-template-columns:1fr}}</style></head>
<body><div class="doc"><h1>${esc(spec.title)}</h1>${spec.intro || ''}${rows}</div></body></html>`);
console.log('Comparação escrita em', path.relative(process.cwd(), out));
