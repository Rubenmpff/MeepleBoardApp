// Render Home with real React/i18next and lightweight native adapters.
// Fixtures are test-only; no API calls, app data or database writes.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const i18next = require('i18next');
const root = path.resolve(__dirname, '..');
const resources = Object.fromEntries(['pt', 'en'].map(lang => [lang, Object.fromEntries(['dashboard', 'matches', 'navigation'].map(ns => [ns,
  JSON.parse(fs.readFileSync(path.join(root, `src/i18n/locales/${lang}/${ns}.json`), 'utf8'))]))]));

async function renderHome(options = {}) {
  const i18n = i18next.createInstance();
  await i18n.init({ lng: options.language || 'pt', resources, defaultNS: 'dashboard', interpolation: { escapeValue: false } });
  const buttons = [], routes = [], calls = [], focusEffects = [], cache = new Map();
  const host = ({ children }) => React.createElement('div', null, children);
  const button = props => { buttons.push(props); return React.createElement('button', null, props.children); };
  const native = {
    View: host, ScrollView: host, Text: ({ children }) => React.createElement('span', null, children),
    Image: () => null, ActivityIndicator: () => null, RefreshControl: () => null,
    TouchableOpacity: button, Pressable: button, TextInput: () => null,
    StyleSheet: { create: value => value, hairlineWidth: 1 },
    useWindowDimensions: () => ({ width: options.width || 390, height: 844, fontScale: options.fontScale || 1 }),
  };
  const mocks = {
    'react-native': native,
    'react-native-safe-area-context': { SafeAreaView: host, useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }) },
    '@expo/vector-icons': { MaterialIcons: () => null, MaterialCommunityIcons: () => null, Ionicons: () => null },
    'expo-router': { useRouter: () => ({ push: route => routes.push(route) }), useFocusEffect: callback => focusEffects.push(callback) },
    'react-i18next': { useTranslation: ns => ({ t: (key, opts) => i18n.t(key, { ns, ...opts }), i18n }) },
    'react-redux': { useSelector: selector => selector({ auth: { user: { id: 'me', userName: 'Player with a long name' } } }) },
    'lottie-react-native': { __esModule: true, default: () => null },
  };
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = new Module(filename);
    cache.set(filename, module);
    module.filename = filename;
    module.paths = Module._nodeModulePaths(path.dirname(filename));
    module.require = id => {
      // Friend requests load in an effect, which static rendering skips; their count is the screen's only numeric state.
      if (id === 'react' && filename.endsWith('DashboardScreen.tsx')) return { ...React, useState: initial => React.useState(initial === 0 && options.requests ? options.requests : initial) };
      if (mocks[id]) return mocks[id];
      if (id.includes('/hooks/useLastMatch')) return { useLastMatch: () => ({ data: null, loading: false, error: null, ...options.lastMatch, refetch: silent => calls.push(['lastMatch', !!silent]) }) };
      if (id.includes('/hooks/useGameSessions')) return { useGameSessions: () => ({ sessions: options.sessions || [], fetchSessions: async () => calls.push(['sessions']) }) };
      if (id.includes('/hooks/usePendingJournal')) return { usePendingJournal: () => ({ count: options.reviewCount || 0, refetch: async () => calls.push(['ratings']) }) };
      if (id.includes('/hooks/useStatistics')) return { __esModule: true, default: () => ({ data: options.year || null, refetch: () => calls.push(['year']) }) };
      if (id.includes('/services/friendshipService')) return { getIncomingRequests: async () => { calls.push(['requests']); return []; } };
      if (id.startsWith('@/assets/')) return {};
      if (id.startsWith('@/') || id.startsWith('.')) {
        const base = id.startsWith('@/') ? path.join(root, id.slice(2)) : path.resolve(path.dirname(filename), id);
        const resolved = [base, base + '.ts', base + '.tsx'].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
        if (resolved) return load(resolved);
      }
      return require(id);
    };
    module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    }).outputText, filename);
    return module.exports;
  }
  const Dashboard = load(path.join(root, 'src/features/dashboard/screens/DashboardScreen.tsx')).default;
  const html = renderToStaticMarkup(React.createElement(Dashboard));
  const find = label => buttons.find(p => p.accessibilityLabel === label);
  const press = label => {
    const button = find(label);
    assert.ok(button, `Missing button: ${label}`);
    button.onPress();
  };
  return { html, buttons, routes, calls, focusEffects, press, find };
}

