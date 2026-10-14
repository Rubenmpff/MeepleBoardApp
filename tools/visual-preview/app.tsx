// Preview entry: renders an app route (with its Expo Router layouts) at 402 × 874 pt, runs scenario steps and records metrics.
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import i18next from 'i18next';
import routes from '__routes';
import { RouteChild } from './mocks';
const W = window as any;
const sc = JSON.parse(decodeURIComponent(location.hash.slice(1) || '{}'));
W.__fontScale = sc.fontScale || 1;
require('@/src/i18n');
i18next.changeLanguage(sc.lang || 'pt');
const { store } = require('@/src/store/store');
const { setToken } = require('@/src/features/auth/store/authSlice');
if (W.__session?.token) store.dispatch(setToken(W.__session.token));

type Row = [string, string, boolean, () => any];
// Static segments win over dynamic ones, as in Expo Router (/sessions/create before /sessions/[id]).
const table = [...(routes as Row[])].sort((a, b) => (a[1].match(/\[/g)?.length || 0) - (b[1].match(/\[/g)?.length || 0));
const strip = (p: string) => '/' + p.split('/').filter(s => s && !/^\(.*\)$/.test(s)).join('/');
function resolve(target: any) {
  const raw = typeof target === 'string' ? target : target?.pathname;
  if (!raw) return null;
  const [pathOnly, query] = raw.split('?');
  const params: Record<string, string> = { ...(typeof target === 'object' ? target.params : {}) };
  new URLSearchParams(query || '').forEach((v, k) => { params[k] = v; });
  const wanted = strip(pathOnly).replace(/\/$/, '') || '/';
  const parts = wanted.split('/');
  for (const [rel, pattern, layout] of table) {
    if (layout) continue;
    const pp = pattern.split('/');
    if (pp.length !== parts.length) continue;
    const found: Record<string, string> = {};
    const ok = pp.every((seg, i) => { const m = seg.match(/^\[(.+)\]$/); if (m) { if (parts[i] !== seg) found[m[1]] = parts[i]; return true; } return seg === parts[i]; });
    if (!ok) continue;
    const dir = rel.split('/').slice(0, -1).join('/');
    const layouts = table.filter(([r, , l]) => l && (dir + '/').startsWith(r.split('/').slice(0, -1).join('/') + '/')).sort((a, b) => a[0].split('/').length - b[0].split('/').length);
    return { rel, pathname: wanted, params: { ...params, ...found }, layouts };
  }
  return null;
}
const tabsRoot = '(app)/(tabs)/';
W.__tabNames = [...new Set(table.filter(([r]) => r.startsWith(tabsRoot)).map(([r]) => r.slice(tabsRoot.length).split('/')[0]).filter(s => /^\(.*\)$/.test(s)))];

function Root() {
  const first = resolve({ pathname: sc.route || '/statistics', params: sc.params || {} });
  const [stack, setStack] = React.useState<any[]>(first ? [first] : []);
  const current = stack.at(-1);
  W.__history = stack;
  W.__navigate = (kind: string, target: any) => {
    if (kind === 'back') { setStack(s => s.length > 1 ? s.slice(0, -1) : s); return; }
    const next = resolve(target);
    if (!next) { W.__unresolved = [...(W.__unresolved || []), target]; return; }
    setStack(s => kind === 'replace' ? [...s.slice(0, -1), next] : [...s, next]);
  };
  W.__switchTab = (name: string) => {
    const row = table.find(([r, , l]) => !l && r.startsWith(tabsRoot + name + '/') && !/\(.*\)\/index\.tsx$/.test(r));
    if (row) W.__navigate('replace', row[1]);
  };
  if (!current) return <div style={{ padding: 80, font: '15px -apple-system' }}>Rota não encontrada: {String(sc.route)}</div>;
  W.__pathname = current.pathname; W.__params = current.params;
  W.__activeTab = current.rel.startsWith(tabsRoot) ? current.rel.slice(tabsRoot.length).split('/')[0] : null;
  const Screen = table.find(([r]) => r === current.rel)![3]();
  let tree: React.ReactNode = <Screen key={stack.length + current.rel} />;
  for (const [, , , load] of [...current.layouts].reverse()) { const Layout = load(); tree = <RouteChild.Provider value={tree}><Layout /></RouteChild.Provider>; }
  return <Provider store={store}>{tree}</Provider>;
}
function StatusBar() {
  return <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 54, zIndex: 90, pointerEvents: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 34px 0 54px', font: '600 17px -apple-system', color: '#17131B' }}>
    <span>9:41</span><span style={{ position: 'absolute', top: 11, left: '50%', width: 124, height: 36, marginLeft: -62, borderRadius: 20, background: '#0E0C10' }} /><span style={{ width: 26, height: 12, border: '1.5px solid #17131B', borderRadius: 4, padding: 1.5, opacity: .9 }}><i style={{ display: 'block', height: '100%', width: '80%', background: '#17131B', borderRadius: 1.5 }} /></span></div>;
}
class Boundary extends React.Component<{ children: React.ReactNode }, { error?: any }> {
  state: { error?: any } = {};
  static getDerivedStateFromError(error: any) { return { error }; }
  componentDidCatch(error: any) { W.__error = String(error?.stack || error).slice(0, 1200); }
  render() { return this.state.error ? <pre style={{ padding: 70, font: '11px monospace', whiteSpace: 'pre-wrap' }}>{String(this.state.error?.stack || this.state.error)}</pre> : this.props.children; }
}
createRoot(document.getElementById('app')!).render(<><StatusBar /><Boundary><Root /></Boundary></>);

// ---------- Scenario steps and measurements
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
function find(label: string): HTMLElement | null {
  const hits = [...document.querySelectorAll<HTMLElement>('[data-hit]')];
  const modals = [...document.querySelectorAll('[data-modal]')];
  const top = modals.at(-1);
  const pool = top ? hits.filter(h => top.contains(h)) : hits;
  return pool.find(h => h.dataset.label === label) || pool.find(h => h.textContent!.trim() === label) || pool.find(h => h.textContent!.trim().startsWith(label)) || null;
}
function mainScroll(): HTMLElement | null {
  const top = [...document.querySelectorAll('[data-modal]')].at(-1);
  const all = [...document.querySelectorAll<HTMLElement>('[data-scroll="v"]')].filter(e => top ? top.contains(e) : true);
  return all.sort((a, b) => (b.clientHeight * 10 + b.scrollHeight / 100) - (a.clientHeight * 10 + a.scrollHeight / 100))[0] || null;
}
function metrics() {
  const hits = [...document.querySelectorAll<HTMLElement>('[data-hit]')].map(h => { const r = h.getBoundingClientRect(); return { label: (h.dataset.label || h.textContent || '').trim().slice(0, 60), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), input: !!h.dataset.input }; })
    .filter(r => r.y + r.h > 0 && r.y < 874 && r.w > 0 && r.h > 0);
  const small = hits.filter(r => r.h < 43.5 || r.w < 43.5);
  const overflow = [...document.querySelectorAll<HTMLElement>('[data-text]')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (e.scrollWidth > e.clientWidth + 1 || r.right > 402.5); }).map(e => (e.textContent || '').slice(0, 50));
  const scroll = mainScroll();
  return { small, overflow, missingIcons: [...new Set(W.__missingIcons || [])], scrollHeight: scroll?.scrollHeight, requests: W.__requests, blockedWrites: W.__blockedWrites, routes: W.__routes, unresolved: W.__unresolved, toasts: W.__toasts, pathname: W.__pathname, external: W.__external };
}
(async () => {
  await sleep(sc.wait ?? 900);
  for (const step of sc.steps || []) {
    if (step.click) { const el = find(step.click); if (!el) { W.__error = 'missing control: ' + step.click; break; } el.click(); }
    if (step.type) { const fn = W.__inputs?.[step.type[0]]; if (!fn) { W.__error = 'missing input: ' + step.type[0]; break; } fn(step.type[1]); }
    if (step.scroll != null) { const s = mainScroll(); if (s) s.scrollTop = step.scroll === 'end' ? s.scrollHeight : step.scroll; }
    if (step.scrollTo) { const s = mainScroll(); const el = [...document.querySelectorAll<HTMLElement>('[data-text]')].find(e => e.textContent!.trim().startsWith(step.scrollTo)); if (s && el) s.scrollTop += el.getBoundingClientRect().top - (step.offset ?? 200); }
    if (step.back) W.__navigate('back');
    await sleep(step.wait || 400);
  }
  if (sc.scroll != null) { const s = mainScroll(); if (s) s.scrollTop = sc.scroll === 'end' ? s.scrollHeight : sc.scroll; }
  await sleep(250);
  W.__metrics = metrics();
  W.__ready = true;
})();
