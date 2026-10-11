// Stand-ins for Expo, navigation and native modules. Network goes to the DeviceTests API with GET only.
import * as React from 'react';
import i18next from 'i18next';
import { View, Text } from './rn-dom';
const W = window as any;
const session = W.__session || {};
const noop = () => { };
const anoop = async () => { };

// ---------- i18n: the app's own src/i18n initialises i18next; this binds the hooks to it.
// Stable per namespace, like react-i18next: effects that depend on t must not re-run on every render.
const translators = new Map<string, any>();
const useTranslation = (ns?: string | string[]) => {
  const key = (Array.isArray(ns) ? ns.join('|') : ns || '') + '@' + i18next.language;
  if (!translators.has(key)) translators.set(key, { t: i18next.getFixedT(null, ns as any), i18n: i18next, ready: true });
  return translators.get(key);
};
export const i18n = {
  initReactI18next: { type: '3rdParty', init: noop },
  useTranslation,
  Trans: (p: any) => <>{p.children ?? (p.i18nKey ? i18next.t(p.i18nKey, { ns: p.ns, ...(p.values || {}) }) : null)}</>,
  I18nextProvider: (p: any) => p.children,
};

// ---------- Network: same base path as the app, bearer token of a DeviceTests account, writes refused.
W.__requests = []; W.__blockedWrites = [];
class AxiosError extends Error { response: any; isAxiosError = true; code?: string; constructor(message: string, response?: any, code?: string) { super(message); this.response = response; this.code = code; } }
function makeClient(defaults: any = {}): any {
  const request = async (method: string, url: string, data?: any, config: any = {}) => {
    const full = /^https?:/.test(url) ? url : (session.apiBase || '') + url;
    if (method !== 'get') { W.__blockedWrites.push(`${method.toUpperCase()} ${url}`); throw new AxiosError('Preview is read-only', { status: 0, data: { message: 'Pré-visualização só de leitura' } }); }
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(config.params || {})) { if (v == null) continue; if (Array.isArray(v)) v.forEach(x => params.append(k, String(x))); else params.append(k, String(v)); }
    const qs = params.toString();
    W.__requests.push(url + (qs ? '?' + qs : ''));
    const res = await fetch(full + (qs ? '?' + qs : ''), { headers: { Accept: 'application/json', ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}) }, signal: config.signal });
    const text = await res.text(); let body: any = text; try { body = text ? JSON.parse(text) : null; } catch { }
    if (!res.ok) throw new AxiosError(`HTTP ${res.status}`, { status: res.status, data: body });
    return { data: body, status: res.status, headers: {}, config };
  };
  const client: any = (config: any) => request((config.method || 'get').toLowerCase(), config.url, config.data, config);
  Object.assign(client, {
    defaults: { headers: { common: {} }, ...defaults }, interceptors: { request: { use: () => 0, eject: noop }, response: { use: () => 0, eject: noop } },
    get: (u: string, c?: any) => request('get', u, undefined, c), delete: (u: string, c?: any) => request('delete', u, undefined, c),
    post: (u: string, d?: any, c?: any) => request('post', u, d, c), put: (u: string, d?: any, c?: any) => request('put', u, d, c), patch: (u: string, d?: any, c?: any) => request('patch', u, d, c),
    request: (c: any) => client(c), create: (d: any) => makeClient(d),
  });
  return client;
}
const axiosInstance = makeClient();
export const axios = Object.assign(axiosInstance, { __esModule: true, default: axiosInstance, AxiosError, isAxiosError: (e: any) => !!e?.isAxiosError, isCancel: (e: any) => e?.name === 'AbortError', CanceledError: AxiosError });
export const tokenServiceModule = { tokenService: new Proxy({}, { get: (_t, k: string) => /refresh/i.test(k) && !/AccessToken/.test(k) ? async () => null : /Token|token/.test(k) ? async () => session.token : /isRememberMe/.test(k) ? async () => true : anoop }) };

