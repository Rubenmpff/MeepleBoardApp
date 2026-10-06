const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { renderNative } = require('./helpers/renderNative.cjs');
const screen = name => `src/features/auth/screens/${name}/index.tsx`;
const hooks = ['useSignIn', 'useRegister', 'useForgotPassword', 'useResetPassword'].map(name => `src/features/auth/hooks/${name}.ts`);
const render = (name, options = {}) => renderNative(screen(name), 'default', {}, { stateModules: hooks, ...options });
const password = 'Example1!'; // Isolated test fixture, never submitted to a real API.
const signInStates = { 0: ' TEST@example.org ', 1: password, 2: true };
const signUpStates = { 0: ' Player ', 1: ' TEST@example.org ', 2: password, 3: password, 4: true };
const resetStates = { 0: password, 1: password };
const linkParams = { token: 'test%2Bvalue', email: ' TEST@example.org ' };
const flushEffects = async r => {
  const cleanups = r.effects.map(effect => effect()).filter(fn => typeof fn === 'function');
  await new Promise(resolve => setImmediate(resolve));
  return () => cleanups.forEach(fn => fn());
};

test('Welcome preserves logo, existing destinations and legal URLs in PT/EN', async () => {
  for (const language of ['pt', 'en']) {
    const r = await render('welcome', { language });
    await r.press(language === 'pt' ? 'Entrar' : 'Log in');
    await r.press(language === 'pt' ? 'Criar conta' : 'Sign up');
    assert.deepEqual(r.routes, ['/signin', '/signup']);
    for (const key of ['terms', 'privacy', 'guidelines']) await r.press(r.i18n.t(`auth:welcome.${key}`));
    assert.deepEqual(r.calls.filter(x => x[0] === 'openURL').map(x => x[1]), [
      'https://meepleboard.com/terms', 'https://meepleboard.com/privacy', 'https://meepleboard.com/guidelines',
    ]);
    assert.equal(r.images[0].accessibilityLabel, 'MeepleBoard');
  }
});
test('All six screens render translated headings with shared keyboard scrolling at small sizes', async () => {
  for (const language of ['pt', 'en']) for (const name of ['welcome', 'signin', 'signup', 'confirm-email', 'forgot-password', 'reset-password']) {
    const r = await render(name, { language, width: 320, fontScale: 2 });
    assert.doesNotMatch(r.html, /auth:|signIn\.title|confirmEmail\.title/);
    assert.equal(r.images[0].accessibilityLabel, 'MeepleBoard');
    assert.equal(r.nativeViews.find(x => x[0] === 'scroll')[1].keyboardShouldPersistTaps, 'handled');
    assert.equal(r.nativeViews.find(x => x[0] === 'keyboard')[1].behavior, 'padding');
  }
  const android = await render('signup', { platform: 'android' });
  assert.equal(android.nativeViews.find(x => x[0] === 'keyboard')[1].behavior, 'height');
});
test('Sign-in preserves email normalization, raw password, remember flag and success navigation', async () => {
  const r = await render('signin', { states: { ...signInStates, 1: ' Example1! ' }, services: { login: { success: true } } });
  await r.press('Entrar');
  assert.deepEqual(r.calls.find(x => x[0] === 'login'), ['login', { email: 'test@example.org', password: ' Example1! ' }, true]);
  assert.deepEqual(r.routes, [['replace', '/dashboard']]);
  assert.equal(r.inputs[0].keyboardType, 'email-address'); assert.equal(r.inputs[1].autoComplete, 'password');
});
test('Sign-in validation rejects blank fields and invalid emails without requests', async () => {
  for (const states of [{}, { 0: 'invalid', 1: password }]) {
    const r = await render('signin', { states }); await r.press('Entrar');
    assert.ok(r.updates.some(x => x[0] === 4 && x[1])); assert.ok(!r.calls.some(x => x[0] === 'login'));
  }
});
test('Sign-in retains failure classification, back navigation, recovery and password visibility', async () => {
  const r = await render('signin', { states: signInStates, services: { login: { success: false, message: 'Email not confirmed' } } });
  await r.press('Entrar'); assert.ok(r.updates.some(x => x[0] === 5 && x[1] === true));
  await r.press('Mostrar palavra-passe'); assert.deepEqual(r.updates.at(-1), [10, true]);
  await r.press('Esqueceste-te da palavra-passe?'); await r.press('Voltar ao ecrã inicial');
  assert.deepEqual(r.routes, ['/forgot-password', ['replace', '/welcome']]);
  const shown = await render('signin', { states: { ...signInStates, 10: true } });
  assert.equal(shown.inputs[1].secureTextEntry, false);
});
test('Busy sign-in and cooldown prevent presses and expose the existing message', async () => {
  const r = await render('signin', { states: { 3: true, 4: 'Mensagem real', 5: true, 8: 30 } });
  assert.match(r.html, /Mensagem real/); assert.match(r.html, /30 s/);
  await assert.rejects(r.press('Entrar'), /Disabled button/);
  await assert.rejects(r.press('Voltar a enviar email de confirmação'), /Disabled button/);
  assert.equal(r.controls.find(x => x.accessibilityLabel === 'Entrar').accessibilityState.busy, true);
});
test('Resend keeps the existing email, successful cooldown and attempt count', async () => {
  const r = await render('signin', { states: { 0: ' TEST@example.org ', 5: true }, captureEffects: true, services: { resendConfirmationEmail: { success: true } } });
  const cleanup = await flushEffects(r);
  try {
    await r.press('Voltar a enviar email de confirmação');
    assert.deepEqual(r.calls.find(x => x[0] === 'resendConfirmationEmail'), ['resendConfirmationEmail', 'test@example.org']);
    assert.ok(r.updates.some(x => x[0] === 8 && x[1] === 60));
    assert.ok(r.updates.some(x => x[0] === 9 && x[1] === 1));
  } finally { cleanup(); }
});
test('Existing resend attempt limit remains a local guard', async () => {
  const r = await render('signin', { states: { 5: true, 9: 3 } });
  await r.press('Voltar a enviar email de confirmação');
  assert.ok(!r.calls.some(x => x[0] === 'resendConfirmationEmail'));
  assert.equal(r.calls.find(x => x[0] === 'toast')[1].text1, 'Limite diário atingido');
});
test('Sign-in hardware back retains welcome replacement and listener cleanup', async () => {
  const r = await render('signin', { captureEffects: true });
  const cleanup = await flushEffects(r);
  assert.equal(r.calls.find(x => x[0] === 'backHandler')[2](), true);
  assert.deepEqual(r.routes, [['replace', '/welcome']]); cleanup();
  assert.ok(r.calls.some(x => x[0] === 'removeBackHandler'));
});
test('Registration keeps its existing payload, consent and sign-in destination', async () => {
  const r = await render('signup', { states: signUpStates, services: { register: { success: true } } });
  await r.press('Criar conta');
  assert.deepEqual(r.calls.find(x => x[0] === 'register'), ['register', { username: 'Player', email: 'test@example.org', password, isMobile: true }]);
  assert.deepEqual(r.routes, [['replace', '/signin']]);
  assert.equal(r.switches[0].value, true); assert.equal(r.inputs[2].autoComplete, 'new-password');
  assert.doesNotMatch(r.html, /Google|Apple|Ou cria conta com/);
});
test('Registration retains all existing validations without API writes', async () => {
  for (const patch of [{ 0: '' }, { 1: 'invalid' }, { 2: 'weak', 3: 'weak' }, { 3: 'Different1!' }, { 4: false }]) {
    const r = await render('signup', { states: { ...signUpStates, ...patch } }); await r.press('Criar conta');
    assert.ok(r.calls.some(x => x[0] === 'toast' && x[1].type === 'error'));
    assert.ok(!r.calls.some(x => x[0] === 'register'));
  }
});
test('Registration retains both visibility toggles, consent editing and back action', async () => {
  const r = await render('signup');
  await r.press('Mostrar palavra-passe'); await r.press('Mostrar confirmação da palavra-passe');
  assert.deepEqual(r.updates.slice(-2), [[6, true], [7, true]]);
  r.switches[0].onValueChange(true); assert.deepEqual(r.updates.at(-1), [4, true]);
  await r.press('Voltar'); assert.deepEqual(r.routes, ['back']);
});
test('Recovery retains email validation, normalization, failure message and success navigation', async () => {
  for (const value of ['', 'invalid']) {
    const r = await render('forgot-password', { states: { 0: value } });
    await r.press('Enviar ligação para recuperar a palavra-passe');
    assert.ok(!r.calls.some(x => x[0] === 'forgotPassword'));
  }
  const r = await render('forgot-password', { states: { 0: ' TEST@example.org ' }, services: { forgotPassword: { success: true } } });
  await r.press('Enviar ligação para recuperar a palavra-passe');
  assert.deepEqual(r.calls.find(x => x[0] === 'forgotPassword'), ['forgotPassword', 'test@example.org']);
  assert.deepEqual(r.routes, [['replace', '/signin']]);
  const failed = await render('forgot-password', { states: { 0: 'test@example.org' }, services: { forgotPassword: { success: false, message: 'Email not confirmed' } } });
  await failed.press('Enviar ligação para recuperar a palavra-passe');
  assert.equal(failed.calls.find(x => x[0] === 'toast')[1].text1, 'Email não confirmado');
});
test('Reset retains first array params, token handling, password trimming and success destination', async () => {
  const r = await render('reset-password', { params: { token: [linkParams.token, 'unused'], email: [linkParams.email, 'unused'] },
    states: { 0: ' Example1! ', 1: ' Example1! ' }, services: { resetPassword: { success: true } } });
  await r.press('Submeter nova palavra-passe');
  assert.deepEqual(r.calls.find(x => x[0] === 'resetPassword'), ['resetPassword', {
    email: 'test@example.org', token: 'test+value', password, confirmPassword: password,
  }]);
  assert.deepEqual(r.routes, [['replace', '/signin']]);
});
test('Reset keeps missing, mismatch and strength validation and expired-link recovery', async () => {
  for (const states of [{}, { 0: password, 1: 'Different1!' }, { 0: 'weak', 1: 'weak' }]) {
    const r = await render('reset-password', { params: linkParams, states }); await r.press('Submeter nova palavra-passe');
    assert.ok(!r.calls.some(x => x[0] === 'resetPassword')); assert.ok(r.calls.some(x => x[0] === 'toast'));
  }
  const r = await render('reset-password', { params: linkParams, states: resetStates, services: { resetPassword: { success: false, message: 'invalid token' } } });
  await r.press('Submeter nova palavra-passe'); assert.deepEqual(r.routes, [['replace', '/forgot-password']]);
});
test('Reset missing link redirects through the existing effect; password visibility remains independent', async () => {
  const r = await render('reset-password', { params: {}, captureEffects: true }); await flushEffects(r);
  assert.deepEqual(r.routes, [['replace', '/forgot-password']]);
  await r.press('Mostrar palavra-passe'); await r.press('Mostrar confirmação da palavra-passe');
  assert.deepEqual(r.updates.slice(-2), [[3, true], [4, true]]);
});
test('Confirmation keeps email/token normalization and response handling', async () => {
  const r = await render('confirm-email', { params: linkParams, captureEffects: true, services: { confirmEmail: { success: true } } });
  await flushEffects(r);
  assert.deepEqual(r.calls.find(x => x[0] === 'confirmEmail'), ['confirmEmail', 'test+value', 'test@example.org']);
  assert.ok(r.updates.some(x => x[0] === 1 && x[1] === true));
  const missing = await render('confirm-email', { params: {}, captureEffects: true }); await flushEffects(missing);
  assert.ok(!missing.calls.some(x => x[0] === 'confirmEmail'));
  assert.ok(missing.updates.some(x => x[0] === 1 && x[1] === false));
});
test('Confirmation success and failure keep their destinations and truthful button labels', async () => {
  const success = await render('confirm-email', { states: { 0: false, 1: true, 2: 'Email confirmado' } });
  await success.press('Entrar agora'); assert.deepEqual(success.routes, [['replace', '/(auth)/signin']]);
  const failed = await render('confirm-email', { language: 'en', states: { 0: false, 1: false, 2: 'Server response' } });
  assert.match(failed.html, /Server response/); await failed.press('Back to welcome');
  assert.deepEqual(failed.routes, [['replace', '/welcome']]);
});
test('Registration, recovery and reset prevent duplicate button presses while busy', async () => {
  for (const [name, states, label] of [
    ['signup', { 5: true }, 'Criar conta'],
    ['forgot-password', { 1: true }, 'Enviar ligação para recuperar a palavra-passe'],
    ['reset-password', { 2: true }, 'Submeter nova palavra-passe'],
  ]) {
    const r = await render(name, { states }); await assert.rejects(r.press(label), /Disabled button/);
    assert.equal(r.controls.find(x => x.accessibilityLabel === label).accessibilityState.busy, true);
  }
});
test('Authentication translations have matching PT/EN keys', () => {
  const read = lang => JSON.parse(fs.readFileSync(`src/i18n/locales/${lang}/auth.json`, 'utf8'));
  const keys = (value, prefix = '') => Object.entries(value).flatMap(([key, child]) => typeof child === 'object' ? keys(child, prefix + key + '.') : [prefix + key]);
  assert.deepEqual(keys(read('pt')).sort(), keys(read('en')).sort());
});
