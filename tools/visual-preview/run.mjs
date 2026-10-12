#!/usr/bin/env node
// Visual preview runner (DeviceTests only).
//   node tools/visual-preview/run.mjs <scenarios.json> [--only id1,id2] [--account autor]
//   node tools/visual-preview/run.mjs --extract <mockup.html> <outdir>   (one PNG per .phone of a mockup page)
// Renders real app screens in WebKit at 402 × 874 pt with live GET responses from the DeviceTests API (127.0.0.1:5099).
// Writes are refused by the preview client. Output goes to tools/visual-preview/out/ (git-ignored).
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)), out = path.join(here, 'out'), bin = path.join(out, 'bin');
const apiDir = process.env.MEEPLE_API_DIR || path.resolve(here, '../../../MeepleBoardApi');
const base = 'http://127.0.0.1:5099';
const args = process.argv.slice(2), flag = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
fs.mkdirSync(bin, { recursive: true });
for (const tool of ['shot', 'phones', 'sheet']) {
  const exe = path.join(bin, tool), src = path.join(here, tool + '.swift');
  if (!fs.existsSync(exe) || fs.statSync(exe).mtimeMs < fs.statSync(src).mtimeMs) execFileSync('swiftc', ['-O', src, '-o', exe], { stdio: 'inherit' });
}
if (args[0] === '--extract') {
  fs.mkdirSync(path.resolve(args[2]), { recursive: true });
  execFileSync(path.join(bin, 'phones'), [path.resolve(args[1]), path.resolve(args[2])], { stdio: 'inherit' });
  process.exit(0);
}
const health = await (await fetch(base + '/device-test/health')).json();
if (health.environment !== 'DeviceTests' || health.database !== 'MeepleBoard_DeviceTests' || health.externalDelivery !== false) throw new Error('API on 5099 is not the DeviceTests environment');
const accounts = JSON.parse(fs.readFileSync(path.join(apiDir, '.device-tests/accounts.json'), 'utf8'));
const account = accounts.find(a => a.Email === `${flag('--account') || 'autor'}@meepleboard.test`);
const login = await fetch(base + '/MeepleBoard/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: account.Email, password: account.Password, deviceInfo: 'MeepleBoard Visual Preview' }) });
if (!login.ok) throw new Error('Login failed: ' + login.status);
const { token } = await login.json();
fs.writeFileSync(path.join(out, 'session.js'), `window.__session=${JSON.stringify({ token, apiBase: base + '/MeepleBoard', friends: Object.fromEntries(accounts.map(a => [a.Email.split('@')[0], a.Id])) })};`);
execFileSync(process.execPath, [path.join(here, 'bundle.cjs')], { stdio: 'inherit' });
// Real IDs for detail routes, resolved read-only and substituted as {{name}} in the scenario file.
const get = async route => { const r = await fetch(base + '/MeepleBoard' + route, { headers: { Authorization: `Bearer ${token}` } }); return r.ok ? r.json() : null; };
const recent = (await get('/statistics/me/matches?start=2020-01-01&endExclusive=2029-01-01&timeZone=Europe%2FLisbon&metric=all&offset=0&limit=1'))?.items?.[0], sessions = await get('/session/mine') || [], campaigns = await get('/campaigns/mine') || [];
const vars = { ...Object.fromEntries(accounts.map(a => [`user:${a.Email.split('@')[0]}`, a.Id])), match: recent?.id ?? '', game: recent?.gameId ?? '',
  session: sessions[0]?.id ?? '', activeSession: (sessions.find(s => /active|ongoing|progress/i.test(String(s.status))) ?? sessions[0])?.id ?? '', upcomingSession: sessions.find(s => s.status === 'Upcoming')?.id ?? '', campaign: campaigns[0]?.id ?? '' };
const file = path.resolve(args[0]);
const text = fs.readFileSync(file, 'utf8');
// {{game:Name}}: a game's ID by exact name (GET /game/search).
for (const [, name] of text.matchAll(/\{\{game:([^}]+)\}\}/g)) vars[`game:${name}`] ??= (await get('/game/search?name=' + encodeURIComponent(name)))?.id ?? '';
const spec = JSON.parse(text.replace(/\{\{([^}]+)\}\}/g, (_, k) => vars[k] ?? ''));
const only = flag('--only')?.split(',');
const dest = path.join(out, spec.name || path.basename(file, '.json'));
fs.mkdirSync(dest, { recursive: true });
const summary = [];
for (const s of spec.screens.filter(s => !only || only.includes(s.id))) {
  const scenario = { ...(spec.defaults || {}), ...s };
  const png = path.join(dest, s.id + '.png');
  try { execFileSync(path.join(bin, 'shot'), [path.join(here, 'harness.html'), JSON.stringify(scenario), png], { stdio: 'ignore', timeout: 60000 }); }
  catch { console.log(`✗ ${s.id}: capture failed`); continue; }
  const r = JSON.parse(fs.readFileSync(png + '.json', 'utf8')), m = r.m || {};
  const issues = [r.e && `error: ${r.e.split('\n')[0]}`, m.small?.length && `${m.small.length} toques < 44: ${m.small.slice(0, 4).map(x => `${x.label || '?'} ${x.w}×${x.h}`).join('; ')}`, m.overflow?.length && `transborda: ${m.overflow.slice(0, 3).join('; ')}`, m.missingIcons?.length && `ícones: ${m.missingIcons.join(',')}`, m.blockedWrites?.length && `escritas recusadas: ${m.blockedWrites.join(',')}`, m.unresolved?.length && `rotas sem ecrã: ${JSON.stringify(m.unresolved)}`].filter(Boolean);
  summary.push({ id: s.id, pathname: m.pathname, issues, requests: m.requests?.length || 0 });
  console.log(`${issues.length ? '•' : '✓'} ${s.id} (${m.pathname}, ${m.requests?.length || 0} pedidos GET)${issues.length ? '\n    ' + issues.join('\n    ') : ''}`);
}
fs.writeFileSync(path.join(dest, 'summary.json'), JSON.stringify(summary, null, 1));
console.log(`\n${summary.length} capturas em ${path.relative(process.cwd(), dest)}`);
