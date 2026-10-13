import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, ArrowDownRight, ArrowUpRight, CalendarDays, Check, ChevronLeft, ChevronRight,
  CircleHelp, Clock3, Droplets, Heart, HeartPulse, Info, Leaf, LockKeyhole, Menu,
  Moon, Plus, Settings2, ShieldCheck, Sparkles, Sun, TrendingUp, X, Zap
} from 'lucide-react';
import {
  VIDEO_PHASES, MOODS, SYMPTOMS, localDateString, parseLocalDate, addDays,
  diffDays, formatDate, getPhaseForDay, getCycleDetails, getCycleLengths, getMonthDays,
  createDefaultData
} from './cycle';
import './styles.css';

const STORAGE_KEY = 'luna-cycle-companion-v1';
const today = localDateString(new Date());

function readSavedData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultData();
    const saved = JSON.parse(raw);
    return { ...createDefaultData(), ...saved, periodStarts: Array.isArray(saved.periodStarts) ? saved.periodStarts : ['2026-10-12'], logs: saved.logs || {} };
  } catch {
    return createDefaultData();
  }
}

function IconButton({ label, onClick, children, className = '' }) {
  return <button type="button" aria-label={label} title={label} className={`icon-button ${className}`} onClick={onClick}>{children}</button>;
}

function SectionTitle({ eyebrow, title, action }) {
  return <div className="section-title"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2></div>{action}</div>;
}

