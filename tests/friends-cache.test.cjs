const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function fixture() {
  let token = 'author-session', data = [{ id: 'peer', userName: 'Teste-participante' }], reads = 0, states;
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('src/features/friends/hooks/useFriends.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, console: { error() {} }, require(name) {
    if (name === 'react') return {
      useState(value) { const index = states.length; states.push(value); const target = states; return [value, next => target[index] = next]; },
      useCallback: fn => fn, useEffect() {},
    };
    if (name === 'react-i18next') return { useTranslation: () => ({ t: key => key }) };
    if (name === 'expo-secure-store') return { getItemAsync: async () => token };
    return { getMyFriends: async () => { reads++; return typeof data === 'function' ? data() : data; } };
  } });
  return {
    mount() { states = []; return { hook: module.exports.useFriends(), states }; },
    account(value, friends) { token = value; data = friends; },
    reads: () => reads,
    invalidate: module.exports.invalidateFriendsCache,
  };
}

test('friend cache never supplies another login and new forms start without cached names', async () => {
  const f = fixture(), author = f.mount();
  await author.hook.refetch(true);
  assert.equal(author.states[0][0].userName, 'Teste-participante');
  const next = f.mount();
  assert.equal(next.states[0].length, 0);
  f.account('member-session', [{ id: 'author', userName: 'Teste-autor' }]);
  await next.hook.refetch(false);
  assert.equal(f.reads(), 2);
  assert.equal(next.states[0][0].userName, 'Teste-autor');
});

test('forced reload refreshes friends, invalidation refreshes same-account cache', async () => {
  const f = fixture(), view = f.mount();
  await view.hook.refetch(true);
  await view.hook.refetch(false);
  assert.equal(f.reads(), 1);
  f.account('author-session', [{ id: 'new', userName: 'New friend' }]);
  await view.hook.refetch(true);
  assert.equal(view.states[0][0].id, 'new');
  f.invalidate();
  await view.hook.refetch(false);
  assert.equal(f.reads(), 3);
});

test('response after account switch is discarded and network failures clear stale names', async () => {
  const f = fixture(), view = f.mount();
  f.account('author-session', () => { f.account('different-session', []); return [{ id: 'private-friend' }]; });
  await view.hook.refetch(true);
  assert.equal(view.states[0].length, 0);
  f.account('different-session', () => { throw Error('isolated failure'); });
  await view.hook.refetch(true);
  assert.equal(view.states[0].length, 0);
  assert.equal(view.states[2], 'errors.load');
  assert.equal(view.states[1], false);
});
