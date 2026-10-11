// Minimal CommonJS bundler for the visual preview.
// Transpiles the app's TS/TSX with the project's TypeScript, replaces native/Expo modules with DOM stand-ins
// (mocks.tsx, rn-dom.tsx) and generates a route table from src/app so scenarios can navigate between screens.
const fs = require('node:fs'), path = require('node:path');
const here = __dirname;
const app = path.resolve(here, '../..');
const out = path.join(here, 'out');
const ts = require(path.join(app, 'node_modules/typescript'));

const mocks = {
  'react-native': 'rn-dom.tsx',
  'react-native-safe-area-context': 'mocks.tsx#safeArea',
  '@expo/vector-icons': 'mocks.tsx#icons',
  'expo-image': 'mocks.tsx#expoImage',
  'expo-router': 'mocks.tsx#routerApi',
  'expo-router/react-navigation': 'mocks.tsx#navigation',
  'react-i18next': 'mocks.tsx#i18n',
  'axios': 'mocks.tsx#axios',
  'expo-sharing': 'mocks.tsx#sharing',
  'react-native-view-shot': 'mocks.tsx#viewShot',
  '@react-native-community/datetimepicker': 'mocks.tsx#datePicker',
  'expo-haptics': 'mocks.tsx#haptics',
  'expo-secure-store': 'mocks.tsx#secureStore',
  '@react-native-async-storage/async-storage': 'mocks.tsx#asyncStorage',
  '@react-native-community/netinfo': 'mocks.tsx#netInfo',
  'expo-image-picker': 'mocks.tsx#imagePicker',
  'expo-constants': 'mocks.tsx#constants',
  'lottie-react-native': 'mocks.tsx#lottie',
  'expo-status-bar': 'mocks.tsx#statusBar',
  'expo-notifications': 'mocks.tsx#notifications',
  'expo-localization': 'mocks.tsx#localization',
  'expo-linking': 'mocks.tsx#linking',
  'expo-device': 'mocks.tsx#device',
  'react-native-toast-message': 'mocks.tsx#toast',
  'react-native-gesture-handler': 'mocks.tsx#empty',
  'react-native-get-random-values': 'mocks.tsx#empty',
  'react-native-reanimated': 'mocks.tsx#empty',
  'uuid': 'mocks.tsx#uuid',
};
// App modules replaced by preview versions (matched by path suffix).
const appOverrides = { 'src/services/tokenService.ts': 'mocks.tsx#tokenServiceModule' };

const modules = new Map();
let nextId = 0;
function add(file) { if (!modules.has(file)) { modules.set(file, { id: nextId++, code: '' }); build(file); } return modules.get(file).id; }
function fileFor(base) {
  for (const c of [base, base + '.ts', base + '.tsx', base + '.js', base + '.json', path.join(base, 'index.ts'), path.join(base, 'index.tsx'), path.join(base, 'index.js')])
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  return null;
}
function resolve(from, request) {
  if (mocks[request]) { const [f, part] = mocks[request].split('#'); return { file: path.join(here, f), part }; }
  if (request === '__routes') return { file: path.join(out, 'routes.tsx') };
  let base = null;
  if (request.startsWith('@/')) base = path.join(app, request.slice(2));
  else if (request.startsWith('.') || request.startsWith('/')) base = path.resolve(path.dirname(from), request);
  if (base) {
    const file = fileFor(base);
    if (!file) throw new Error(`Cannot resolve ${request} from ${from}`);
    const rel = path.relative(app, file);
    if (appOverrides[rel]) { const [f, part] = appOverrides[rel].split('#'); return { file: path.join(here, f), part }; }
    return { file };
  }
  const file = require.resolve(request, { paths: [app] });
  if (!path.isAbsolute(file)) throw new Error(`Node built-in ${request}`);
  return { file };
}
function build(file) {
  const ext = path.extname(file);
  let src;
  if (ext === '.json') src = 'module.exports=' + fs.readFileSync(file, 'utf8');
  else if (/\.(png|jpe?g|gif|ttf)$/.test(ext)) src = 'module.exports=' + JSON.stringify('file://' + file);
  else {
    src = fs.readFileSync(file, 'utf8');
    if (/\.(tsx?|jsx)$/.test(ext) || file.startsWith(path.join(app, 'src'))) src = ts.transpileModule(src, { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  }
  src = src.replace(/\brequire\((['"])([^'"]+)\1\)/g, (m, q, req) => {
    if (/\.(png|jpe?g|gif)$/.test(req)) { const f = req.startsWith('@/') ? path.join(app, req.slice(2)) : path.resolve(path.dirname(file), req); return JSON.stringify('file://' + f); }
    let r; try { r = resolve(file, req); } catch (e) { console.warn('missing', req, 'from', path.relative(app, file)); return `__missing(${JSON.stringify(req)})`; }
    const id = add(r.file);
    return `__req(${id}${r.part ? ',' + JSON.stringify(r.part) : ''})`;
  });
  modules.get(file).code = src;
}
// Route table: every screen and layout under src/app, with group segments removed from the public pattern.
function routeTable() {
  const root = path.join(app, 'src/app'), rows = [];
  const walk = dir => { for (const name of fs.readdirSync(dir)) { const full = path.join(dir, name); if (fs.statSync(full).isDirectory()) walk(full); else if (/\.tsx$/.test(name)) rows.push(path.relative(root, full)); } };
  walk(root);
  const lines = rows.filter(r => r !== '_layout.tsx').map(rel => {
    const segs = rel.replace(/\.tsx$/, '').split('/');
    const layout = segs.at(-1) === '_layout';
    const pattern = '/' + segs.filter(s => !/^\(.*\)$/.test(s) && s !== 'index' && s !== '_layout').join('/');
    return `[${JSON.stringify(rel)},${JSON.stringify(pattern)},${layout},()=>require(${JSON.stringify(path.join(root, rel))}).default]`;
  });
  fs.writeFileSync(path.join(out, 'routes.tsx'), `export default [\n${lines.join(',\n')}\n];\n`);
}
fs.mkdirSync(out, { recursive: true });
routeTable();
const entry = path.join(here, 'app.tsx');
add(entry);
let bundle = `(function(){var process={env:{NODE_ENV:'production'}};window.process=process;window.__DEV__=false;var __defs={},__cache={};
function __missing(n){return new Proxy(function(){}, {get:function(t,k){return k==='__esModule'?true:function(){return null}}})}
function __req(id,part){var m=__cache[id];if(!m){m=__cache[id]={exports:{}};__defs[id].call(m.exports,m,m.exports);}return part?m.exports[part]:m.exports;}\n`;
for (const [file, m] of modules) bundle += `__defs[${m.id}]=function(module,exports){var require=__req;\n${m.code}\n};//${path.relative(app, file)}\n`;
bundle += `try{__req(${modules.get(entry).id});}catch(e){window.__error=String(e&&e.stack||e).slice(0,1200);window.__ready=true;}})();`;
fs.writeFileSync(path.join(out, 'bundle.js'), bundle);
console.log(`bundle: ${modules.size} modules, ${(bundle.length / 1e6).toFixed(1)} MB`);