const session = (id, status, extra = {}) => ({ id, name: `Session ${id}`, organizerId: 'other', organizerUserName: 'Ana', status, players: [], matches: [], ...extra });
const accepted = { userId: 'me', status: 'Accepted' };

test('Home keeps Register match prominent and no longer repeats the tabs, in Portuguese and English', async () => {
  for (const language of ['pt', 'en']) {
    const rendered = await renderHome({ language });
    const t = resources[language].dashboard;
    assert.equal((rendered.html.match(/Player with a long name/g) || []).length, 1);
    assert.ok(rendered.html.includes(t.lastMatch.empty.replace(/'/g, '&#x27;')), rendered.html);
    rendered.press(t.register.title);
    rendered.press(t.upcoming.create);
    rendered.press(t.year.statistics);
    assert.deepEqual(rendered.routes, ['/games/register-match', '/games/sessions/create', '/statistics']);
    assert.ok(!rendered.html.includes(t.todo.title));
    for (const shortcut of language === 'pt' ? ['Sessões', 'Biblioteca', 'Campanhas'] : ['Sessions', 'Library', 'Campaigns']) assert.ok(!rendered.find(shortcut), shortcut);
  }
});

test('an active session I joined leads the page and registers the match inside it', async () => {
  const rendered = await renderHome({ sessions: [session('live', 'Active', {
    location: 'Casa da Ana', startDate: '2026-10-07T09:49:00', players: [accepted, { userId: 'other', status: 1 }, { userId: 'x', status: 'Pending' }], matches: [{}, {}],
  })] });
  assert.ok(rendered.html.includes('A decorrer'));
  assert.ok(rendered.html.includes('Session live'));
  assert.ok(rendered.html.includes('2 confirmados · 2 partidas · Casa da Ana'), rendered.html);
  assert.match(rendered.html, /desde [^<]* 7 out\. · 09:49/, 'a session opened on another day shows its date');
  assert.ok(!rendered.find('Registar partida'), 'the session action replaces the general one');
  rendered.press('Registar partida aqui');
  rendered.press('Abrir a sessão Session live');
  assert.deepEqual(rendered.routes, [
    { pathname: '/games/sessions/register', params: { sessionId: 'live' } },
    { pathname: '/games/sessions/[id]', params: { id: 'live' } },
  ]);
  assert.ok(!rendered.find('Combinar uma sessão'), 'no planning prompt while a session is running');
  const fresh = await renderHome({ sessions: [session('fresh', 'Active', { players: [accepted], startDate: new Date(new Date().setHours(0, 5)).toISOString() })] });
  assert.ok(fresh.html.includes('desde as 00:05'), 'today only the time');
  assert.ok(fresh.html.includes('1 confirmado'));
  assert.ok(!/\d partida/.test(fresh.html), 'no match count before the first match');
});

test('To do uses actual memberships, including numeric invite status, and skips finished sessions', async () => {
  const rendered = await renderHome({ reviewCount: 2, sessions: [
    session('mine', 'Active', { organizerId: 'me', players: [{ userId: 'me', status: 'Pending' }] }),
    session('invite', 'Upcoming', { players: [{ userId: 'me', status: 0 }], scheduledStartDate: '2026-10-16T20:00:00' }),
    session('answered', 'Upcoming', { players: [accepted] }),
    session('closed', 'Closed', { players: [{ userId: 'me', status: 'Pending' }] }),
    session('cancelled', 'Cancelled', { players: [{ userId: 'me', status: 'Pending' }] }),
    session('pendingLive', 'Active', { players: [{ userId: 'me', status: 'Pending' }] }),
  ] });
  assert.ok(rendered.html.includes('Por fazer'));
  assert.match(rendered.html, /de Ana · [^<]* 16 out\. · 20:00/);
  for (const id of ['closed', 'cancelled']) assert.ok(!rendered.find(`Convite: Session ${id}`));
  assert.ok(rendered.html.includes('Session mine'), 'the organiser sees their own active session');
  rendered.press('Convite: Session invite');
  rendered.press('Convite: Session pendingLive');
  rendered.press('2 partidas por avaliar');
  assert.deepEqual(rendered.routes, [
    { pathname: '/games/sessions/[id]', params: { id: 'invite' } },
    { pathname: '/games/sessions/[id]', params: { id: 'pendingLive' } },
    '/games/pending-journal',
  ]);
});

test('friend requests wait in To do and open the requests page', async () => {
  for (const language of ['pt', 'en']) {
    const rendered = await renderHome({ language, requests: 2 });
    const t = resources[language].dashboard;
    assert.ok(rendered.html.includes(t.todo.title));
    rendered.press(t.todo.requests_other.replace('{{count}}', '2'));
    assert.deepEqual(rendered.routes, ['/friends/requests']);
  }
});

test('many invitations collapse into a link to the sessions list', async () => {
  const sessions = ['a', 'b', 'c', 'd'].map(id => session(id, 'Upcoming', { players: [{ userId: 'me', status: 'Pending' }] }));
  const rendered = await renderHome({ sessions });
  assert.equal(rendered.buttons.filter(b => b.accessibilityLabel?.startsWith('Convite:')).length, 3);
  rendered.press('Ver os 4 convites');
  assert.deepEqual(rendered.routes, ['/games/sessions']);
});

test('upcoming sessions are mine, from today on, soonest first, and undated ones last', async () => {
  const inDays = days => new Date(Date.now() + days * 86400000).toISOString();
  const rendered = await renderHome({ sessions: [
    session('later', 'Upcoming', { players: [accepted], scheduledStartDate: inDays(20) }),
    session('undated', 'Upcoming', { organizerId: 'me' }),
    session('overdue', 'Upcoming', { organizerId: 'me', scheduledStartDate: inDays(-3) }),
    session('soon', 'Upcoming', { organizerId: 'me', scheduledStartDate: inDays(1), location: 'Clube' }),
  ] });
  const order = rendered.buttons.map(b => b.accessibilityLabel).filter(label => label?.startsWith('Session'));
  assert.deepEqual(order, ['Session soon', 'Session later']);
  assert.ok(!rendered.html.includes('Session overdue'), 'overdue sessions stay in Jogar');
  assert.ok(rendered.html.includes('Clube'));
  rendered.press('Ver todas as sessões');
  assert.deepEqual(rendered.routes, ['/games/sessions']);
  assert.ok(!rendered.find('Combinar uma sessão'));
});

test('last match data and the single registration action survive small screens and enlarged text', async () => {
  for (const options of [{ width: 320 }, { width: 390, fontScale: 1.6 }]) {
    const rendered = await renderHome({ ...options, lastMatch: { data: { name: 'Existing match', date: '2026-10-05', winner: 'Existing winner', imageUrl: null } } });
    for (const text of ['Existing match', 'Existing winner', '5 out. 2026']) assert.ok(rendered.html.includes(text), rendered.html);
    assert.equal(rendered.buttons.filter(b => b.accessibilityLabel === 'Registar partida').length, 1);
    rendered.press('Registar partida');
    assert.deepEqual(rendered.routes, ['/games/register-match']);
  }
});

test('loading and errors are distinguished from an empty history; retry works', async () => {
  const loading = await renderHome({ lastMatch: { loading: true } });
  assert.ok(loading.html.includes('A carregar a última partida'), loading.html);
  assert.ok(!loading.html.includes('Ainda não tens partidas'));
  const error = await renderHome({ lastMatch: { error: 'Network failure' } });
  assert.ok(error.html.includes('Não foi possível carregar a última partida.'));
  assert.ok(!error.html.includes('Ainda não tens partidas'));
  error.press('Tentar novamente');
  assert.deepEqual(error.calls.filter(c => c[0] === 'lastMatch'), [['lastMatch', false]]);
});

test('the year shows real numbers, a dash while unknown, and returning to Home refreshes everything quietly', async () => {
  const unknown = await renderHome();
  assert.equal((unknown.html.match(/<span>—<\/span>/g) || []).length, 3);
  const rendered = await renderHome({ year: { matches: 12345, distinctGames: 3, results: { wins: 29 } } });
  for (const value of [new Intl.NumberFormat('pt-PT').format(12345), '3', '29']) assert.ok(rendered.html.includes(`<span>${value}</span>`), value);
  const focus = rendered.focusEffects.at(-1);
  focus();
  assert.deepEqual(rendered.calls, [], 'the first focus relies on the initial loads');
  focus();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(rendered.calls.map(c => c[0]).sort(), ['lastMatch', 'ratings', 'requests', 'sessions', 'year']);
  assert.deepEqual(rendered.calls.find(c => c[0] === 'lastMatch'), ['lastMatch', true]);
});
