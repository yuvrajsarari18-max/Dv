export const VIDEO_PHASES = [
  {
    id: 'menstrual',
    name: 'Menstrual phase',
    shortName: 'Period',
    range: 'Days 1–6',
    color: '#d85f80',
    soft: '#fde7ec',
    emoji: '🩸',
    title: 'Slow down & soften',
    signs: ['Bleeding', 'Cramps', 'Headache', 'Low energy', 'Irritability'],
    care: 'A warm compress, water, simple meals, and rest may help. Gentle movement is optional—listen to what feels okay.',
    mood: 'Energy may feel lower or emotions more sensitive. It is also normal to feel completely fine.'
  },
  {
    id: 'follicular',
    name: 'Follicular phase',
    shortName: 'Follicular',
    range: 'Days 6–13',
    color: '#d49c43',
    soft: '#fff2d7',
    emoji: '🌱',
    title: 'Fresh-start energy',
    signs: ['Fresh / relaxed', 'Mood uplift', 'Confidence may rise'],
    care: 'If energy returns, use it for plans or movement. There is no need to force productivity if it does not.',
    mood: 'The video describes feeling fresh, relaxed, uplifted, or confident. These are possibilities, not a mood forecast.'
  },
  {
    id: 'ovulation',
    name: 'Ovulation',
    shortName: 'Ovulation',
    range: 'Day 14',
    color: '#58a98b',
    soft: '#e0f5ed',
    emoji: '✨',
    title: 'A possible high-energy window',
    signs: ['Mood may lift', 'Confidence', 'Libido may change'],
    care: 'Some people notice more energy, social confidence, or a change in sex drive; many do not notice a clear change.',
    mood: 'The video calls it a “super happy phase.” Feelings are individual, and an app cannot predict someone’s mood.'
  },
  {
    id: 'luteal',
    name: 'Luteal phase',
    shortName: 'Luteal',
    range: 'Days 15–24*',
    color: '#8a79c9',
    soft: '#eee9ff',
    emoji: '🌙',
    title: 'Check in with yourself',
    signs: ['Energy may shift', 'Bloating can happen', 'Mood may vary'],
    care: 'Regular meals, sleep, hydration, and a lighter schedule on harder days may help. Track your own pattern over several cycles.',
    mood: 'The video’s Luteal label ends at day 25. Since its PMS label also starts at day 25, Luna uses day 25 as PMS to avoid overlap.'
  },
  {
    id: 'pms',
    name: 'PMS window',
    shortName: 'PMS',
    range: 'Days 25–28',
    color: '#8d9acb',
    soft: '#e9eefc',
    emoji: '☁️',
    title: 'Extra kindness, no assumptions',
    signs: ['Cravings', 'Bloating', 'Irritability', 'Tenderness', 'Possible nausea'],
    care: 'Notice what actually helps. Persistent vomiting, severe pain, fainting, or unusually heavy bleeding deserves medical attention.',
    mood: 'PMS symptoms can appear before a period, but not everyone gets them. Never assume a feeling or behaviour from the calendar.'
  }
];

export const MOODS = [
  { id: 'happy', label: 'Happy', emoji: '😊' },
  { id: 'calm', label: 'Calm', emoji: '😌' },
  { id: 'energetic', label: 'Energetic', emoji: '⚡' },
  { id: 'sensitive', label: 'Sensitive', emoji: '🥹' },
  { id: 'irritable', label: 'Irritable', emoji: '😤' },
  { id: 'low', label: 'Low', emoji: '🌧️' },
  { id: 'anxious', label: 'Anxious', emoji: '🫨' },
  { id: 'tired', label: 'Tired', emoji: '😴' }
];

export const SYMPTOMS = [
  'Cramps', 'Headache', 'Low energy', 'Bloating', 'Cravings',
  'Breast tenderness', 'Acne', 'Backache', 'Nausea', 'No symptoms'
];

export function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDate(dateString) {
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function addDays(dateString, amount) {
  const date = parseLocalDate(dateString);
  date.setDate(date.getDate() + amount);
  return localDateString(date);
}

export function diffDays(from, to) {
  return Math.round((parseLocalDate(to).getTime() - parseLocalDate(from).getTime()) / 86400000);
}

export function formatDate(dateString, options = { day: 'numeric', month: 'short' }) {
  if (!dateString) return 'Not set';
  return parseLocalDate(dateString).toLocaleDateString('en-IN', options);
}

export function getPhaseForDay(day) {
  if (day >= 1 && day <= 6) return VIDEO_PHASES[0];
  if (day >= 7 && day <= 13) return VIDEO_PHASES[1];
  if (day === 14) return VIDEO_PHASES[2];
  if (day >= 15 && day <= 24) return VIDEO_PHASES[3];
  return VIDEO_PHASES[4];
}

export function getCycleDetails(dateString, data) {
  const starts = [...(data.periodStarts || [])].filter(Boolean).sort();
  const start = starts.filter(item => item <= dateString).at(-1);
  if (!start) return null;
  const cycleLength = Number(data.cycleLength) || 28;
  const diff = Math.max(0, diffDays(start, dateString));
  const elapsedCycles = Math.floor(diff / cycleLength);
  const cycleDay = (diff % cycleLength) + 1;
  const cycleStart = addDays(start, elapsedCycles * cycleLength);
  const nextPeriod = addDays(cycleStart, cycleLength);
  const phase = getPhaseForDay(cycleDay);
  const isPredictedPeriod = cycleDay <= Number(data.periodLength || 6) && !starts.includes(dateString);
  return { start, cycleStart, cycleDay, phase, nextPeriod, diff, isPredictedPeriod };
}

export function getCycleLengths(starts) {
  const sorted = [...new Set(starts || [])].sort();
  return sorted.slice(1).map((date, index) => diffDays(sorted[index], date)).filter(n => n > 0 && n < 100);
}

export function getMonthDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1, 12);
  const lastDay = new Date(year, month + 1, 0, 12).getDate();
  const mondayOffset = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < mondayOffset; i++) cells.push(null);
  for (let day = 1; day <= lastDay; day++) cells.push(localDateString(new Date(year, month, day, 12)));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function createDefaultData() {
  return {
    periodStarts: ['2026-10-12'],
    cycleLength: 28,
    periodLength: 6,
    irregular: false,
    logs: {},
    theme: 'light'
  };
}
