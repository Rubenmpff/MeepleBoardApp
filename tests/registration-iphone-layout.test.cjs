const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderNative } = require('./helpers/renderNative.cjs');
const dateFields = 'src/features/games/matches/components/MatchDateFields.tsx';
const form = 'src/features/games/matches/components/RegisterMatchForm.tsx';
const result = 'src/features/games/matches/components/MatchResultFields.tsx';
const value = new Date('2026-10-06T12:34:00Z');
const me = { id: 'me', userName: 'Author' };
const players = [{ id: 'me', username: 'Author', score: '-17', isWinner: true }, { id: 'peer', username: 'Peer', score: '0', isWinner: false }];
const session = { id: 'session', name: 'Test context', scheduledStartDate: '2026-09-01T23:30:00Z', status: 'Active', players: [{ userId: 'me', userName: 'Author', status: 'Accepted' }, { userId: 'peer', userName: 'Peer', status: 'Accepted' }] };
const formStates = { 0: session, 2: 2, 3: { id: 'game', name: 'Fixture game' }, 4: false, 8: players, 12: 7.5, 23: true, 24: value };

function contrast(a, b) {
  const luminance = hex => {
    const c = hex.slice(1).match(/../g).map(s => parseInt(s, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return c[0] * .2126 + c[1] * .7152 + c[2] * .0722;
  };
  const l = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l[0] + .05) / (l[1] + .05);
}

test('date and time always have visible labels/actions and no initial calendar in either iPhone theme', async () => {
  for (const colorScheme of ['light', 'dark']) {
    const opened = [];
    const view = await renderNative(dateFields, 'default', { value, picker: null, locale: 'pt-PT', onChange() {}, onPickerChange: mode => opened.push(mode) }, { colorScheme });
    assert.equal(view.datePickers.length, 0);
    assert.match(view.html, /Data da partida/); assert.match(view.html, /Hora da partida/);
    assert.match(view.html, /Alterar data/); assert.match(view.html, /Alterar hora/);
    await view.press('Alterar data'); await view.press('Alterar hora'); assert.deepEqual(opened, ['date', 'time']);
  }
});

test('native calendar/wheel appearance matches a contrasting surface in light and dark, with explicit Done/Cancel', async () => {
  for (const colorScheme of ['light', 'dark']) {
    for (const picker of ['date', 'time']) {
      const modes = [], changes = [];
      const view = await renderNative(dateFields, 'default', { value, picker, locale: 'pt-PT', onChange: v => changes.push(v), onPickerChange: mode => modes.push(mode) }, { colorScheme });
      const native = view.datePickers[0]; const palette = view.load(dateFields).nativePickerPalette(colorScheme);
      assert.equal(native.themeVariant, colorScheme); assert.equal(native.textColor, palette.text);
      assert.equal(native.accentColor, palette.accent);
      assert.ok(contrast(palette.text, palette.background) > 4.5); assert.ok(contrast(palette.accent, palette.background) > 4.5);
      assert.equal(native.display, picker === 'date' ? 'inline' : 'spinner');
      await view.press('Cancelar'); assert.deepEqual(modes, [null]); assert.equal(changes.length, 0);
      await view.press('Concluir'); assert.equal(changes.length, 1); assert.equal(modes.at(-1), null);
    }
  }
});

test('date/time selection is tentative until Done and preserves the independently edited counterpart', async () => {
  for (const picker of ['date', 'time']) {
    const changes = [], modes = [];
    const chosen = new Date('2026-09-02T08:15:00Z');
    const initial = await renderNative(dateFields, 'default', { value, picker, locale: 'pt-PT', onChange: d => changes.push(d), onPickerChange: mode => modes.push(mode) });
    initial.datePickers[0].onChange({}, chosen);
    assert.equal(changes.length, 0); assert.deepEqual(initial.updates.find(([i]) => i === 0), [0, chosen]);
    const updated = await renderNative(dateFields, 'default', { value, picker, locale: 'pt-PT', onChange: d => changes.push(d), onPickerChange: mode => modes.push(mode) }, { states: { 0: chosen } });
    await updated.press('Concluir');
    const saved = changes[0];
    if (picker === 'date') {
      assert.equal(saved.getDate(), chosen.getDate()); assert.equal(saved.getHours(), value.getHours()); assert.equal(saved.getMinutes(), value.getMinutes());
    } else {
      assert.equal(saved.getDate(), value.getDate()); assert.equal(saved.getHours(), chosen.getHours()); assert.equal(saved.getMinutes(), chosen.getMinutes());
    }
    assert.deepEqual(modes, [null]);
  }
});

test('narrow screen or large text uses the native wheel instead of clipping an inline calendar', async () => {
  for (const options of [{ width: 320 }, { fontScale: 1.8 }]) {
    const view = await renderNative(dateFields, 'default', { value, picker: 'date', locale: 'pt-PT', onChange() {}, onPickerChange() {} }, options);
    assert.equal(view.datePickers[0].display, 'spinner');
  }
});

test('session load initializes only the local calendar day; step navigation does not reset drafted date', async () => {
  const view = await renderNative(form, 'default', { sessionId: session.id, currentUser: me }, { states: formStates, captureEffects: true, services: { getById: session } });
  view.effects[1](); await new Promise(setImmediate);
  const initialized = view.updates.find(([i]) => i === 24)[1];
  assert.equal(initialized.getDate(), new Date(session.scheduledStartDate).getDate());
  assert.equal(initialized.getHours(), value.getHours()); assert.equal(initialized.getMinutes(), value.getMinutes());
  const before = view.updates.filter(([i]) => i === 24).length;
  view.effects[0](); assert.equal(view.updates.filter(([i]) => i === 24).length, before);
  assert.deepEqual(view.updates.filter(([i]) => i === 25).at(-1), [25, null]);
});

test('late session response cannot overwrite an explicitly confirmed draft date', async () => {
  let resolve; const response = new Promise(r => { resolve = r; });
  const view = await renderNative(form, 'default', { sessionId: session.id, currentUser: me }, { states: { ...formStates, 25: 'date' }, captureEffects: true, services: { getById: () => response } });
  view.effects[1](); await view.press('Concluir');
  resolve(session); await new Promise(setImmediate);
  assert.deepEqual(view.updates.filter(([i]) => i === 24), [[24, value]]);
});

test('quick registration starts at current date, never at a stale session day', async () => {
  const before = Date.now();
  // Use the real initializer rather than override it with an undefined fixture.
  const quick = await renderNative(form, 'default', { currentUser: me }, { states: { 2: 2, 3: formStates[3], 4: false, 8: players, 12: 7.5 }, captureEffects: true });
  await quick.press('Alterar data');
  assert.equal(quick.datePickers.length, 0);
  assert.deepEqual(quick.updates.find(([i]) => i === 25), [25, 'date']);
  assert.ok(quick.html.includes(new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })));
  const review = await renderNative(form, 'default', { currentUser: me }, { states: { 2: 3, 3: formStates[3], 4: false, 8: players, 12: 7.5 } });
  await review.press('Guardar partida');
  const savedDate = new Date(review.calls.find(c => c[0] === 'submitMatch')[1].matchDate);
  assert.ok(savedDate.getTime() >= before && savedDate.getTime() <= Date.now());
});

