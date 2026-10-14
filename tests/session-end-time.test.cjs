// Session start and end: local display for everyone, extend/choose for the organizer, limits and saving.
// Isolated services; nothing reaches the API or a database.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderNative } = require('./helpers/renderNative.cjs');

const source = 'src/features/games/sessions/components/SessionEndTime.tsx';
const detail = 'src/features/games/sessions/screens/GameSessionDetailScreen.tsx';
const HOUR = 3600000;
const started = new Date(Date.now() - 2 * HOUR);
const active = { id: 'session-test', name: 'Test-only session', organizerId: 'me', status: 'Active', scheduledStartDate: started.toISOString(),
  autoCloseAt: new Date(started.getTime() + 24 * HOUR).toISOString(), latestCloseAt: new Date(started.getTime() + 48 * HOUR).toISOString(),
  closeTimeChosen: false, players: [], matches: [] };
// State order in SessionEndTime: open, choice, saving, androidPicker.
const render = (session, canChange, options = {}) => renderNative(source, 'default', { session, canChange, onChanged: value => options.changed?.push(value) }, options);
// The app's own formatter, so expectations follow the device's local time zone.
let formatDateTime;
test.before(async () => { formatDateTime = (await render(active, false)).load('src/ui/format.ts').formatDateTime; });

test('everyone sees the scheduled start and the automatic end in local time; only the organizer can extend', async () => {
  for (const language of ['pt', 'en']) {
    const guest = await render(active, false, { language });
    const ends = formatDateTime(active.autoCloseAt, language);
    const starts = formatDateTime(active.scheduledStartDate, language);
    assert.ok(guest.html.includes(language === 'pt' ? `Começou ${starts}, à hora marcada` : `Started ${starts}, at the scheduled time`), guest.html);
    assert.ok(guest.html.includes(language === 'pt' ? `Termina automaticamente ${ends}` : `Ends automatically ${ends}`), guest.html);
    assert.ok(!guest.controls.some(c => /Prolongar|Extend/.test(c.accessibilityLabel ?? '')));
    const organizer = await render(active, true, { language });
    assert.ok(organizer.controls.some(c => c.accessibilityLabel === (language === 'pt' ? 'Prolongar' : 'Extend')));
    assert.ok(organizer.html.includes(formatDateTime(active.latestCloseAt, language)), 'limit shown');
  }
});

test('chosen, maximum, ended and not-yet-started states read clearly', async () => {
  const chosen = await render({ ...active, closeTimeChosen: true }, false);
  assert.match(chosen.html, /hora escolhida pelo organizador/);
  const maximum = await render({ ...active, autoCloseAt: active.latestCloseAt }, true);
  assert.match(maximum.html, /Já termina no limite de 48 horas/);
  assert.ok(!maximum.controls.some(c => c.accessibilityLabel === 'Prolongar'));
  const ended = await render({ ...active, status: 'Closed', endDate: active.autoCloseAt, closedAutomatically: true }, true);
  assert.ok(ended.html.includes(`Terminou automaticamente ${formatDateTime(active.autoCloseAt, 'pt')}`));
  assert.ok(!ended.controls.some(c => c.accessibilityLabel === 'Prolongar'), 'no changes after the end');
  const byHand = await render({ ...active, status: 'Closed', endDate: active.scheduledStartDate }, true);
  assert.ok(byHand.html.includes(`Terminou ${formatDateTime(active.scheduledStartDate, 'pt')}`) && !byHand.html.includes('automaticamente'));
});

test('before anyone confirms, start and end are already shown, with what happens without a confirmed guest', async () => {
  const later = new Date(Date.now() + 5 * HOUR), deadline = new Date(Date.now() + 3 * HOUR);
  const upcoming = { ...active, status: 'Upcoming', scheduledStartDate: later.toISOString(), effectiveDeadline: deadline.toISOString(),
    autoCloseAt: new Date(later.getTime() + 24 * HOUR).toISOString(), latestCloseAt: new Date(later.getTime() + 48 * HOUR).toISOString(),
    players: [{ userId: 'me', isOrganizer: true, status: 'Accepted' }, { userId: 'guest', isOrganizer: false, status: 'Pending' }] };
  const view = await render(upcoming, true);
  assert.ok(view.html.includes(`Começa ${formatDateTime(later, 'pt')}, à hora marcada`), view.html);
  assert.ok(view.html.includes(`Termina automaticamente ${formatDateTime(upcoming.autoCloseAt, 'pt')}, 24 horas depois`));
  assert.ok(view.html.includes(`Sem confirmações até ${formatDateTime(deadline, 'pt')}, é cancelada.`));
  assert.ok(!view.controls.some(c => c.accessibilityLabel === 'Prolongar'), 'changes only while it runs');
  const confirmed = await render({ ...upcoming, players: [upcoming.players[0], { ...upcoming.players[1], status: 'Accepted' }] }, true);
  assert.ok(!confirmed.html.includes('é cancelada') && confirmed.html.includes(`Começa ${formatDateTime(later, 'pt')}`));
  const cancelled = await render({ ...upcoming, status: 'Cancelled' }, true);
  assert.equal(cancelled.html.trim(), '');
});

test('quick choices stay inside 48 h and saving sends the chosen time', async () => {
  const nearLimit = { ...active, autoCloseAt: new Date(started.getTime() + 45 * HOUR).toISOString() };
  const view = await render(nearLimit, true, { states: { 0: true } });
  const labels = view.controls.map(c => c.accessibilityLabel);
  assert.ok(labels.includes('Mais 1 hora') && labels.includes('Até ao limite'), labels.join('|'));
  assert.ok(!labels.includes('Mais 3 horas') && !labels.includes('Mais 6 horas'), 'choices past 48 h are hidden');
  const changed = [];
  const choice = new Date(started.getTime() + 46 * HOUR);
  const save = await render(nearLimit, true, { states: { 0: true, 1: choice }, changed, services: { setCloseTime: { ...nearLimit, autoCloseAt: choice.toISOString(), closeTimeChosen: true } } });
  await save.press('Guardar');
  assert.deepEqual(save.calls.find(c => c[0] === 'setCloseTime'), ['setCloseTime', 'session-test', choice]);
  assert.equal(changed[0].autoCloseAt, choice.toISOString());
  const invalid = await render(nearLimit, true, { states: { 0: true, 1: new Date(started.getTime() + 49 * HOUR) } });
  await invalid.press('Guardar');
  assert.ok(!invalid.calls.some(c => c[0] === 'setCloseTime'), 'beyond the limit is not sent');
  assert.ok(invalid.calls.some(c => c[0] === 'alert'));
});

test('session detail shows the start and end card and keeps closing behind a confirmation', async () => {
  const view = await renderNative(detail, 'default', {}, { states: { 0: { ...active, players: [{ userId: 'me', userName: 'Me', isOrganizer: true, status: 'Accepted' }] }, 1: false }, stubRegisterForm: true });
  assert.match(view.html, /Início.*Começou.*Fim.*Termina automaticamente/);
  assert.ok(view.controls.some(c => c.accessibilityLabel === 'Prolongar'));
  assert.ok(view.controls.some(c => c.accessibilityLabel === 'Terminar sessão'));
});
