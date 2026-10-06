// Run the existing auth service against isolated adapters. No network, Expo
// SecureStore or real tokens are accessed by these tests.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function loadAuthService(responseData) {
  const calls = [];
  const filename = path.resolve('src/features/auth/services/authService.ts');
  const module = new Module(filename);
  module.require = id => {
    if (id.endsWith('/services/api')) return { __esModule: true, default: {
      post: async (...args) => { calls.push(['post', ...args]); return { data: responseData }; },
      get: async (...args) => { calls.push(['get', ...args]); return { data: responseData }; },
    } };
    if (id === 'axios') return require('axios');
    if (id === 'expo-secure-store') return { setItemAsync: async (...args) => calls.push(['secureStore', ...args]) };
    if (id === '@/src/services/tokenService') return { tokenService: { storeTokens: async (...args) => calls.push(['storeTokens', ...args]) } };
    if (id === '@/src/store/store') return { store: { dispatch: action => calls.push(['dispatch', action]) } };
    if (id === '@/src/features/auth/store/authSlice') return { setToken: token => ({ type: 'auth/setToken', payload: token }) };
    throw new Error('Unexpected service dependency: ' + id);
  };
  module._compile('const __DEV__ = false;\n' + ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
  return { service: module.exports.authService, calls };
}
for (const rememberMe of [false, true]) {
  test(`Login retains storage delegation and rememberMe=${rememberMe}`, async () => {
    const user = { id: 'fixture-user', userName: 'Fixture' };
    const r = loadAuthService({ success: true, token: 'access-fixture', refreshToken: 'refresh-fixture', user });
    const response = await r.service.login({ email: ' TEST@example.org ', password: ' Example1! ' }, rememberMe);
    assert.equal(response.success, true);
    assert.deepEqual(r.calls[0], ['post', '/auth/login', {
      email: 'test@example.org', password: ' Example1! ', deviceInfo: 'MeepleBoard Mobile App',
    }]);
    assert.deepEqual(r.calls[1], ['storeTokens', 'access-fixture', 'refresh-fixture', rememberMe]);
    assert.deepEqual(r.calls[2], ['dispatch', { type: 'auth/setToken', payload: 'access-fixture' }]);
    assert.deepEqual(r.calls[3], ['secureStore', 'current_user', JSON.stringify(user)]);
  });
}
test('Incomplete login responses never reach token storage or Redux', async () => {
  for (const data of [{ success: false }, { success: true, token: 'access-fixture' }, { success: true, token: 'access-fixture', refreshToken: 'refresh-fixture' }]) {
    const r = loadAuthService(data);
    assert.equal((await r.service.login({ email: 'test@example.org', password: 'Example1!' }, false)).success, false);
    assert.equal(r.calls.length, 1);
  }
});
test('Registration retains its endpoint, normalized identity and untrimmed password', async () => {
  const r = loadAuthService({ message: 'fixture response' });
  await r.service.register({ username: ' Player ', email: ' TEST@example.org ', password: ' Example1! ', isMobile: true });
  assert.deepEqual(r.calls[0], ['post', '/auth/register', {
    username: 'Player', email: 'test@example.org', password: ' Example1! ', isMobile: true,
  }]);
});
test('Confirmation, resend, recovery and reset retain their existing request contracts', async () => {
  const r = loadAuthService({ message: 'fixture response' });
  await r.service.confirmEmail('test%2Bvalue', ' TEST@example.org ');
  await r.service.resendConfirmationEmail(' TEST@example.org ');
  await r.service.forgotPassword(' TEST@example.org ');
  await r.service.resetPassword({ email: ' TEST@example.org ', token: 'test%2Bvalue', password: 'Example1!', confirmPassword: 'Example1!' });
  assert.deepEqual(r.calls, [
    ['get', '/auth/confirm-email', { params: { token: 'test+value', email: 'test@example.org' } }],
    ['post', '/auth/resend-confirmation', { email: 'test@example.org', isMobile: true }],
    ['post', '/auth/forgot-password', { email: 'test@example.org', isMobile: true }],
    ['post', '/auth/reset-password', { email: 'test@example.org', token: 'test+value', password: 'Example1!', confirmPassword: 'Example1!' }],
  ]);
});