test('compact winner controls remain manual with zero/negative input; larger text exposes the same accessible fields', async () => {
  for (const options of [{}, { width: 320, fontScale: 1.8 }]) {
    const changes = [];
    const view = await renderNative(result, 'default', { players, scoresEnabled: true, competitive: true, showErrors: false, onChange: p => changes.push(p), onScoresEnabled() {} }, options);
    assert.doesNotMatch(view.html, /Marcar como vencedor/); assert.match(view.html, /Vencedor/);
    const winners = view.controls.filter(p => p.accessibilityRole === 'radio' && p.accessibilityLabel?.startsWith('Marcar'));
    assert.equal(winners.length, 2); assert.deepEqual(winners.map(p => p.accessibilityState.selected), [true, false]);
    await view.press('Marcar Peer como vencedor');
    assert.deepEqual(changes[0].map(p => p.isWinner), [false, true]);
    assert.deepEqual(changes[0].map(p => p.score), ['-17', '0']);
    assert.equal(view.inputs.find(p => p.accessibilityLabel === 'Pontuação de Author').value, '-17');
    assert.equal(view.inputs.find(p => p.accessibilityLabel === 'Pontuação de Peer').value, '0');
  }
});

test('required rating is compact and preserves half points, explicit zero and an omitted value', async () => {
  const component = 'src/features/games/matches/components/MatchRatingField.tsx';
  for (const [value, direction, expected] of [[7.5, 'Aumentar avaliação', 8], [0, 'Aumentar avaliação', .5], [10, 'Diminuir avaliação', 9.5], [undefined, 'Diminuir avaliação', 0]]) {
    const changes = [];
    const view = await renderNative(component, 'default', { value, onChange: v => changes.push(v) });
    await view.press(direction); assert.deepEqual(changes, [expected]);
    if (value !== undefined) { await view.press('Sem avaliação'); assert.equal(changes.at(-1), undefined); }
  }
});

test('short landscape dialog keeps Done/Cancel outside the scrolling calendar', async () => {
  const view = await renderNative(dateFields, 'default', { value, picker: 'date', locale: 'pt-PT', onChange() {}, onPickerChange() {} }, { width: 844, height: 390 });
  const scroll = view.nativeViews.find(([type]) => type === 'scroll')[1];
  const content = require('react-dom/server').renderToStaticMarkup(require('react').createElement(require('react').Fragment, null, scroll.children));
  assert.doesNotMatch(content, /Concluir|Cancelar/);
  assert.match(view.html, /Concluir/); assert.match(view.html, /Cancelar/);
});
