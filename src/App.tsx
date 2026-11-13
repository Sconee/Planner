import { useEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties, ReactNode } from "react"
import {
  BLOCKS, CLOSED, EMP, GIGS, HAB, MVDK, REVIEW_Q, STATUSES, WTARG, WAKE,
  addD, bestStreak, clock, dur, fdate, fromIso, hm, isWon, iso, load, num, persist, schedule,
  stats, streakOf, today, validImport, weekStart, weekTotals,
} from "./logic"
import type { LogRow, Pipe, State, Theme, Ver } from "./logic"

type IconName = "dashboard" | "calendar" | "check" | "briefcase" | "chart" | "sun" | "moon" | "plus" | "clock" | "play" | "arrow" | "sparkles" | "target" | "flame" | "book" | "trash" | "edit" | "down" | "up" | "auto"

const iconPaths: Record<IconName, ReactNode> = {
  dashboard: (<><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>),
  calendar: (<><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></>),
  check: <path d="m5 12 4 4L19 6" />,
  briefcase: (<><rect x="3" y="7" width="18" height="13" rx="3" /><path d="M9 7V4h6v3M3 12h18M10 12v2h4v-2" /></>),
  chart: <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />,
  sun: (<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" /></>),
  moon: <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  play: <path d="m9 7 8 5-8 5Z" />,
  arrow: <path d="M5 12h14M14 7l5 5-5 5" />,
  sparkles: (<><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z" /><path d="m6 14 .8 2.2L9 17l-2.2.8L6 20l-.8-2.2L3 17l2.2-.8L6 14Z" /></>),
  target: (<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>),
  flame: <path d="M13.5 2.5c.5 4-2.7 5.3-1.1 8.2.7-1 1-2.1.8-3.2 3.2 1.9 5 4.5 4.8 7.4-.2 3.6-3 6.1-6.5 6.1S5 18.3 5 14.8c0-3 1.8-5.5 4.7-7.8-.2 2 .4 3.4 1.2 4.2-.4-3.6 1-6.1 2.6-8.7Z" />,
  book: (<><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z" /><path d="M8 7h7" /></>),
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  edit: <path d="m4 20 4-1 11-11-3-3L5 16l-1 4Z" />,
  down: <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />,
  up: <path d="M12 16V5M7 9l5-5 5 5M5 20h14" />,
  auto: (<><circle cx="12" cy="12" r="8" /><path d="M12 4v16" /></>),
}

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  )
}

const navItems: { id: string; label: string; icon: IconName }[] = [
  { id: "dashboard", label: "Overview", icon: "dashboard" },
  { id: "plan", label: "My day", icon: "calendar" },
  { id: "habits", label: "Habits", icon: "check" },
  { id: "log", label: "Log", icon: "book" },
  { id: "pipeline", label: "Pipeline", icon: "briefcase" },
  { id: "insights", label: "Insights", icon: "chart" },
]

const TONE: Record<string, string> = { Anchor: "personal", Health: "health", Courses: "learning", "Job search": "work", Income: "work", Growth: "learning", Relationships: "personal", Flex: "personal", Rest: "personal", Admin: "work", "Morning session": "health", "Focus time": "learning", "Evening session": "personal" }
const STONE: Record<string, string> = { "To apply": "green", Applied: "orange", Screening: "blue", Interview: "purple", "Task/Assessment": "purple", Offer: "green", Rejected: "orange", Ghosted: "orange" }
const isFocus = (c: string) => c === "Courses" || c === "Job search" || c === "Focus time"

type Update = (fn: (s: State) => void) => void
type Timer = { i: string | null; left: number; running: boolean }
type Block = { id: string; label: string; mins: number; cat: string; mvd: number; start: string; end: string }

type Ctx = {
  S: State; update: Update; sched: Block[]; done: number; progress: number; doneMap: Record<string, boolean>
  toggleBlock: (id: string) => void; toggleHabit: (d: string, k: string) => void; startTimer: (id: string) => void
  st: ReturnType<typeof stats>; wk: string; wt: ReturnType<typeof weekTotals>; setActive: (id: string) => void; t: string; emp: boolean
}

const targetVal = (wt: ReturnType<typeof weekTotals>, k: string) => (wt as Record<string, number>)[k]
const goalPct = (wt: ReturnType<typeof weekTotals>) => Math.round((WTARG.reduce((a, [, n, k]) => a + Math.min(1, targetVal(wt, k) / n), 0) / WTARG.length) * 100)

function App() {
  const [S, setS] = useState<State>(load)
  const [active, setActive] = useState("dashboard")
  const [timer, setTimer] = useState<Timer>({ i: null, left: 0, running: false })
  const update: Update = (fn) => setS((prev) => { const n = structuredClone(prev); fn(n); return n })

  useEffect(() => { persist(S) }, [S])

  // Auto follows the OS live; Light and Dark are explicit
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const apply = () => {
      const dark = S.theme === "dark" || (S.theme === "system" && mq.matches)
      document.documentElement.dataset.theme = dark ? "dark" : "light"
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#17161d" : "#f6f7fb")
    }
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [S.theme])

  // adopt tomorrow's version if the page stays open past midnight
  useEffect(() => {
    const id = window.setInterval(() => {
      setS((p) => (p.verDate !== today() ? { ...p, todayVersion: p.tomorrowVersion, verDate: today() } : p))
    }, 60000)
    return () => window.clearInterval(id)
  }, [])

  const t = today()
  const emp = S.mode === "employed"
  const list = useMemo(
    () => (emp ? EMP.map(([label, mins, cat]) => ({ label, mins, cat, mvd: 0 })) : BLOCKS.map(([label, mins, cat, mvd]) => ({ label, mins, cat, mvd }))),
    [emp],
  )
  const sched: Block[] = useMemo(() => schedule(list, S.todayVersion).map((b, i) => ({ ...b, id: emp ? `e${i}` : String(i) })), [list, S.todayVersion, emp])
  const doneMap = S.plan[t]?.done ?? {}
  const done = sched.filter((b) => doneMap[b.id]).length
  const progress = sched.length ? Math.round((done / sched.length) * 100) : 0

  const toggleBlock = (id: string) =>
    update((s) => {
      const d = (s.plan[t] ??= { done: {} }).done
      const on = !d[id]
      if (on) d[id] = true; else delete d[id]
      if (!id.startsWith("e")) { // ticking a block also ticks the habit it stands for, so nothing is entered twice
        const h = (s.habits[t] ??= {})
        BLOCKS[Number(id)][4].forEach((k) => { if (on) h[k] = true; else delete h[k] })
        if (!Object.keys(h).length) delete s.habits[t]
      }
    })

  const toggleHabit = (d: string, k: string) =>
    update((s) => {
      const h = (s.habits[d] ??= {})
      if (h[k]) delete h[k]; else h[k] = true
      if (!Object.keys(h).length) delete s.habits[d]
    })

  // block timer: counts down in seconds, ticks the block when it finishes
  useEffect(() => {
    if (!timer.running) return
    const id = window.setInterval(() => setTimer((x) => ({ ...x, left: Math.max(0, x.left - 1) })), 1000)
    return () => window.clearInterval(id)
  }, [timer.running])
  useEffect(() => {
    if (timer.running && timer.left === 0 && timer.i !== null) {
      const id = timer.i
      setTimer({ i: null, left: 0, running: false })
      if (!(S.plan[t]?.done ?? {})[id]) toggleBlock(id)
    }
  }) // eslint-disable-line react-hooks/exhaustive-deps
  const startTimer = (id: string) => {
    const b = sched.find((x) => x.id === id)
    if (b) setTimer({ i: id, left: b.mins * 60, running: true })
  }
  const timerBlock = sched.find((b) => b.id === timer.i)

  const st = useMemo(() => stats(S), [S])
  const wk = weekStart(t)
  const wt = weekTotals(S, wk)
  const goal = goalPct(wt)
  const hour = new Date().getHours()
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  const todayLong = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date())
  const title = navItems.find((n) => n.id === active)?.label

  const ctx: Ctx = { S, update, sched, done, progress, doneMap, toggleBlock, toggleHabit, startTimer, st, wk, wt, setActive, t, emp }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><Icon name="sparkles" size={18} /></span><span>Daylight</span></div>
        <nav className="side-nav" aria-label="Main navigation">
          <p className="nav-label">Workspace</p>
          {navItems.map((item) => (
            <button key={item.id} className={active === item.id ? "nav-item active" : "nav-item"} onClick={() => setActive(item.id)}>
              <Icon name={item.icon} /><span>{item.label}</span>
              {item.id === "plan" && <span className="nav-badge">{done}/{sched.length}</span>}
              {item.id === "pipeline" && st.overdue.length > 0 && <span className="nav-badge warn">{st.overdue.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="weekly-mini">
            <div className="weekly-mini-head"><span>Weekly targets</span><strong>{goal}%</strong></div>
            <div className="mini-bar"><i style={{ width: `${goal}%` }} /></div>
            <small>{wt.won} won {wt.won === 1 ? "day" : "days"} this week</small>
          </div>
          <div className="mode-switch" role="group" aria-label="Mode">
            <button className={!emp ? "on" : ""} onClick={() => update((s) => { s.mode = "jobsearch" })}>Job search</button>
            <button className={emp ? "on" : ""} onClick={() => update((s) => { s.mode = "employed" })}>Employed</button>
          </div>
        </div>
      </aside>

      <div className="main-frame">
        <header className="topbar">
          <div><p className="mobile-brand">Daylight</p><h1>{title}</h1></div>
          <div className="top-actions">
            <div className="seg-theme" role="group" aria-label="Theme">
              {([["system", "auto", "Auto"], ["light", "sun", "Light"], ["dark", "moon", "Dark"]] as [Theme, IconName, string][]).map(([v, ic, nm]) => (
                <button key={v} className={S.theme === v ? "on" : ""} aria-label={`${nm} theme`} title={nm} aria-pressed={S.theme === v} onClick={() => update((s) => { s.theme = v })}>
                  <Icon name={ic} size={16} />
                </button>
              ))}
            </div>
            <button className="primary-button" onClick={() => setActive("log")}><Icon name="book" size={18} /><span>Log today</span></button>
          </div>
        </header>

        <main className="content">
          {active === "dashboard" && <Dashboard {...ctx} greet={greet} todayLong={todayLong} />}
          {active === "plan" && <Plan {...ctx} />}
          {active === "habits" && <Habits {...ctx} />}
          {active === "log" && <LogPage {...ctx} />}
          {active === "pipeline" && <Pipeline {...ctx} />}
          {active === "insights" && <Insights {...ctx} />}
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navItems.map((item) => (
          <button key={item.id} className={active === item.id ? "active" : ""} onClick={() => setActive(item.id)}>
            <Icon name={item.icon} size={21} /><span>{item.label === "Overview" ? "Home" : item.label}</span>
          </button>
        ))}
      </nav>

      <div className={timer.i !== null ? "focus-toast show" : "focus-toast"}>
        <span className="timer-play"><Icon name="clock" size={16} /></span>
        <span><strong>{clock(timer.left)}</strong><small>{timerBlock?.label ?? ""}</small></span>
        <button onClick={() => setTimer((x) => ({ ...x, running: !x.running }))}>{timer.running ? "Pause" : "Resume"}</button>
        <button onClick={() => setTimer({ i: null, left: 0, running: false })}>Stop</button>
      </div>
    </div>
  )
}

function PanelHeader({ title, subtitle, action, onClick }: { title: string; subtitle?: string; action?: string; onClick?: () => void }) {
  return (
    <div className="panel-header">
      <div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>
      {action && <button onClick={onClick}>{action}<Icon name="arrow" size={16} /></button>}
    </div>
  )
}

function Metric({ icon, tone, value, label, note }: { icon: IconName; tone: string; value: string; label: string; note: string }) {
  return (
    <article className="metric">
      <span className={`soft-icon ${tone}`}><Icon name={icon} /></span>
      <div><strong>{value}</strong><p>{label}</p><small>{note}</small></div>
    </article>
  )
}

function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([v, l]) => <button key={v} className={value === v ? "on" : ""} aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>)}
    </div>
  )
}