// ---------- Storage and device
const memory = new Map<string, string>();
export const secureStore = { getItemAsync: async (k: string) => memory.get('s:' + k) ?? null, setItemAsync: async (k: string, v: string) => { memory.set('s:' + k, v); }, deleteItemAsync: async (k: string) => { memory.delete('s:' + k); } };
export const asyncStorage = { __esModule: true, default: { getItem: async (k: string) => memory.get(k) ?? null, setItem: async (k: string, v: string) => { memory.set(k, v); }, removeItem: async (k: string) => { memory.delete(k); }, multiRemove: anoop, getAllKeys: async () => [...memory.keys()], clear: anoop } };
export const netInfo = { __esModule: true, default: { addEventListener: () => noop, fetch: async () => ({ isConnected: true, isInternetReachable: true }) }, useNetInfo: () => ({ isConnected: true, isInternetReachable: true }) };
export const imagePicker = { MediaTypeOptions: { Images: 'images' }, requestMediaLibraryPermissionsAsync: async () => ({ granted: false }), requestCameraPermissionsAsync: async () => ({ granted: false }), launchImageLibraryAsync: async () => ({ canceled: true }), launchCameraAsync: async () => ({ canceled: true }) };
export const constants = { __esModule: true, default: { expoConfig: { hostUri: '127.0.0.1:8082', extra: {} }, manifest: null, executionEnvironment: 'storeClient' } };
export const lottie = { __esModule: true, default: () => null };
export const statusBar = { StatusBar: () => null };
export const notifications = new Proxy({ __esModule: true }, { get: (t: any, k: string) => k in t ? t[k] : (/^add.*Listener$/.test(k) ? () => ({ remove: noop }) : /Async$/.test(k) ? async () => ({ status: 'denied', granted: false, data: '' }) : noop) });
export const localization = { getLocales: () => [{ languageCode: 'pt', languageTag: 'pt-PT', regionCode: 'PT' }], getCalendars: () => [{ timeZone: 'Europe/Lisbon' }], locale: 'pt-PT' };
export const linking = { createURL: (p: string) => 'meepleboard://' + p, addEventListener: () => ({ remove: noop }), getInitialURL: async () => null, openURL: anoop, parse: () => ({ queryParams: {} }), useURL: () => null };
export const device = { isDevice: true, modelName: 'iPhone', osName: 'iOS' };
export const toast = { __esModule: true, default: Object.assign(() => null, { show: (p: any) => { W.__toasts = [...(W.__toasts || []), p]; }, hide: noop }) };
export const empty = { __esModule: true, default: {} };
export const uuid = { v4: () => crypto.randomUUID() };
export const sharing = { isAvailableAsync: async () => true, shareAsync: anoop };
export const viewShot = { captureRef: async () => '/tmp/x.png', releaseCapture: noop };
export const haptics = { impactAsync: anoop, ImpactFeedbackStyle: {}, notificationAsync: anoop, NotificationFeedbackType: {}, selectionAsync: anoop };

// ---------- Safe area of an iPhone 16 Pro (402 × 874 pt)
const insets = { top: 62, bottom: 34, left: 0, right: 0 };
export const safeArea = {
  SafeAreaView: (p: any) => { const e: string[] = p.edges || ['top', 'bottom', 'left', 'right']; return <View style={[p.style, { paddingTop: e.includes('top') ? insets.top : 0, paddingBottom: e.includes('bottom') ? insets.bottom : 0 }]}>{p.children}</View>; },
  useSafeAreaInsets: () => insets, SafeAreaProvider: (p: any) => p.children, initialWindowMetrics: { insets, frame: { x: 0, y: 0, width: 402, height: 874 } },
};

// ---------- Icons from the real vector-icons glyph maps and fonts
const glyphs: any = {
  MaterialCommunityIcons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json'),
  MaterialIcons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialIcons.json'),
  Ionicons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json'),
  Feather: require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Feather.json'),
  AntDesign: require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/AntDesign.json'),
  FontAwesome5: require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/FontAwesome5Free.json'),
};
const icon = (family: string) => {
  const C = (p: any) => {
    const code = glyphs[family][p.name];
    if (code == null) W.__missingIcons = [...(W.__missingIcons || []), family + ':' + p.name];
    const st = Array.isArray(p.style) ? Object.assign({}, ...p.style.flat().filter(Boolean)) : (p.style || {});
    return <span aria-hidden style={{ fontFamily: family === 'FontAwesome5' ? 'FontAwesome5_Solid' : family, fontSize: p.size || 12, lineHeight: (p.size || 12) + 'px', color: p.color, display: 'inline-block', flexShrink: 0, fontStyle: 'normal', ...(st.marginLeft != null ? { marginLeft: st.marginLeft } : {}), ...(st.marginRight != null ? { marginRight: st.marginRight } : {}) }}>{code == null ? '?' : String.fromCodePoint(code)}</span>;
  };
  (C as any).glyphMap = glyphs[family];
  return C;
};
export const icons = { MaterialCommunityIcons: icon('MaterialCommunityIcons'), MaterialIcons: icon('MaterialIcons'), Ionicons: icon('Ionicons'), Feather: icon('Feather'), AntDesign: icon('AntDesign'), FontAwesome5: icon('FontAwesome5') };
export const expoImage = { Image: (p: any) => <img alt="" src={typeof p.source === 'string' ? p.source : p.source?.uri} style={{ display: 'block', objectFit: p.contentFit || 'cover', ...(Array.isArray(p.style) ? Object.assign({}, ...p.style.flat().filter(Boolean)) : p.style || {}) }} /> };

