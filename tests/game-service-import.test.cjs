// Finding or importing a game by BGG id: one import request, which the API answers with the local game when it
// already exists (no duplicate, no BGG call) and imports only when missing. No request to a route that does not exist.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function loadGameService(respond) {
  const calls = [];
  const filename = path.resolve('src/features/games/catalog/services/gameService.ts');
  const module = new Module(filename);
  module.require = id => {
    if (id.endsWith('/services/api')) return { __esModule: true, default: {
      get: async (...args) => { calls.push(['get', ...args]); return respond('get', ...args); },
      post: async (...args) => { calls.push(['post', ...args]); return respond('post', ...args); },
    } };
    throw new Error('Unexpected service dependency: ' + id);
  };
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
  return { service: module.exports.default, calls };
}

test('a BGG id is resolved with one import request, never with the missing /game/by-bgg route', async () => {
  const local = { id: 'local-game', name: 'Wingspan', bggId: 266192 };
  const { service, calls } = loadGameService(() => ({ data: local }));
  const game = await service.searchOrImportByBggId(266192);
  assert.deepEqual(game, local);
  assert.deepEqual(calls, [['post', '/game/import/266192']]);
  assert.ok(!('getByBggId' in service));
});

test('an import failure still reaches the caller, as before', async () => {
  const { service, calls } = loadGameService(() => { throw new Error('offline'); });
  await assert.rejects(() => service.searchOrImportByBggId(1), /offline/);
  assert.equal(calls.length, 1);
});