function TaskRow({ b, done, onToggle, onStart }: { b: Block; done: boolean; onToggle: () => void; onStart: () => void }) {
  return (
    <div className={done ? "task-row is-done" : "task-row"}>
      <button className="task-check" onClick={onToggle} aria-label={`Mark ${b.label} ${done ? "incomplete" : "complete"}`}>{done && <Icon name="check" size={14} />}</button>
      <span className={`task-dot ${TONE[b.cat] ?? ""}`} />
      <div className="task-content"><strong>{b.label}{b.mvd ? <em className="mvd">Essential</em> : null}</strong><small>{dur(b.mins)} · {b.cat}</small></div>
      <time>{b.start}</time>
      <button className="row-more" onClick={onStart} aria-label={`Start timer for ${b.label}`}><Icon name="play" size={16} /></button>
    </div>
  )
}

function Dashboard({ S, update, sched, done, progress, doneMap, toggleBlock, toggleHabit, startTimer, st, setActive, t, emp, greet, todayLong }: Ctx & { greet: string; todayLong: string }) {
  const hab = S.habits[t] ?? {}
  const mvdN = MVDK.filter((k) => hab[k]).length
  const focusMin = sched.filter((b) => doneMap[b.id] && isFocus(b.cat)).reduce((a, b) => a + b.mins, 0)
  const next = sched.filter((b) => !doneMap[b.id]).slice(0, 5)
  const weekDays = Array.from({ length: 7 }, (_, i) => addD(weekStart(t), i))
  const insight = st.overdue.length
    ? [`${st.overdue.length} follow-up${st.overdue.length > 1 ? "s" : ""} overdue.`, `Start with ${st.overdue[0].company || "your oldest application"}. A next action dated in the past is a stalled application.`]
    : st.days >= 3 && st.wr
      ? [`Weakest habit: ${st.wr}.`, `Hit on ${st.worst}% of tracked days. Under 30%? Shrink it or cut it rather than keep failing at it.`]
      : ["Your insights start here.", "Tick habits and log each night. Patterns show up after about three days."]
  return (
    <>
      <section className="welcome">
        <div><p className="eyebrow">{todayLong}</p><h2>{greet}.</h2><p>{emp ? "Employed mode: your corrected working-day schedule." : "Protect the essentials. Let the rest flex."}</p></div>
        <div className="ver-pick"><span>Today</span><Seg<Ver> label="Today's version" value={S.todayVersion} options={[["A", "A · 04:00"], ["B", "B · 05:00"], ["C", "C · 06:00"]]} onChange={(v) => update((s) => { s.todayVersion = v })} /></div>
      </section>

      <section className="hero-grid">
        <article className="progress-card">
          <div className="progress-copy">
            <span className="soft-icon purple"><Icon name="target" /></span>
            <p>DAILY PROGRESS</p>
            <h3>{done} of {sched.length} blocks complete</h3>
            <span>{mvdN === 4 ? "All four essentials done. Today is a won day." : `${mvdN} of 4 essentials done.`}</span>
          </div>
          <div className="progress-ring" style={{ "--progress": `${progress * 3.6}deg` } as CSSProperties}>
            <div><strong>{progress}%</strong><small>complete</small></div>
          </div>
        </article>
        <article className="streak-card">
          <div className="streak-top">
            <span className="soft-icon amber"><Icon name="flame" /></span>
            <div><p>WON-DAY STREAK</p><h3>{st.curWon} {st.curWon === 1 ? "day" : "days"}</h3></div>
          </div>
          <div className="week-dots">
            {weekDays.map((d, i) => (
              <span key={d} className={isWon(S.habits[d]) ? "done" : d === t ? "today" : ""}>
                <i>{isWon(S.habits[d]) && <Icon name="check" size={12} />}</i>{["M", "T", "W", "T", "F", "S", "S"][i]}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel agenda-panel">
          <PanelHeader title="Up next" subtitle={next.length ? `${sched.length - done} blocks left today` : "Everything done. Nice."} action="View day" onClick={() => setActive("plan")} />
          <div className="task-list">
            {next.map((b) => <TaskRow key={b.id} b={b} done={false} onToggle={() => toggleBlock(b.id)} onStart={() => startTimer(b.id)} />)}
          </div>
        </article>
        <div className="right-column">
          <article className="panel priorities">
            <PanelHeader title="Minimum viable day" subtitle="Four of four is a won day" />
            {MVDK.map((k, i) => (
              <button className={hab[k] ? "priority-row is-on" : "priority-row"} key={k} onClick={() => toggleHabit(t, k)}>
                <span>{hab[k] ? <Icon name="check" size={12} /> : i + 1}</span>
                <p>{HAB.find((h) => h[0] === k)?.[1]}</p>
              </button>
            ))}
          </article>
          <article className="insight-card">
            <span className="soft-icon green"><Icon name="sparkles" /></span>
            <div><p>INSIGHT</p><h3>{insight[0]}</h3><span>{insight[1]}</span></div>
          </article>
        </div>
      </section>

      <section className="metrics">
        <Metric icon="clock" tone="purple" value={dur(focusMin)} label="Focus done today" note="Courses + job search blocks" />
        <Metric icon="check" tone="green" value={`${Object.values(hab).filter(Boolean).length}/${HAB.length}`} label="Habits today" note={`${st.won} won days so far`} />
        <Metric icon="briefcase" tone="blue" value={String(st.active)} label="Active applications" note={`${st.overdue.length} need follow-up`} />
        <Metric icon="flame" tone="amber" value={`${st.curWon} days`} label="Current streak" note={`Personal best: ${st.bestWon}`} />
      </section>
    </>
  )
}

function Plan({ S, update, sched, done, progress, doneMap, toggleBlock, startTimer, emp }: Ctx) {
  const v = S.todayVersion
  const focus = sched.filter((b) => isFocus(b.cat)).reduce((a, b) => a + b.mins, 0)
  const flex = sched.filter((b) => b.cat === "Flex").reduce((a, b) => a + b.mins, 0)
  const total = sched.reduce((a, b) => a + b.mins, 0)
  return (
    <div className="page-stack">
      <section className="page-intro">
        <div><p className="eyebrow">TODAY · VERSION {v} · {emp ? "EMPLOYED" : "JOB SEARCH"}</p><h2>Your day, at a glance.</h2><p>Up at {hm(WAKE[v])} · day ends {hm(WAKE[v] + total)} · {((1440 - total) / 60).toFixed(1)}h left for sleep.</p></div>
        <Seg<Ver> label="Today's version" value={v} options={[["A", "A"], ["B", "B"], ["C", "C"]]} onChange={(x) => update((s) => { s.todayVersion = x })} />
      </section>
      <div className="plan-summary">
        <div><strong>{progress}%</strong><span>{done} of {sched.length} blocks</span></div>
        <div><strong>{dur(focus)}</strong><span>Focused time planned</span></div>
        <div><strong>{flex ? dur(flex) : "—"}</strong><span>{flex ? "Declared slack. Leave it empty." : "No slack in this mode"}</span></div>
      </div>
      <section className="panel tomorrow-panel">
        <PanelHeader title="Plan tomorrow" subtitle="Pick tomorrow's version tonight, not at 4am. It applies automatically at midnight." />
        <Seg<Ver> label="Tomorrow's version" value={S.tomorrowVersion} options={[["A", "A · 04:00"], ["B", "B · 05:00"], ["C", "C · 06:00"]]} onChange={(x) => update((s) => { s.tomorrowVersion = x })} />
      </section>
      <section className="panel day-panel">
        <PanelHeader title="Schedule" subtitle={`${sched.length} blocks · tap ▶ to run a timer`} />
        <div className="timeline">
          {sched.map((b) => <TaskRow key={b.id} b={b} done={!!doneMap[b.id]} onToggle={() => toggleBlock(b.id)} onStart={() => startTimer(b.id)} />)}
        </div>
      </section>
    </div>
  )
}

function Habits({ S, toggleHabit, t }: Ctx) {
  const [wk, setWk] = useState(weekStart(t))
  const days = Array.from({ length: 7 }, (_, i) => addD(wk, i))
  const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const thisWk = wk === weekStart(t)
  return (
    <div className="page-stack">
      <section className="page-intro">
        <div><p className="eyebrow">WEEK OF {fdate(wk).toUpperCase()}</p><h2>Small actions, repeated.</h2><p>Tap a day to tick it. Leave a miss blank and don't backfill.</p></div>
        <div className="week-nav">
          <button className="icon-button" aria-label="Previous week" onClick={() => setWk(addD(wk, -7))}>‹</button>
          <button className="date-button" disabled={thisWk} onClick={() => setWk(weekStart(t))}>This week</button>
          <button className="icon-button" aria-label="Next week" disabled={thisWk} onClick={() => setWk(addD(wk, 7))}>›</button>
        </div>
      </section>
      <section className="panel habits-panel">
        <div className="habit-head">
          <span>Habit</span>
          {days.map((d, i) => <span key={d} className={d === t ? "is-today" : ""}>{names[i]}<br />{fromIso(d).getDate()}</span>)}
          <span>Streak</span>
        </div>
        {HAB.map(([k, name]) => (
          <div className="habit-row" key={k}>
            <strong>{name}{MVDK.includes(k) && <em className="mvd">Essential</em>}</strong>
            {days.map((d) => (
              <button key={d} disabled={d > t} aria-label={`${name} on ${d}`} aria-pressed={!!S.habits[d]?.[k]} className={S.habits[d]?.[k] ? "habit-check done" : "habit-check"} onClick={() => toggleHabit(d, k)}>
                {S.habits[d]?.[k] ? <Icon name="check" size={14} /> : null}
              </button>
            ))}
            <span className="habit-streak" title={`Best: ${bestStreak(S, k)}`}><Icon name="flame" size={15} />{streakOf(S, k)}</span>
          </div>
        ))}
        <div className="habit-row won-row">
          <strong>Won day</strong>
          {days.map((d) => <span key={d} className={isWon(S.habits[d]) ? "won-dot on" : "won-dot"}>{isWon(S.habits[d]) ? "✓" : "·"}</span>)}
          <span />
        </div>
      </section>
    </div>
  )
}

const blankLog = (d: string, v: string): LogRow => ({ d, v, woke: "", sleep: 0, course: 0, job: 0, gig: 0, apps: 0, mood: 0, note: "" })
const TEXT_KEYS: (keyof LogRow)[] = ["woke", "v", "note", "d"]

function LogPage({ S, update, t }: Ctx) {
  const [d, setD] = useState(t)
  const existing = S.log.find((r) => r.d === d)
  const [f, setF] = useState<LogRow>(existing ?? blankLog(d, S.todayVersion))
  const [saved, setSaved] = useState(false)
  useEffect(() => { setF(S.log.find((r) => r.d === d) ?? blankLog(d, S.todayVersion)); setSaved(false) }, [d]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: keyof LogRow, v: string) => { setF((x) => ({ ...x, [k]: TEXT_KEYS.includes(k) ? v : num(v) })); setSaved(false) }
  const save = () => {
    update((s) => { const row = { ...f, d }; const i = s.log.findIndex((r) => r.d === d); if (i >= 0) s.log[i] = row; else s.log.push(row); s.log.sort((a, b) => a.d.localeCompare(b.d)) })
    setSaved(true)
  }
  const field = (label: string, k: keyof LogRow, type = "number", extra: Record<string, string> = {}) => (
    <label className="fld"><span>{label}</span><input type={type} value={type === "number" && f[k] === 0 ? "" : String(f[k])} onChange={(e) => set(k, e.target.value)} {...extra} /></label>
  )
  const recent = [...S.log].sort((a, b) => b.d.localeCompare(a.d)).slice(0, 14)
  return (
    <div className="page-stack">
      <section className="page-intro">
        <div><p className="eyebrow">NIGHTLY LOG</p><h2>Ninety seconds, every night.</h2><p>Insights reads from this. Skip it and the numbers go blind.</p></div>
      </section>
      <section className="panel">
        <PanelHeader title={existing ? "Edit entry" : "New entry"} subtitle={fdate(d)} />
        <div className="form-grid">
          <label className="fld"><span>Date</span><input type="date" value={d} max={t} onChange={(e) => e.target.value && setD(e.target.value)} /></label>
          <label className="fld"><span>Version</span><select value={f.v} onChange={(e) => set("v", e.target.value)}><option value="A">A</option><option value="B">B</option><option value="C">C</option></select></label>
          {field("Woke at", "woke", "time")}
          {field("Slept (h)", "sleep", "number", { step: "0.1", min: "0", max: "24", inputMode: "decimal" })}
          {field("Course (h)", "course", "number", { step: "0.25", min: "0", inputMode: "decimal" })}
          {field("Job search (h)", "job", "number", { step: "0.25", min: "0", inputMode: "decimal" })}
          {field("Gig / income (h)", "gig", "number", { step: "0.25", min: "0", inputMode: "decimal" })}
          {field("Applications sent", "apps", "number", { min: "0", inputMode: "numeric" })}
          <label className="fld"><span>Mood (1–5)</span><select value={f.mood || ""} onChange={(e) => set("mood", e.target.value)}><option value="">—</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
          <label className="fld wide"><span>One line: what actually happened</span><input type="text" value={f.note} onChange={(e) => set("note", e.target.value)} /></label>
        </div>
        <div className="form-actions"><button className="primary-button" onClick={save}>Save entry</button>{saved && <span className="ok">Saved</span>}</div>
      </section>
      <section className="panel">
        <PanelHeader title="Recent entries" subtitle={`${S.log.length} logged`} />
        {recent.length === 0 && <p className="empty">Nothing logged yet.</p>}
        {recent.length > 0 && (
          <div className="tbl-wrap">
            <table className="tbl"><thead><tr><th>Date</th><th>Ver</th><th>Sleep</th><th>Course</th><th>Job</th><th>Gig</th><th>Apps</th><th>Mood</th><th>Note</th><th /></tr></thead>
              <tbody>{recent.map((r) => (
                <tr key={r.d}><td>{fdate(r.d)}</td><td>{r.v}</td><td>{r.sleep || "–"}</td><td>{r.course || "–"}</td><td>{r.job || "–"}</td><td>{r.gig || "–"}</td><td>{r.apps || "–"}</td><td>{r.mood || "–"}</td><td className="note">{r.note}</td>
                  <td className="acts"><button aria-label="Edit entry" onClick={() => setD(r.d)}><Icon name="edit" size={15} /></button><button aria-label="Delete entry" onClick={() => { if (confirm(`Delete the ${fdate(r.d)} entry?`)) update((s) => { s.log = s.log.filter((x) => x.d !== r.d) }) }}><Icon name="trash" size={15} /></button></td></tr>
              ))}</tbody></table>
          </div>
        )}
      </section>
    </div>
  )
}

type PipeForm = Omit<Pipe, "id"> & { id?: number }
const blankPipe = (): PipeForm => ({ company: "", role: "", source: "", applied: today(), status: "Applied", next: "", due: "", contact: "", notes: "" })

function Pipeline({ S, update, st, t }: Ctx) {
  const [form, setForm] = useState<PipeForm | null>(null)
  const [filter, setFilter] = useState("All")
  const shown = S.pipe.filter((p) => filter === "All" || p.status === filter)
  const save = () => {
    if (!form || !form.company.trim()) return
    update((s) => {
      if (form.id) { const p = s.pipe.find((x) => x.id === form.id); if (p) Object.assign(p, form) }
      else s.pipe.push({ ...form, id: s.nextId++ } as Pipe)
    })
    setForm(null)
  }
  const fi = (label: string, k: keyof Omit<Pipe, "id">, type = "text") => (
    <label className="fld"><span>{label}</span><input type={type} value={form?.[k] ?? ""} onChange={(e) => setForm((x) => (x ? { ...x, [k]: e.target.value } : x))} /></label>
  )
  return (
    <div className="page-stack">
      <section className="page-intro">
        <div><p className="eyebrow">JOB SEARCH</p><h2>Keep opportunities moving.</h2><p>{S.pipe.length ? `${st.active} active, ${st.overdue.length} follow-up${st.overdue.length === 1 ? "" : "s"} overdue.` : "Log every application. One with no next action is a dead one."}</p></div>
        <button className="primary-button" onClick={() => setForm(blankPipe())}><Icon name="plus" size={18} />Add application</button>
      </section>
      <div className="pipeline-stats">
        <div><span>Active</span><strong>{st.active}</strong></div>
        <div><span>Live conversations</span><strong>{st.live}</strong></div>
        <div><span>Response rate</span><strong>{Math.round(st.resp * 100)}%</strong></div>
      </div>
      {form && (
        <section className="panel">
          <PanelHeader title={form.id ? "Edit application" : "New application"} />
          <div className="form-grid">
            {fi("Company", "company")}{fi("Role", "role")}{fi("Source", "source")}{fi("Applied", "applied", "date")}
            <label className="fld"><span>Status</span><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>
            {fi("Next action", "next")}{fi("Due", "due", "date")}{fi("Contact", "contact")}
            <label className="fld wide"><span>Notes</span><input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          </div>
          <div className="form-actions"><button className="primary-button" onClick={save} disabled={!form.company.trim()}>Save</button><button className="ghost-button" onClick={() => setForm(null)}>Cancel</button></div>
        </section>
      )}
      {S.pipe.length > 0 && (
        <div className="chips" role="group" aria-label="Filter by status">
          {["All", ...STATUSES].map((s) => { const n = S.pipe.filter((p) => p.status === s).length; return <button key={s} className={filter === s ? "chip on" : "chip"} onClick={() => setFilter(s)}>{s}{s !== "All" && n ? ` ${n}` : ""}</button> })}
        </div>
      )}
      {S.pipe.length === 0 && !form && <p className="empty">No applications yet. Add the first one. Two a day beats twenty in a Sunday panic.</p>}
      <section className="pipeline-grid">
        {shown.map((p) => {
          const late = !!p.due && p.due < t && !CLOSED.includes(p.status)
          return (
            <article className="application-card" key={p.id}>
              <div className="company-row">
                <span className={`company-logo ${STONE[p.status] ?? "purple"}`}>{(p.company || "?")[0].toUpperCase()}</span>
                <span className="card-acts"><button aria-label={`Edit ${p.company}`} onClick={() => setForm({ ...p })}><Icon name="edit" size={16} /></button><button aria-label={`Delete ${p.company}`} onClick={() => { if (confirm(`Delete ${p.company}?`)) update((s) => { s.pipe = s.pipe.filter((x) => x.id !== p.id) }) }}><Icon name="trash" size={16} /></button></span>
              </div>
              <h3>{p.company}</h3>
              <p>{p.role || "—"}</p>
              {p.next && <p className={late ? "next late" : "next"}>→ {p.next}{p.due && ` · ${fdate(p.due)}`}{late && " · overdue"}</p>}
              <div className="application-foot">
                <select className="status-select" value={p.status} aria-label="Status" onChange={(e) => update((s) => { const x = s.pipe.find((y) => y.id === p.id); if (x) x.status = e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
                <small>{p.applied ? fdate(p.applied) : ""}</small>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}

function Bar({ v, max, tone = "purple" }: { v: number; max: number; tone?: string }) {
  return <div className={`pbar ${tone}`}><i style={{ width: `${max ? Math.min(100, (v / max) * 100) : 0}%` }} /></div>
}

function Insights({ S, update, st, wk, wt, t }: Ctx) {
  const [rv, setRv] = useState<Record<string, string>>(S.review[wk] ?? {})
  const [saved, setSaved] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  const last7 = Array.from({ length: 7 }, (_, i) => addD(t, i - 6))
  const hrs = last7.map((d) => { const r = S.log.find((x) => x.d === d); return r ? r.course + r.job + r.gig : 0 })
  const maxH = Math.max(1, ...hrs)
  const score = goalPct(wt)
  const estTotal = S.courses.reduce((a, c) => a + (c.est ?? 0), 0)
  const doneTotal = S.courses.reduce((a, c) => a + (c.est ? Math.min(c.done, c.est) : 0), 0)
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ app: "planner-v2", exported: iso(new Date()), state: S }, null, 2)], { type: "application/json" })
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `planner-backup-${t}.json`; a.click(); URL.revokeObjectURL(a.href)
  }
  const importData = (f?: File) => {
    if (!f) return
    f.text().then((txt) => {
      try {
        const j = JSON.parse(txt); const x = j.state ?? j
        if (!validImport(x)) throw new Error("bad")
        if (confirm("Replace everything in this planner with the file's data?")) update((s) => { Object.assign(s, x) })
      } catch { alert("That file isn't a planner backup.") }
    })
  }
  return (
    <div className="page-stack">
      <section className="page-intro"><div><p className="eyebrow">WEEK OF {fdate(wk).toUpperCase()}</p><h2>Notice what's working.</h2><p>Health first, then courses, then the job search.</p></div></section>

      <section className="insights-grid">
        <article className="panel chart-panel">
          <PanelHeader title="Hours logged" subtitle="Course + job search + gigs, last 7 days" />
          <div className="bar-chart">
            {hrs.map((h, i) => <div key={last7[i]}><small className="val">{h || ""}</small><i style={{ height: `${(h / maxH) * 100}%` }} /><span>{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][fromIso(last7[i]).getDay()]}</span></div>)}
          </div>
        </article>
        <article className="panel score-panel">
          <span className="soft-icon purple"><Icon name="target" /></span>
          <p>WEEKLY TARGETS</p><strong>{score}</strong><h3>{score >= 80 ? "Great momentum" : score >= 40 ? "Building" : "Early in the week"}</h3><span>{wt.won} won {wt.won === 1 ? "day" : "days"} this week</span>
        </article>
      </section>

      <section className="panel">
        <PanelHeader title="This week's targets" subtitle="Small and daily beats large and occasional" />
        <div className="targets">
          {WTARG.map(([label, n, k]) => {
            const v = targetVal(wt, k)
            return (
              <div className="target" key={k}>
                <div className="target-top"><span>{label}</span>
                  {k === "ship"
                    ? <button className={wt.ship ? "chip on" : "chip"} onClick={() => update((s) => { if (s.weekShip[wk]) delete s.weekShip[wk]; else s.weekShip[wk] = true })}>{wt.ship ? "Shipped ✓" : "Mark shipped"}</button>
                    : <strong>{Math.round(v * 10) / 10} / {n}</strong>}
                </div>
                <Bar v={v} max={n} tone={v >= n ? "green" : "purple"} />
              </div>
            )
          })}
        </div>
      </section>

      <section className="metrics">
        <Metric icon="check" tone="green" value={`${Math.round(st.pct * 100)}%`} label="Avg habit completion" note="70% is a strong week" />
        <Metric icon="flame" tone="amber" value={String(st.won)} label="Won days" note={`Best streak: ${st.bestWon}`} />
        <Metric icon="sun" tone="blue" value={st.sleepA ? `${st.sleepA.toFixed(1)}h` : "—"} label="Avg sleep" note={`${st.nights7} nights at 7h+`} />
        <Metric icon="clock" tone="purple" value={st.moodA ? st.moodA.toFixed(1) : "—"} label="Avg mood (1–5)" note={st.moodA && st.moodA < 3 ? "Low lately. Talk to someone." : "Logged nightly"} />
      </section>

      <section className="panel">
        <PanelHeader title="Courses" subtitle={estTotal ? `${doneTotal.toFixed(1)} of ${estTotal}h done · about ${Math.max(0, (estTotal - doneTotal) / 12).toFixed(1)} weeks left at 12h/week` : "Add hour estimates to see progress"} />
        {S.courses.map((c, i) => (
          <div className="course-row" key={c.name}>
            <div className="course-name"><strong>{c.name}</strong><small>{c.prov}</small></div>
            <label className="mini-fld"><span>Done (h)</span><input type="number" min="0" step="0.25" value={c.done || ""} onChange={(e) => update((s) => { s.courses[i].done = num(e.target.value) })} /></label>
            <label className="mini-fld"><span>Total (h)</span><input type="number" min="0" step="0.25" placeholder="?" value={c.est ?? ""} onChange={(e) => update((s) => { s.courses[i].est = e.target.value === "" ? null : num(e.target.value) })} /></label>
            <div className="course-bar">{c.est ? <><Bar v={c.done} max={c.est} tone={c.done >= c.est ? "green" : "purple"} /><small>{Math.min(100, Math.round((c.done / c.est) * 100))}%</small></> : <small>Add total hours</small>}</div>
          </div>
        ))}
      </section>

      <section className="panel">
        <PanelHeader title="Gigs & income" subtitle={`${st.gigH}h logged all-time · ${wt.gig}h this week of 5h`} />
        {GIGS.map(([n, d]) => <div className="gig-row" key={n}><strong>{n}</strong><small>{d}</small></div>)}
        <p className="empty">Suggestions, not researched demand. Check current rates before committing real time. Log hours in the nightly entry.</p>
      </section>

      <section className="panel">
        <PanelHeader title={`Weekly review · ${fdate(wk)}`} subtitle="Sunday, 30 minutes. This is the only place the plan changes." />
        {REVIEW_Q.map(([k, q]) => (
          <label className="fld wide" key={k}><span>{q}</span><textarea rows={2} value={rv[k] ?? ""} onChange={(e) => { setRv({ ...rv, [k]: e.target.value }); setSaved(false) }} /></label>
        ))}
        <div className="form-actions"><button className="primary-button" onClick={() => { update((s) => { s.review[wk] = rv }); setSaved(true) }}>Save review</button>{saved && <span className="ok">Saved</span>}</div>
      </section>

      <section className="panel">
        <PanelHeader title="Your data" subtitle="Everything lives in this browser only. Back it up." />
        <div className="form-actions">
          <button className="ghost-button" onClick={exportData}><Icon name="down" size={16} />Export</button>
          <button className="ghost-button" onClick={() => file.current?.click()}><Icon name="up" size={16} />Import</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={(e) => { importData(e.target.files?.[0]); e.target.value = "" }} />
          <button className="ghost-button danger" onClick={() => { if (confirm("Erase all planner data on this device? This can't be undone.")) { localStorage.removeItem("plannerV2.v1"); location.reload() } }}>Reset</button>
        </div>
      </section>
    </div>
  )
}

export default App
