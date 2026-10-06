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
const resources = Object.fromEntries(['pt', 'en'].map(lang => [lang, { dashboard: JSON.parse(fs.readFileSync(path.join(root, `src/i18n/locales/${lang}/dashboard.json`), 'utf8')) }]));

async function renderHome(options = {}) {
  const i18n = i18next.createInstance();
  await i18n.init({ lng: options.language || 'pt', resources, defaultNS: 'dashboard', interpolation: { escapeValue: false } });
  const buttons = [], routes = [], cache = new Map();
  let retries = 0;
  const primitive = name => ({ children }) => React.createElement(name === 'Text' ? 'span' : 'div', null, children);
  const native = {
    View: primitive('View'), Text: primitive('Text'), ScrollView: primitive('ScrollView'),
    Image: () => null, ActivityIndicator: () => null,
    StyleSheet: { create: value => value },
    useWindowDimensions: () => ({ width: options.width || 390, fontScale: options.fontScale || 1 }),
    Pressable: props => { buttons.push(props); return React.createElement('button', null, props.children); },
  };
  const mocks = {
    'react-native': native,
    'react-native-safe-area-context': { SafeAreaView: primitive('SafeAreaView') },
    '@expo/vector-icons': { MaterialIcons: () => null },
    'expo-router': { useRouter: () => ({ push: route => routes.push(route) }) },
    'react-i18next': { useTranslation: () => ({ t: i18n.t.bind(i18n) }) },
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
      if (mocks[id]) return mocks[id];
      if (id.includes('/hooks/useLastMatch')) return { useLastMatch: () => ({ data: null, loading: false, error: null, ...options.lastMatch, refetch: () => { retries++; } }) };
      if (id.includes('/hooks/useGameSessions')) return { useGameSessions: () => ({ sessions: options.sessions || [] }) };
      if (id.includes('/hooks/usePendingJournal')) return { usePendingJournal: () => ({ count: options.reviewCount || 0 }) };
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
  const press = label => {
    const button = buttons.find(p => p.accessibilityLabel === label);
    assert.ok(button, `Missing button: ${label}`);
    button.onPress();
  };
  return { html, buttons, routes, press, retries: () => retries };
}

test('Home preserves registration and shortcut destinations in Portuguese and English', async () => {
  for (const language of ['pt', 'en']) {
    const rendered = await renderHome({ language });
    const t = resources[language].dashboard;
    assert.equal((rendered.html.match(/Player with a long name/g) || []).length, 1);
    assert.ok(rendered.html.includes(t.lastMatch.empty.replace(/'/g, "&#x27;")), rendered.html);
    for (const label of [t.quickActions.registerMatch.title, t.lastMatch.registerFirst, t.quickActions.sessions.title, t.quickActions.library.title, t.quickActions.campaigns.title]) rendered.press(label);
    assert.deepEqual(rendered.routes, ['/games/register-match', '/games/register-match', '/games/sessions', '/(app)/(tabs)/(library)/library', '/(app)/games/campaigns']);
    assert.ok(!rendered.html.includes(t.pending.title));
  }
});

test('pending counts use actual session memberships, including numeric invite status', async () => {
  const rendered = await renderHome({ reviewCount: 2, sessions: [
    { status: 'Active', organizerId: 'me', players: [{ userId: 'me', status: 'Pending' }] },
    { status: 'Upcoming', organizerId: 'other', players: [{ userId: 'me', status: 0 }] },
    { status: 'Upcoming', organizerId: 'other', players: [{ userId: 'me', status: 'Accepted' }] },
  ] });
  assert.ok(rendered.html.includes('1 sessão ativa'));
  assert.ok(rendered.html.includes('2 sessões agendadas'));
  rendered.press('1 convite pendente');
  rendered.press('2 partidas à espera da tua avaliação');
  assert.deepEqual(rendered.routes, ['/games/sessions', '/games/pending-journal']);
});

test('last match data and replay destination survive small screens and enlarged text', async () => {
  for (const options of [{ width: 320 }, { width: 390, fontScale: 1.6 }]) {
    const rendered = await renderHome({ ...options, lastMatch: { data: { name: 'Existing match', date: '05/10/2026', winner: 'Existing winner', imageUrl: null } } });
    for (const text of ['Existing match', 'Existing winner', '05/10/2026']) assert.ok(rendered.html.includes(text));
    rendered.press('Registar outra partida');
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
  assert.equal(error.retries(), 1);
});
