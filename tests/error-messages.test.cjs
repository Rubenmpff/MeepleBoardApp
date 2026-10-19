// Error messages people see: translated (PT/EN), never technical, with the screen's context when it helps.
// Loads the real API client module and the real translation files; no network.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const locales = Object.fromEntries(['pt', 'en'].map(lang => [lang, Object.fromEntries(['common', 'matches', 'games', 'auth'].map(ns =>
  [ns, JSON.parse(fs.readFileSync(`src/i18n/locales/${lang}/${ns}.json`, 'utf8'))]))]));
const i18n = { language: 'pt', t(key, options = {}) { const [ns, rest] = key.split(':'); const text = rest.split('.').reduce((o, k) => o?.[k], locales[this.language][ns]) ?? key; return typeof text === 'string' ? text.replace(/\{\{(\w+)\}\}/g, (_, name) => options[name] ?? '') : text; } };

function loadApi() {
  const filename = path.resolve('src/services/api.ts');
  const module = new Module(filename);
  module.require = id => {
    if (id === 'axios') return require('axios');
    if (id === 'i18next') return { __esModule: true, default: i18n };
    if (id === '../constants/env') return { __esModule: true, default: () => ({ API_URL: 'http://localhost.invalid', API_MODE: 'test' }) };
    if (id === './tokenService') return { tokenService: {} };
    if (id === '../ui/format') { const format = new Module(path.resolve('src/ui/format.ts')); format._compile(ts.transpileModule(fs.readFileSync('src/ui/format.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, format.id); return format.exports; }
    throw new Error('Unexpected dependency: ' + id);
  };
  module._compile('const __DEV__ = false;\n' + ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
  return module.exports;
}
const { friendlyErrorMessage } = loadApi();
const http = (status, data) => ({ isAxiosError: true, message: `Request failed with status code ${status}`, response: { status, data } });
const network = { isAxiosError: true, message: 'Network Error', request: {} };
const timeout = { isAxiosError: true, message: 'timeout of 10000ms exceeded', code: 'ECONNABORTED', request: {} };
const say = (lang, error, fallback) => { i18n.language = lang; return friendlyErrorMessage(error, fallback); };
const publish = lang => (i18n.language = lang, i18n.t('matches:publish.error'));

test('no answer from the server: network or timeout, in PT and EN', () => {
  assert.match(say('pt', network), /^Não foi possível contactar o servidor/);
  assert.match(say('en', network), /^Couldn't reach the server/);
  assert.match(say('pt', timeout), /demorou demasiado/);
  assert.match(say('en', timeout), /took too long/);
});

test('by status, in PT and EN, never the axios text', () => {
  for (const [status, pt, en] of [[401, /sessão terminou/, /session has ended/], [403, /permissão/, /permission/], [404, /não foi encontrado/, /couldn't be found/],
    [429, /Demasiados pedidos/, /Too many requests/], [500, /problema/, /ran into a problem/]]) {
    assert.match(say('pt', http(status)), pt); assert.match(say('en', http(status)), en);
    assert.doesNotMatch(say('en', http(status)), /status code|Request failed/);
  }
});

test("the API's own explanation in Portuguese; the screen's context in English", () => {
  const closed = http(409, { message: 'A tua avaliação desta partida já foi guardada e não pode ser alterada.' });
  assert.equal(say('pt', closed, publish('pt')), 'A tua avaliação desta partida já foi guardada e não pode ser alterada.');
  assert.equal(say('en', closed, publish('en')), i18n.t('matches:publish.error'));
  assert.match(say('en', http(409)), /earlier change/);
  assert.match(say('en', http(400, { errors: { Name: ['The Name field is required.'] } })), /isn't valid/);
});

test('technical server text never reaches people', () => {
  const leak = http(400, { message: 'System.InvalidOperationException: Sequence contains no elements\n   at Foo.Bar()' });
  assert.match(say('pt', leak, 'Não foi possível guardar.'), /^Não foi possível guardar\.$/);
  assert.match(say('pt', http(502, '<html><body>Bad gateway</body></html>')), /problema/);
  assert.match(say('pt', http(500, { message: 'Erro interno no servidor. Tente novamente mais tarde.' })), /^O servidor encontrou um problema/);
});

test('an error the app wrote itself keeps its translated text', () => {
  assert.equal(say('en', new Error("Couldn't record the match.")), "Couldn't record the match.");
  assert.match(say('en', new Error('Request failed with status code 500')), /Something went wrong/);
});

test('a deleted account shows translated, never the stored marker; other text untouched', () => {
  const { presentDeletedAccounts } = loadApi();
  const data = { players: [{ userId: 'a', userName: 'deleted:1bf74bdb' }, { userId: 'b', userName: 'Teste-autor' }], name: 'Sessão de sábado', note: 'deleted:1bf74bdb' };
  i18n.language = 'pt'; let out = presentDeletedAccounts(data);
  assert.equal(out.players[0].userName, 'Conta eliminada'); assert.equal(out.players[1].userName, 'Teste-autor');
  assert.equal(out.name, 'Sessão de sábado'); assert.equal(out.note, 'deleted:1bf74bdb', 'only fields that hold a name');
  i18n.language = 'en'; out = presentDeletedAccounts(data);
  assert.equal(out.players[0].userName, 'Deleted account');
});

test('titles a deleted account wrote in shared records show a neutral, translated title; real names untouched', () => {
  const { presentDeletedAccounts } = loadApi();
  const data = { name: 'deleted:session:2026-10-17', campaignName: 'deleted:campaign', sessions: [{ name: 'Noite de jogos' }], note: 'deleted:campaign' };
  i18n.language = 'pt'; let out = presentDeletedAccounts(data);
  assert.equal(out.name, 'Sessão de 17 out. 2026'); assert.equal(out.campaignName, 'Campanha sem título');
  assert.equal(out.sessions[0].name, 'Noite de jogos'); assert.equal(out.note, 'deleted:campaign', 'only fields that hold a name');
  i18n.language = 'en'; out = presentDeletedAccounts(data);
  assert.equal(out.name, 'Session on 17 Oct 2026'); assert.equal(out.campaignName, 'Untitled campaign');
  i18n.language = 'pt';
});

test('a repeated photo report: the server\'s «Já denunciaste esta fotografia.» reaches the person (PT)', () => {
  assert.equal(say('pt', http(409, { message: 'Já denunciaste esta fotografia.' }), 'Não foi possível enviar a denúncia.'), 'Já denunciaste esta fotografia.');
});