// ---------- Router: navigation is recorded and, when the target is a known route, rendered.
W.__routes = [];
const go = (kind: string, r: any) => { W.__routes.push(kind === 'push' ? r : [kind, r]); W.__navigate?.(kind, r); };
const router = {
  push: (r: any) => go('push', r), navigate: (r: any) => go('navigate', r), replace: (r: any) => go('replace', r), dismissTo: (r: any) => go('replace', r),
  back: () => go('back', null), canGoBack: () => (W.__history?.length || 0) > 1 || W.__canGoBack !== false, setParams: (p: any) => { W.__params = { ...W.__params, ...p }; }, dismiss: () => go('back', null), dismissAll: noop,
};
const navigationObject = { dispatch: noop, setOptions: noop, addListener: () => noop, goBack: () => go('back', null), canGoBack: () => true, openDrawer: noop, getParent: () => null, isFocused: () => true };
// Navigators render the next layout/screen of the resolved route; Tabs also draws its tab bar.
export const RouteChild = React.createContext<React.ReactNode>(null);
const Next = () => React.useContext(RouteChild) as any;
const Tabs: any = (p: any) => {
  const routes = (W.__tabNames || []).map((name: string) => ({ name, key: name }));
  const index = Math.max(0, routes.findIndex((r: any) => r.name === W.__activeTab));
  const bar = p.tabBar?.({ state: { routes, index }, navigation: { emit: () => ({ defaultPrevented: false }), navigate: (name: string) => W.__switchTab?.(name) }, descriptors: {}, insets });
  return <View style={{ flex: 1 }}><View style={{ flex: 1 }}><Next /></View>{bar}</View>;
};
Tabs.Screen = () => null;
const Stack: any = () => <Next />; Stack.Screen = () => null;
const Slot = () => <Next />;
export const routerApi = {
  router, useRouter: () => router, useLocalSearchParams: () => W.__params || {}, useGlobalSearchParams: () => W.__params || {}, usePathname: () => W.__pathname || '/', useSegments: () => (W.__pathname || '/').split('/').filter(Boolean),
  Tabs, Stack, Slot, Redirect: (p: any) => { React.useEffect(() => { go('replace', p.href); }, []); return null; }, Link: (p: any) => <Text onPress={() => go('push', p.href)}>{p.children}</Text>,
  useFocusEffect: (cb: any) => React.useEffect(() => cb(), [cb]), useNavigation: () => navigationObject,
  withLayoutContext: () => Tabs, useRootNavigationState: () => ({ key: 'root' }), SplashScreen: { preventAutoHideAsync: anoop, hideAsync: anoop },
};
export const navigation = { usePreventRemove: noop };

// Stand-in for the iOS inline calendar: same footprint, marked as a placeholder.
export const datePicker = {
  __esModule: true, default: (p: any) => {
    const d: Date = p.value || new Date(); const first = new Date(d.getFullYear(), d.getMonth(), 1); const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); const lead = (first.getDay() + 6) % 7;
    if (p.mode === 'time' || p.display === 'spinner' || p.display === 'compact') return <div data-native="datetimepicker" style={{ padding: '6px 10px', borderRadius: 8, background: '#EFEDF1', font: '15px -apple-system', color: '#30283D', alignSelf: 'flex-start' }}>{new Intl.DateTimeFormat('pt-PT', p.mode === 'time' ? { hour: '2-digit', minute: '2-digit' } : { dateStyle: 'medium' }).format(d)}</div>;
    const cells = [...Array(lead).fill(''), ...Array.from({ length: days }, (_, i) => String(i + 1))];
    return <div data-native="datetimepicker" style={{ padding: '8px 4px 4px', font: '15px -apple-system', color: '#30283D' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px 8px', fontWeight: 600 }}><span>{new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(d)} ›</span><span style={{ color: '#27594B' }}>‹&nbsp;&nbsp;&nbsp;›</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', textAlign: 'center', rowGap: 2 }}>{['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((x, i) => <span key={'h' + i} style={{ fontSize: 12, color: '#8A8F98', height: 20 }}>{x}</span>)}
        {cells.map((c, i) => <span key={i} style={{ height: 40, lineHeight: '40px', ...(c === String(d.getDate()) ? { background: '#27594B', color: '#fff', borderRadius: 20, width: 40, margin: '0 auto', fontWeight: 600 } : {}) }}>{c}</span>)}</div></div>;
  },
};
