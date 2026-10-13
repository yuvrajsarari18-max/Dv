import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays, diffDays, getCycleDetails, getCycleLengths, getMonthDays,
  getPhaseForDay, localDateString, createDefaultData
} from './cycle.js';

test('local date helpers avoid UTC day shifts', () => {
  assert.equal(localDateString(new Date(2026, 9, 12, 12)), '2026-10-12');
  assert.equal(addDays('2026-10-12', 1), '2026-10-13');
  assert.equal(diffDays('2026-10-12', '2026-10-13'), 1);
});

test('phase ranges reflect the supplied video without double-counting shared days', () => {
  assert.equal(getPhaseForDay(1).id, 'menstrual');
  assert.equal(getPhaseForDay(6).id, 'menstrual');
  assert.equal(getPhaseForDay(7).id, 'follicular');
  assert.equal(getPhaseForDay(13).id, 'follicular');
  assert.equal(getPhaseForDay(14).id, 'ovulation');
  assert.equal(getPhaseForDay(15).id, 'luteal');
  assert.equal(getPhaseForDay(24).id, 'luteal');
  assert.equal(getPhaseForDay(25).id, 'pms');
  assert.equal(getPhaseForDay(28).id, 'pms');
});

test('seeded 12 October start gives cycle day 2 on 13 October', () => {
  const data = createDefaultData();
  const details = getCycleDetails('2026-10-13', data);
  assert.equal(details.cycleDay, 2);
  assert.equal(details.phase.id, 'menstrual');
  assert.equal(details.nextPeriod, '2026-11-09');
});

test('cycle calculation wraps after the expected length', () => {
  const data = { ...createDefaultData(), periodStarts: ['2026-10-12'], cycleLength: 28 };
  const details = getCycleDetails('2026-11-09', data);
  assert.equal(details.cycleDay, 1);
  assert.equal(details.cycleStart, '2026-11-09');
});

test('actual later period start resets the current cycle anchor', () => {
  const data = { ...createDefaultData(), periodStarts: ['2026-10-12', '2026-11-07'] };
  const details = getCycleDetails('2026-11-08', data);
  assert.equal(details.cycleDay, 2);
  assert.equal(details.cycleStart, '2026-11-07');
  assert.deepEqual(getCycleLengths(data.periodStarts), [26]);
});

test('month calendar returns a Monday-aligned grid with padding', () => {
  const cells = getMonthDays(new Date(2026, 9, 1, 12));
  assert.equal(cells[0], null); // 1 October 2026 is Thursday, week begins Monday
  assert.equal(cells.filter(Boolean).length, 31);
  assert.equal(cells.length % 7, 0);
});