function App() {
  const [data, setData] = useState(readSavedData);
  const [selectedDate, setSelectedDate] = useState(today);
  const [month, setMonth] = useState(() => new Date(parseLocalDate(today).getFullYear(), parseLocalDate(today).getMonth(), 1, 12));
  const [activeTab, setActiveTab] = useState('Overview');
  const [periodModal, setPeriodModal] = useState(false);
  const [periodDate, setPeriodDate] = useState(today);
  const [periodMode, setPeriodMode] = useState('new');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mood, setMood] = useState('');
  const [symptoms, setSymptoms] = useState([]);
  const [pain, setPain] = useState(0);
  const [flow, setFlow] = useState('Medium');
  const [note, setNote] = useState('');

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* local storage may be disabled */ }
  }, [data]);

  const selectedLog = data.logs[selectedDate] || {};
  useEffect(() => {
    const log = data.logs[selectedDate] || {};
    setMood(log.mood || '');
    setSymptoms(log.symptoms || []);
    setPain(Number(log.pain || 0));
    setFlow(log.flow || 'Medium');
    setNote(log.note || '');
  }, [selectedDate, data.logs]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 2700);
    return () => clearTimeout(timer);
  }, [toast]);

  const selectedDetails = useMemo(() => getCycleDetails(selectedDate, data), [selectedDate, data]);
  const todayDetails = useMemo(() => getCycleDetails(today, data), [data]);
  const phase = todayDetails?.phase || null;
  const monthDays = useMemo(() => getMonthDays(month), [month]);
  const nextPeriod = todayDetails?.nextPeriod || (data.periodStarts[0] ? addDays([...data.periodStarts].sort().at(-1), Number(data.cycleLength)) : null);
  const daysUntilNext = nextPeriod ? diffDays(today, nextPeriod) : null;
  const cycleLengths = getCycleLengths(data.periodStarts);
  const calculatedAverage = cycleLengths.length ? Math.round(cycleLengths.reduce((sum, num) => sum + num, 0) / cycleLengths.length) : null;
  const loggedDayCount = Object.keys(data.logs).length;
  const latestStart = [...data.periodStarts].sort().at(-1) || '';
  const latestLogDates = Object.keys(data.logs).sort().reverse();
  const latestMoodId = latestLogDates.map(date => data.logs[date]?.mood).find(Boolean);
  const latestMood = MOODS.find(item => item.id === latestMoodId);

  function patchData(patch) { setData(current => ({ ...current, ...patch })); }
  function goMonth(delta) { setMonth(current => new Date(current.getFullYear(), current.getMonth() + delta, 1, 12)); }
  function changeTab(name) {
    setActiveTab(name);
    setMobileMenu(false);
    const targetId = name === 'Overview' ? 'overview' : name === 'Calendar' ? 'calendar' : name === 'Cycle guide' ? 'phase-guide' : 'insights';
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function openPeriodModal(mode = 'new') {
    setPeriodMode(mode);
    setPeriodDate(mode === 'edit' ? (latestStart || today) : today);
    setPeriodModal(true);
  }
  function savePeriodDate() {
    if (!periodDate) return;
    let starts = [...data.periodStarts].filter(Boolean);
    if (periodMode === 'edit' && latestStart) {
      starts = starts.filter(item => item !== latestStart);
    }
    starts = [...new Set([...starts, periodDate])].sort();
    patchData({ periodStarts: starts });
    setSelectedDate(periodDate);
    const d = parseLocalDate(periodDate);
    setMonth(new Date(d.getFullYear(), d.getMonth(), 1, 12));
    setPeriodModal(false);
    setToast(periodMode === 'edit' ? 'Latest period date updated' : 'Period start saved — predictions recalculated');
  }
  function deletePeriodStart(date) {
    patchData({ periodStarts: data.periodStarts.filter(item => item !== date) });
    setToast('Period start removed');
  }
  function saveLog() {
    const updated = { ...data.logs, [selectedDate]: { mood, symptoms, pain: Number(pain), flow, note: note.trim(), updatedAt: new Date().toISOString() } };
    patchData({ logs: updated });
    setToast(`Check-in saved for ${formatDate(selectedDate, { day: 'numeric', month: 'short', year: 'numeric' })}`);
  }
  function toggleSymptom(symptom) {
    setSymptoms(current => symptom === 'No symptoms' ? (current.includes('No symptoms') ? [] : ['No symptoms']) : current.includes(symptom) ? current.filter(item => item !== symptom) : [...current.filter(item => item !== 'No symptoms'), symptom]);
  }
  function resetAll() {
    if (!window.confirm('Reset all Luna data stored in this browser? This cannot be undone.')) return;
    const fresh = createDefaultData();
    setData(fresh);
    setSelectedDate(today);
    setMonth(new Date(parseLocalDate(today).getFullYear(), parseLocalDate(today).getMonth(), 1, 12));
    setSettingsOpen(false);
    setToast('Local data reset');
  }

  return (
    <div className={`app-shell ${darkMode ? 'dark-mode' : ''}`}>
      <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
      <header className="topbar">
        <div className="brand" onClick={() => changeTab('Overview')} role="button" tabIndex="0">
          <div className="brand-mark"><Moon size={19} strokeWidth={2.2}/><span/></div>
          <div><span className="brand-name">luna</span><span className="brand-sub">CYCLE COMPANION</span></div>
        </div>
        <nav className={`main-nav ${mobileMenu ? 'nav-open' : ''}`}>
          {['Overview', 'Calendar', 'Cycle guide', 'Insights'].map(label => <button type="button" key={label} className={activeTab === label ? 'nav-link active' : 'nav-link'} onClick={() => changeTab(label)}>{label}</button>)}
        </nav>
        <div className="topbar-actions">
          <button className="privacy-pill" type="button" onClick={() => setToast('Your cycle and journal data stay in this browser only.')}><LockKeyhole size={13}/> Private by design</button>
          <IconButton label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setDarkMode(v => !v)}>{darkMode ? <Sun size={18}/> : <Moon size={18}/>}</IconButton>
          <IconButton label="Open navigation" className="mobile-menu-button" onClick={() => setMobileMenu(v => !v)}>{mobileMenu ? <X size={20}/> : <Menu size={20}/>}</IconButton>
        </div>
      </header>

      <main className="page-content">
        <section className="welcome-row" id="overview">
          <div>
            <p className="eyebrow eyebrow-with-dot"><span/> YOUR PERSONAL CYCLE SPACE</p>
            <h1>A little more in tune<br/><em>with yourself.</em></h1>
            <p className="intro-copy">A gentler way to understand patterns, track how you feel, and plan with a little more clarity.</p>
          </div>
          <div className="date-stamp"><CalendarDays size={16}/><span>{parseLocalDate(today).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
        </section>

        <section className="hero-grid">
          <article className="cycle-hero panel">
            <div className="hero-topline"><span className="tiny-label"><span className="live-dot"/> YOUR CYCLE RIGHT NOW</span><button className="text-action" onClick={() => setSettingsOpen(true)}><Settings2 size={15}/> Cycle settings</button></div>
            {todayDetails ? <>
              <div className="hero-main">
                <div className="cycle-copy">
                  <div className="phase-chip" style={{ '--phase-color': todayDetails.phase.color, '--phase-soft': todayDetails.phase.soft }}><span>{todayDetails.phase.emoji}</span>{todayDetails.phase.name}</div>
                  <h2>Day <strong>{todayDetails.cycleDay}</strong><span className="of-days"> / {data.cycleLength}</span></h2>
                  <p className="hero-subtitle">{todayDetails.phase.title}</p>
                  <p className="hero-note">{todayDetails.phase.mood}</p>
                  <button className="primary-button" onClick={() => { setSelectedDate(today); document.getElementById('check-in')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}><Heart size={16} fill="currentColor"/> Check in today <span>→</span></button>
                </div>
                <div className="cycle-orbit" aria-label={`Cycle day ${todayDetails.cycleDay} of ${data.cycleLength}`}>
                  <div className="orbit-glow"/>
                  <div className="orbit-ring orbit-ring-outer"/>
                  <div className="orbit-ring orbit-ring-middle"/>
                  <div className="orbit-center"><span className="orbit-emoji">{todayDetails.phase.emoji}</span><strong>{todayDetails.cycleDay}</strong><small>cycle day</small></div>
                  <span className="orbit-star star-a">✦</span><span className="orbit-star star-b">✧</span>
                </div>
              </div>
              <div className="hero-footer">
                <div className="mini-stat"><span className="mini-stat-icon period-icon"><Droplets size={16}/></span><span><small>Next period (est.)</small><strong>{nextPeriod ? formatDate(nextPeriod, { day: 'numeric', month: 'short' }) : 'Not available'}</strong></span></div>
                <div className="mini-stat"><span className="mini-stat-icon moon-icon"><Moon size={16}/></span><span><small>{daysUntilNext !== null && daysUntilNext >= 0 ? 'Days to go' : 'Cycle estimate'}</small><strong>{daysUntilNext !== null && daysUntilNext >= 0 ? `${daysUntilNext} days` : `${data.cycleLength}-day cycle`}</strong></span></div>
                <div className="mini-stat"><span className="mini-stat-icon leaf-icon"><Leaf size={16}/></span><span><small>Cycle length</small><strong>{data.cycleLength} days{data.irregular ? ' · variable' : ''}</strong></span></div>
              </div>
            </> : <div className="empty-cycle"><Sparkles size={25}/><h2>Start with a date</h2><p>Log a period start to begin estimating phases.</p><button className="primary-button" onClick={() => openPeriodModal('new')}><Plus size={16}/> Add period start</button></div>}
          </article>

          <article className="quick-log panel" id="check-in">
            <div className="card-heading"><div><p className="eyebrow">A MOMENT FOR YOU</p><h2>How are you feeling?</h2></div><div className="heading-icon"><HeartPulse size={19}/></div></div>
            <p className="muted small-text">{selectedDate === today ? 'Today' : formatDate(selectedDate, { weekday: 'short', day: 'numeric', month: 'short' })} · No mood is the “wrong” one.</p>
            <div className="mood-grid">
              {MOODS.map(item => <button type="button" key={item.id} className={`mood-option ${mood === item.id ? 'selected' : ''}`} onClick={() => setMood(item.id)} aria-pressed={mood === item.id}><span className="mood-emoji">{item.emoji}</span><span>{item.label}</span></button>)}
            </div>
            <div className="log-divider"/>
            <div className="symptom-heading"><span>Anything else to note?</span><small>Choose any</small></div>
            <div className="symptom-list">
              {SYMPTOMS.map(item => <button type="button" key={item} className={`symptom-tag ${symptoms.includes(item) ? 'selected' : ''}`} onClick={() => toggleSymptom(item)} aria-pressed={symptoms.includes(item)}>{symptoms.includes(item) && <Check size={12}/>}{item}</button>)}
            </div>
            <div className="pain-row"><label htmlFor="pain-range">Pain / discomfort</label><div className="pain-value"><span>{pain === 0 ? 'None' : pain < 4 ? 'Mild' : pain < 7 ? 'Moderate' : 'Strong'}</span><strong>{pain}/10</strong></div></div>
            <input id="pain-range" className="pain-range" type="range" min="0" max="10" value={pain} onChange={event => setPain(Number(event.target.value))} style={{ '--range-progress': `${pain * 10}%` }}/>
            <div className="flow-row"><label>Flow</label><div className="flow-options">{['Spotting', 'Light', 'Medium', 'Heavy'].map(item => <button type="button" key={item} className={flow === item ? 'flow-option selected' : 'flow-option'} onClick={() => setFlow(item)} aria-pressed={flow === item}>{item}</button>)}</div></div>
            <label className="note-label" htmlFor="daily-note">A note to future you <span>optional</span></label>
            <textarea id="daily-note" value={note} onChange={event => setNote(event.target.value)} placeholder="What might you want to remember about today?" rows={2}/>
            <button className="save-button" onClick={saveLog}><Check size={17}/> Save check-in</button>
          </article>
        </section>

        <section className="calendar-section section-block" id="calendar">
          <div className="calendar-headline"><SectionTitle eyebrow="YOUR PERSONAL RHYTHM" title="Cycle calendar"/><button className="primary-button compact" onClick={() => openPeriodModal('new')}><Plus size={16}/> Log period start</button></div>
          <div className="calendar-layout">
            <article className="calendar-card panel">
              <div className="calendar-controls"><div><h3>{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h3><p className="muted small-text">Tap a date to view or save a check-in.</p></div><div className="month-arrows"><IconButton label="Previous month" onClick={() => goMonth(-1)}><ChevronLeft size={19}/></IconButton><IconButton label="Next month" onClick={() => goMonth(1)}><ChevronRight size={19}/></IconButton></div></div>
              <div className="calendar-grid weekday-grid">{['MON','TUE','WED','THU','FRI','SAT','SUN'].map(day => <div className="weekday" key={day}>{day}</div>)}</div>
              <div className="calendar-grid days-grid">
                {monthDays.map((dateString, index) => {
                  if (!dateString) return <div className="day-blank" key={`blank-${index}`}/>;
                  const d = getCycleDetails(dateString, data);
                  const log = data.logs[dateString];
                  const isToday = dateString === today;
                  const isSelected = dateString === selectedDate;
                  const hasStart = data.periodStarts.includes(dateString);
                  return <button key={dateString} type="button" onClick={() => { setSelectedDate(dateString); }} className={`day-cell ${d ? `phase-${d.phase.id}` : ''} ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''} ${hasStart ? 'has-period-start' : ''} ${d?.cycleDay <= Number(data.periodLength) ? 'is-predicted-bleeding' : ''} ${log ? 'has-log' : ''}`} aria-label={`${formatDate(dateString, { day: 'numeric', month: 'long', year: 'numeric' })}${d ? `, ${d.phase.name}, cycle day ${d.cycleDay}` : ''}`}>
                    <span className="day-number">{parseLocalDate(dateString).getDate()}</span>
                    {hasStart && <span className="period-start-dot" title="Period start logged"/>}
                    {log?.mood && <span className="day-mood">{MOODS.find(item => item.id === log.mood)?.emoji || '•'}</span>}
                    {!log && d && <span className="day-phase-dot"/>}
                    {d?.cycleDay === 14 && <span className="ovulation-star">✦</span>}
                  </button>;
                })}
              </div>
              <div className="calendar-legend">
                {VIDEO_PHASES.map(item => <span key={item.id}><i style={{ background: item.color }}/>{item.shortName}</span>)}
              </div>
              <div className="calendar-footnote"><Info size={14}/><span>Phase colors are estimates from the video’s day ranges. The chart overlaps on days 6 and 25; the calendar assigns one phase per date. Logged dates override estimates.</span></div>
            </article>

            <aside className="selected-day-card panel">
              <div className="selected-day-top"><div><p className="eyebrow">SELECTED DAY</p><h3>{formatDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' })}</h3></div><span className="selected-date-number">{parseLocalDate(selectedDate).getDate()}</span></div>
              {selectedDetails ? <>
                <div className="selected-phase" style={{ '--phase-color': selectedDetails.phase.color, '--phase-soft': selectedDetails.phase.soft }}><span className="selected-phase-emoji">{selectedDetails.phase.emoji}</span><div><small>Estimated phase · Day {selectedDetails.cycleDay}</small><strong>{selectedDetails.phase.name}</strong></div></div>
                <p className="selected-day-description">{selectedDetails.phase.mood}</p>
              </> : <div className="no-phase"><CalendarDays size={22}/><p>No cycle estimate for this date yet.</p></div>}
              {selectedLog.mood ? <div className="saved-log-preview"><span className="preview-mood">{MOODS.find(item => item.id === selectedLog.mood)?.emoji}</span><div><strong>{MOODS.find(item => item.id === selectedLog.mood)?.label || 'Check-in saved'}</strong><small>{selectedLog.symptoms?.length ? selectedLog.symptoms.join(' · ') : 'No symptoms noted'}{selectedLog.flow ? ` · Flow: ${selectedLog.flow}` : ''}{selectedLog.pain ? ` · Pain ${selectedLog.pain}/10` : ''}</small></div></div> : <div className="empty-log-note"><Heart size={16}/><span>No check-in saved for this date yet.</span></div>}
              <button className="outline-button full-width" onClick={() => { document.getElementById('check-in')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}> {selectedLog.mood ? 'Edit check-in' : 'Add a check-in'} <ArrowUpRight size={16}/></button>
              <button className="plain-button full-width" onClick={() => { setSelectedDate(today); setMonth(new Date(parseLocalDate(today).getFullYear(), parseLocalDate(today).getMonth(), 1, 12)); }}>Jump to today</button>
            </aside>
          </div>
        </section>

        <section className="guide-section section-block" id="phase-guide">
          <SectionTitle eyebrow="INSPIRED BY YOUR VIDEO" title="A guide to the phases" action={<span className="estimate-note"><Sparkles size={14}/> Gentle estimates, not rules</span>}/>
          <div className="phase-guide-grid">
            {VIDEO_PHASES.map((item, index) => <article className={`phase-guide-card panel ${phase?.id === item.id ? 'currently-active' : ''}`} key={item.id} style={{ '--phase-color': item.color, '--phase-soft': item.soft, '--card-order': index }}>
              <div className="guide-card-top"><span className="guide-emoji">{item.emoji}</span><span className="guide-range">{item.range}</span></div>
              <h3>{item.name}</h3><p className="guide-title">{item.title}</p>
              <div className="guide-chips">{item.signs.map(sign => <span key={sign}>{sign}</span>)}</div>
              <p className="guide-copy">{item.mood}</p>
              <div className="care-tip"><Leaf size={15}/><p>{item.care}</p></div>
              {phase?.id === item.id && <span className="current-phase-label"><span/> Current estimate</span>}
            </article>)}
          </div>
          <div className="disclaimer-strip"><Info size={17}/><p><strong>One important thing:</strong> phases cannot tell you exactly what she’ll feel or how she’ll behave. Use this as a conversation and tracking tool—ask her, respect her actual mood, and let her own logs replace assumptions.</p></div>
        </section>

        <section className="insights-section section-block" id="insights">
          <SectionTitle eyebrow="PATTERNS, NOT PRESSURE" title="Your cycle at a glance" action={<button className="text-action" onClick={() => setSettingsOpen(true)}><Settings2 size={15}/> Edit settings</button>}/>
          <div className="insights-grid">
            <article className="insight-card panel"><div className="insight-icon rose"><CalendarDays size={18}/></div><p>Typical cycle</p><strong>{data.cycleLength} <small>days</small></strong><span>{data.irregular ? 'Marked as variable' : calculatedAverage ? `Logged average: ${calculatedAverage} days` : 'Using your current estimate'}</span></article>
            <article className="insight-card panel"><div className="insight-icon lilac"><Activity size={18}/></div><p>Check-ins saved</p><strong>{loggedDayCount} <small>{loggedDayCount === 1 ? 'day' : 'days'}</small></strong><span>Small notes can reveal patterns over time.</span></article>
            <article className="insight-card panel"><div className="insight-icon mint"><HeartPulse size={18}/></div><p>Most recent mood</p><strong className="recent-mood">{latestMood ? `${latestMood.emoji} ${latestMood.label}` : 'Not logged'}</strong><span>{latestLogDates.length ? `Last entry: ${formatDate(latestLogDates[0], { day: 'numeric', month: 'short' })}` : 'Start with today’s check-in.'}</span></article>
            <article className="insight-card panel"><div className="insight-icon gold"><Droplets size={18}/></div><p>Period starts logged</p><strong>{data.periodStarts.length} <small>{data.periodStarts.length === 1 ? 'date' : 'dates'}</small></strong><span>Record actual starts to improve future estimates.</span></article>
          </div>
          <article className="history-card panel"><div className="history-heading"><div><p className="eyebrow">YOUR RECORD</p><h3>Period start history</h3><p className="muted small-text">Edit or remove a date if it was entered incorrectly.</p></div><button className="outline-button" onClick={() => openPeriodModal('new')}><Plus size={15}/> Add date</button></div>
            {data.periodStarts.length ? <div className="history-list">{[...data.periodStarts].sort().reverse().map(date => <div className="history-item" key={date}><span className="history-drop"><Droplets size={16}/></span><div className="history-date"><strong>{formatDate(date, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</strong><small>{date === latestStart ? 'Most recent logged start' : 'Previously logged start'}</small></div><IconButton label={`Delete period start ${date}`} onClick={() => deletePeriodStart(date)} className="delete-button"><X size={15}/></IconButton></div>)}</div> : <div className="empty-history">No period starts saved yet. Add one to start your calendar.</div>}
          </article>
        </section>

        <footer className="app-footer"><div className="footer-brand"><div className="brand-mark small"><Moon size={15}/></div><span>luna</span></div><p><ShieldCheck size={14}/> Your data stays on this device. No account, no uploads, no tracking.</p><span className="footer-link">Cycle estimates are not contraception or medical advice.</span></footer>
      </main>

      {periodModal && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setPeriodModal(false); }}>
        <div className="modal panel" role="dialog" aria-modal="true" aria-labelledby="period-modal-title">
          <div className="modal-heading"><div><p className="eyebrow">KEEP YOUR CALENDAR REAL</p><h2 id="period-modal-title">{periodMode === 'edit' ? 'Correct last start date' : 'Log a period start'}</h2></div><IconButton label="Close" onClick={() => setPeriodModal(false)}><X size={19}/></IconButton></div>
          <p className="modal-copy">Use the first day actual bleeding began. If her period is early, late, or irregular, record the real date here—the estimates will recalculate.</p>
          <label htmlFor="period-start-date">Bleeding started on</label><input id="period-start-date" className="date-input" type="date" value={periodDate} max={today} onChange={event => setPeriodDate(event.target.value)}/>
          <div className="modal-tip"><Info size={16}/><span>If it began yesterday evening, enter that calendar date (12 Oct 2026), even if it started late at night.</span></div>
          <div className="modal-actions"><button className="outline-button" onClick={() => setPeriodModal(false)}>Cancel</button><button className="primary-button" onClick={savePeriodDate}><Check size={16}/>{periodMode === 'edit' ? 'Save correction' : 'Save start date'}</button></div>
          {periodMode === 'new' && latestStart && <button className="edit-last-link" onClick={() => openPeriodModal('edit')}>Entered the most recent date wrong? Correct it instead.</button>}
        </div>
      </div>}

      {settingsOpen && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setSettingsOpen(false); }}>
        <div className="modal settings-modal panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
          <div className="modal-heading"><div><p className="eyebrow">PERSONALISE YOUR ESTIMATE</p><h2 id="settings-title">Cycle settings</h2></div><IconButton label="Close settings" onClick={() => setSettingsOpen(false)}><X size={19}/></IconButton></div>
          <p className="modal-copy">These are starting estimates. Adjust them to match actual dates over time.</p>
          <div className="setting-row"><div><label htmlFor="cycle-length">Average cycle length</label><p>From one period start to the next</p></div><div className="number-stepper"><button type="button" aria-label="Decrease cycle length" onClick={() => patchData({ cycleLength: Math.max(21, Number(data.cycleLength) - 1) })}>−</button><strong>{data.cycleLength}</strong><button type="button" aria-label="Increase cycle length" onClick={() => patchData({ cycleLength: Math.min(45, Number(data.cycleLength) + 1) })}>+</button></div></div>
          <div className="setting-row"><div><label htmlFor="period-length">Typical bleeding length</label><p>For period-date shading on calendar</p></div><div className="number-stepper"><button type="button" aria-label="Decrease bleeding length" onClick={() => patchData({ periodLength: Math.max(1, Number(data.periodLength) - 1) })}>−</button><strong>{data.periodLength}</strong><button type="button" aria-label="Increase bleeding length" onClick={() => patchData({ periodLength: Math.min(10, Number(data.periodLength) + 1) })}>+</button></div></div>
          <label className="toggle-row"><span><strong>My cycle is irregular / varies</strong><small>Keep predictions tentative and pay more attention to logged dates.</small></span><input type="checkbox" checked={data.irregular} onChange={event => patchData({ irregular: event.target.checked })}/></label>
          <div className="modal-tip"><Info size={16}/><span>Irregular cycles can still be tracked. Calendar estimates cannot confirm ovulation; if cycles are frequently very short/long or the pattern changes suddenly, consider a healthcare professional.</span></div>
          <div className="modal-actions"><button className="outline-button danger-outline" onClick={resetAll}>Reset local data</button><button className="primary-button" onClick={() => { setSettingsOpen(false); setToast('Cycle settings saved'); }}><Check size={16}/> Done</button></div>
        </div>
      </div>}
      {toast && <div className="toast" role="status"><span className="toast-icon"><Check size={15}/></span>{toast}</div>}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
