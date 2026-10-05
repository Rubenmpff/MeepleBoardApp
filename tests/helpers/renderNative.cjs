// React/i18next render harness. Native adapters inspect behaviour, not device layout.
// All services are isolated; fixtures never reach the API or a database.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const i18next = require('i18next');
const root = path.resolve(__dirname, '../..');

async function renderNative(source, exportName, props = {}, options = {}) {
  const resources = Object.fromEntries(['pt', 'en'].map(lang => [lang, Object.fromEntries(['games', 'library', 'common', 'matches', 'campaigns'].map(ns => [ns,
    JSON.parse(fs.readFileSync(path.join(root, `src/i18n/locales/${lang}/${ns}.json`), 'utf8')),
  ]))]));
  const i18n = i18next.createInstance();
  await i18n.init({ lng: options.language || 'pt', resources, interpolation: { escapeValue: false } });
  const controls = [], lists = [], routes = [], calls = [], inputs = [], updates = [], datePickers = [], cache = new Map();
  let stateIndex = 0;
  const host = ({ children }) => React.createElement('div', null, children);
  const button = p => { controls.push(p); return React.createElement('button', null, p.children); };
  const native = {
    View: host, Text: ({ children }) => React.createElement('span', null, children), ScrollView: host,
    KeyboardAvoidingView: host, Platform: { OS: 'ios' }, Image: () => null, ActivityIndicator: () => null,
    Modal: p => p.visible ? React.createElement(host, p) : null,
    TextInput: p => { inputs.push(p); return null; }, TouchableOpacity: button, Pressable: button,
    RefreshControl: () => null, Alert: { alert: (...args) => calls.push(['alert', ...args]) },
    Keyboard: { dismiss: () => calls.push(['dismissKeyboard']) },
    useWindowDimensions: () => ({ width: options.width || 390, fontScale: options.fontScale || 1 }),
    StyleSheet: { create: v => v, hairlineWidth: 1, absoluteFill: {} },
    Animated: { Value: class { constructor(value) { this.value = value; } }, spring: () => ({ start() {} }), timing: () => ({ start() {} }), View: host },
    FlatList: p => {
      lists.push(p);
      const element = item => typeof item === 'function' ? React.createElement(item) : item;
      return React.createElement('div', null, element(p.ListHeaderComponent),
        p.data.length ? p.data.map((item, index) => React.createElement(React.Fragment, { key: index }, p.renderItem({ item, index }))) : element(p.ListEmptyComponent),
        element(p.ListFooterComponent));
    },
  };
  const router = { push: r => routes.push(r), replace: r => routes.push(['replace', r]), back: () => routes.push('back') };
  const mocks = {
    'react-native': native,
    'react-native-safe-area-context': { SafeAreaView: host, useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }) },
    '@expo/vector-icons': { MaterialIcons: () => null, Ionicons: () => null },
    'expo-image': { Image: () => null },
    'expo-router': { router, useRouter: () => router, useNavigation: () => ({ openDrawer: () => routes.push('menu') }), useLocalSearchParams: () => options.params || ({ id: 'game-id' }), useFocusEffect() {} },
    'react-i18next': { useTranslation: ns => ({ t: (key, opts) => i18n.t(key, { ns, ...opts }), i18n }) },
    'react-redux': { useSelector: fn => fn({ auth: { user: { id: 'me' } }, library: { items: options.library || [] } }) },
    'react-native-toast-message': { __esModule: true, default: { show: p => calls.push(['toast', p]) } },
    'expo-haptics': { impactAsync: async () => {}, ImpactFeedbackStyle: {} },
    'lottie-react-native': { __esModule: true, default: () => null },
    '@react-native-community/datetimepicker': { __esModule: true, default: p => { datePickers.push(p); return null; } },
    'expo-image-picker': {
      MediaTypeOptions: { Images: 'images' },
      requestMediaLibraryPermissionsAsync: async () => { calls.push(['photoPermission']); return { granted: options.photoPermission !== false }; },
      launchImageLibraryAsync: async () => { calls.push(['pickPhoto']); return options.photoResult || { canceled: true }; },
    },
  };
  const hooks = {
    useUserLibrary: () => ({ library: options.library || [], loading: !!options.loading, error: options.error, refetch: async () => calls.push(['refetch']) }),
    usePlayedGames: () => ({ playedGames: options.playedGames || [], loading: false }),
    useLibraryActions: () => ({ loading: false, updateGame: async (...args) => calls.push(['updateGame', ...args]), removeGame: async (...args) => calls.push(['removeGame', ...args]), addGame: async (...args) => calls.push(['addGame', ...args]) }),
    useViewModePreference: () => ({ viewMode: options.viewMode || 'grid', setViewMode: value => calls.push(['viewMode', value]) }),
    useGameSuggestions: () => ({ suggestions: options.suggestions || [], loading: !!options.loading, error: options.error, hasMore: true, fetchSuggestions: async (...args) => calls.push(['fetchSuggestions', ...args]), resetSuggestions() {} }),
    useRecentSearches: () => ({ recentSearches: [], addSearch() {}, removeSearch() {}, clearSearches() {} }),
    useHotGames: () => ({ hotGames: [] }), useIsOnline: () => options.online !== false,
    useFriends: () => ({ friends: options.friends || [], loading: false }),
    useGameSearch: () => ({ searchGame: async () => null, loading: false }),
    useRegisterMatch: () => ({ loading: !!options.saving, error: options.error,
      submitMatch: async payload => { calls.push(['submitMatch', payload]); return options.createdMatch || null; } }),
    useGameSessions: () => ({ createSession: async payload => { calls.push(['createSession', payload]); return options.createdSession || null; } }),
  };
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = new Module(filename);
    cache.set(filename, module); module.filename = filename; module.paths = Module._nodeModulePaths(path.dirname(filename));
    module.require = id => {
      if (id === 'react' && filename === path.join(root, source)) return { ...React, useState: initial => {
        const index = stateIndex++;
        const [value] = React.useState(options.states && Object.hasOwn(options.states, index) ? options.states[index] : initial);
        return [value, next => updates.push([index, typeof next === 'function' ? next(value) : next])];
      } };
      if (mocks[id]) return mocks[id];
      if (options.stubRegisterForm && id.endsWith('/RegisterMatchForm')) return { __esModule: true,
        default: p => { calls.push(['registerForm', p]); return null; } };
      const hook = id.split('/').pop();
      if (id.includes('/hooks/') && hooks[hook]) return { [hook]: hooks[hook] };
      if (id.includes('/services/')) return { __esModule: true, default: {
        getById: async id => { calls.push(['getById', id]); return options.game || null; },
        getHistoryByGame: async id => { calls.push(['getHistoryByGame', id]); return []; },
        getUserRatingForGame: async () => null,
        getByGame: async id => { calls.push(['getByGame', id]); return []; },
        ...Object.fromEntries(Object.entries(options.services || {}).map(([method, result]) => [method, async (...args) => {
          calls.push([method, ...args]);
          if (result instanceof Error) throw result;
          return result;
        }])),
      } };
      if (id.startsWith('@/') || id.startsWith('.')) {
        const base = id.startsWith('@/') ? path.join(root, id.slice(2)) : path.resolve(path.dirname(filename), id);
        const resolved = [base, base + '.ts', base + '.tsx'].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
        if (resolved) return load(resolved);
      }
      return require(id);
    };
    module._compile('const __DEV__ = false;\n' + ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText, filename);
    return module.exports;
  }
  const component = load(path.join(root, source))[exportName];
  const html = renderToStaticMarkup(React.createElement(component, props));
  return { html, controls, lists, routes, calls, inputs, updates, datePickers, i18n, load: file => load(path.join(root, file)),
    async press(label) {
      const p = controls.find(c => c.accessibilityLabel === label) || controls.find(c =>
        renderToStaticMarkup(React.createElement(React.Fragment, null, c.children)).replace(/<[^>]+>/g, '') === label);
      if (!p) throw new Error(`Missing button: ${label}`);
      if (p.disabled) throw new Error(`Disabled button: ${label}`);
      await p.onPress({ stopPropagation() { calls.push(['stopPropagation']); } });
    },
  };
}
module.exports = { renderNative };
