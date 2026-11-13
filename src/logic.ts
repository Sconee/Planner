export type Ver = "A" | "B" | "C"
export type Mode = "jobsearch" | "employed"
export type Theme = "system" | "light" | "dark"
export type Course = { name: string; prov: string; est: number | null; done: number }
export type LogRow = { d: string; v: string; woke: string; sleep: number; course: number; job: number; gig: number; apps: number; mood: number; note: string }
export type Pipe = { id: number; company: string; role: string; source: string; applied: string; status: string; next: string; due: string; contact: string; notes: string }
export type State = {
  mode: Mode; theme: Theme; todayVersion: Ver; tomorrowVersion: Ver; verDate: string
  plan: Record<string, { done: Record<string, boolean> }>
  habits: Record<string, Record<string, boolean>>
  log: LogRow[]; pipe: Pipe[]; review: Record<string, Record<string, string>>
  nextId: number; weekShip: Record<string, boolean>; courses: Course[]
}

export const WAKE: Record<Ver, number> = { A: 240, B: 300, C: 360 }
export const KEY = "plannerV2.v1"

// [label, minutes, category, isMVD, linked habit keys]
export const BLOCKS: [string, number, string, number, string[]][] = [
  ["Get out of bed + make the bed", 10, "Anchor", 1, ["up", "bed"]],
  ["Workout or run", 45, "Health", 1, ["workout"]],
  ["Light exercise", 15, "Health", 0, ["lightex"]],
  ["Shower + brush teeth", 20, "Health", 0, []],
  ["Breakfast", 25, "Health", 0, ["breakfast"]],
  ["Review today's plan", 15, "Anchor", 0, ["planam"]],
  ["Course block 1 — deep work", 120, "Courses", 1, ["course"]],
  ["Break — off the screen", 15, "Rest", 0, []],
  ["Job search: applications + outreach", 60, "Job search", 0, ["job"]],
  ["Income: gig work / freelance", 60, "Income", 0, []],
  ["Lunch + rest", 60, "Health", 0, []],
  ["Course block 2 / portfolio practice", 120, "Courses", 0, []],
  ["Sunlight walk + admin", 30, "Health", 0, ["sun"]],
  ["Flex — errands, overflow, nothing", 60, "Flex", 0, []],
  ["People: call, visit, or meet", 60, "Relationships", 0, []],
  ["Reading (book or articles)", 60, "Growth", 0, ["read"]],
  ["Evening mobility (optional)", 45, "Health", 0, ["mobility"]],
  ["Shower + stretch", 20, "Health", 0, ["stretch"]],
  ["Dinner", 45, "Health", 0, []],
  ["Meditate + gratitude", 20, "Growth", 0, ["meditate"]],
  ["Track finances / spending", 15, "Admin", 0, ["fin"]],
  ["Plan tomorrow + pick version", 15, "Anchor", 1, ["tomorrow"]],
  ["Buffer — the day never fits exactly", 55, "Flex", 0, []],
  ["Wind down, screens off", 30, "Rest", 0, []],
]

export const EMP: [string, number, string][] = [
  ["Wake, get up, make the bed", 10, "Morning session"], ["Workout or run", 45, "Morning session"],
  ["Light exercise + stretch", 15, "Morning session"], ["Shower + brush teeth", 20, "Morning session"],
  ["Breakfast", 25, "Morning session"], ["Review the day's plan", 15, "Morning session"],
  ["Commute / reading", 40, "Focus time"], ["Set up for the day", 20, "Focus time"],
  ["Deep work block 1", 150, "Focus time"], ["Break", 20, "Focus time"],
  ["Deep work block 2", 120, "Focus time"], ["Lunch", 45, "Focus time"],
  ["Light tasks + admin", 75, "Focus time"], ["Commute home", 40, "Evening session"],
  ["Evening mobility (optional)", 30, "Evening session"], ["Shower + stretch", 20, "Evening session"],
  ["Dinner", 45, "Evening session"], ["People: partner, family, friends", 90, "Evening session"],
  ["Reading", 45, "Evening session"], ["Meditate + gratitude", 15, "Evening session"],
  ["Track finances", 10, "Evening session"], ["Plan tomorrow + pick version", 15, "Evening session"],
  ["Wind down, screens off", 30, "Evening session"],
]

export const HAB: [string, string][] = [
  ["up", "Up on time"], ["bed", "Bed made"], ["workout", "Workout / run"], ["lightex", "Light exercise"],
  ["stretch", "Stretch"], ["breakfast", "Breakfast eaten"], ["planam", "Plan reviewed (AM)"],
  ["course", "Course block done"], ["job", "Job search block done"], ["apps2", "2+ applications sent"],
  ["sun", "Sunlight walk"], ["mobility", "Evening mobility"], ["meditate", "Meditate + gratitude"],
  ["read", "Read 30 min"], ["fin", "Finances tracked"], ["tomorrow", "Tomorrow planned"], ["lights", "Lights out on time"],
]
export const MVDK = ["up", "workout", "course", "tomorrow"]
export const STATUSES = ["To apply", "Applied", "Screening", "Interview", "Task/Assessment", "Offer", "Rejected", "Ghosted"]
export const LIVE = ["Screening", "Interview", "Task/Assessment", "Offer"]
export const CLOSED = ["Offer", "Rejected", "Ghosted"]
export const WTARG: [string, number, string][] = [
  ["Applications sent", 10, "apps"], ["Course hours", 12, "course"], ["Workouts or runs", 5, "workout"],
  ["Nights at 7h+ sleep", 6, "sleep"], ["Gig / income hours", 5, "gig"], ["Something shipped", 1, "ship"],
]
export const GIGS: [string, string][] = [
  ["Freelance testing", "Upwork, Fiverr, uTest, Testlio — short paid cycles for startups"],
  ["Bug bounties", "Paid per verified bug, no client relationship — Bugcrowd, YesWeHack"],
  ["Automation scripting", "Small Selenium / Playwright / Postman jobs, local or remote"],
  ["QA tutoring / mentoring", "Bootcamp students or juniors, hourly"],
  ["Technical writing", "Test-case templates, QA guides — Medium, dev.to, company blogs"],
]
export const REVIEW_Q: [string, string][] = [
  ["worked", "What worked — keep it"], ["notworked", "What didn't — and why"],
  ["change", "One block to move or delete next week"], ["priority", "Next week's one priority"],
]

// ---------- dates (local time, never UTC) ----------
const p2 = (n: number) => String(n).padStart(2, "0")
export const iso = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
export const today = () => iso(new Date())
export const fromIso = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d) }
export const addD = (s: string, n: number) => { const d = fromIso(s); d.setDate(d.getDate() + n); return iso(d) }
export const weekStart = (s: string) => { const d = fromIso(s); const k = (d.getDay() + 6) % 7; return addD(s, -k) }
export const hm = (min: number) => `${p2(Math.floor((min / 60) % 24))}:${p2(Math.round(min % 60))}`
export const dur = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}` : `${m}m`)
export const num = (v: unknown) => { const n = parseFloat(String(v)); return Number.isFinite(n) ? n : 0 }
export const fdate = (s: string) => fromIso(s).toLocaleDateString("en", { month: "short", day: "numeric" })
export const clock = (sec: number) => `${p2(Math.floor(sec / 60))}:${p2(sec % 60)}`

export function schedule<T extends { mins: number }>(list: T[], v: Ver) {
  let t = WAKE[v]
  return list.map((b) => { const s = t; t += b.mins; return { ...b, start: hm(s), end: hm(t) } })
}

// ---------- persistence ----------
const defaults = (): State => ({
  mode: "jobsearch", theme: "system", todayVersion: "B", tomorrowVersion: "B", verDate: today(),
  plan: {}, habits: {}, log: [], pipe: [], review: {}, nextId: 1, weekShip: {},
  courses: [
    { name: "Agentic AI in Practice", prov: "IBM / SkillsNetwork", est: 25, done: 0 },
    { name: "AI language solutions in Azure", prov: "Microsoft Learn", est: 5.75, done: 0 },
    { name: "MSSE Foundations", prov: "Quantic", est: null, done: 0 },
  ],
})

export function load(): State {
  let s: Partial<State> = {}
  try { s = JSON.parse(localStorage.getItem(KEY) || "{}") || {} } catch { /* ignore */ }
  const st = { ...defaults(), ...s } as State
  // a new day adopts the version you picked last night
  if (st.verDate !== today()) { st.todayVersion = st.tomorrowVersion; st.verDate = today() }
  return st
}
export function persist(s: State) { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* ignore */ } }

export function validImport(x: unknown): x is State {
  const s = x as State
  return !!s && Array.isArray(s.courses) && typeof s.habits === "object" && Array.isArray(s.log) && Array.isArray(s.pipe)
}

// ---------- stats ----------
export const isWon = (h?: Record<string, boolean>) => !!h && MVDK.every((k) => h[k])

export function streakOf(S: State, key: string) {
  let d = today()
  if (!S.habits[d]?.[key]) d = addD(d, -1) // an unfinished today doesn't zero your streak
  let n = 0
  while (S.habits[d]?.[key]) { n++; d = addD(d, -1) }
  return n
}
export function bestStreak(S: State, key: string) {
  const ds = Object.keys(S.habits).filter((d) => S.habits[d][key]).sort()
  let best = 0, run = 0, prev = ""
  for (const d of ds) { run = prev && addD(prev, 1) === d ? run + 1 : 1; best = Math.max(best, run); prev = d }
  return best
}
export function wonStreak(S: State) {
  let d = today()
  if (!isWon(S.habits[d])) d = addD(d, -1)
  let n = 0
  while (isWon(S.habits[d])) { n++; d = addD(d, -1) }
  return n
}
export function bestWon(S: State) {
  const ds = Object.keys(S.habits).filter((d) => isWon(S.habits[d])).sort()
  let best = 0, run = 0, prev = ""
  for (const d of ds) { run = prev && addD(prev, 1) === d ? run + 1 : 1; best = Math.max(best, run); prev = d }
  return best
}

export function stats(S: State) {
  const days = Object.keys(S.habits).filter((d) => Object.values(S.habits[d]).some(Boolean)).sort()
  const won = days.filter((d) => isWon(S.habits[d])).length
  const pct = days.length ? days.reduce((a, d) => a + Object.values(S.habits[d]).filter(Boolean).length / HAB.length, 0) / days.length : 0
  let worst = 1, wr = ""
  if (days.length) HAB.forEach(([k, n]) => { const r = days.filter((d) => S.habits[d][k]).length / days.length; if (r < worst) { worst = r; wr = n } })
  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0)
  const L = S.log, t = today()
  const live = S.pipe.filter((p) => LIVE.includes(p.status)).length
  const applied = S.pipe.filter((p) => p.status !== "To apply").length
  return {
    days: days.length, won, pct, worst: Math.round(worst * 100), wr,
    best: Math.max(0, ...HAB.map(([k]) => bestStreak(S, k))), bestWon: bestWon(S), curWon: wonStreak(S),
    sleepA: avg(L.map((r) => r.sleep)), nights7: L.filter((r) => r.sleep >= 7).length,
    workouts: days.filter((d) => S.habits[d].workout).length, moodA: avg(L.filter((r) => r.mood).map((r) => r.mood)),
    courseH: L.reduce((a, r) => a + r.course, 0), gigH: L.reduce((a, r) => a + r.gig, 0),
    jobH: L.reduce((a, r) => a + r.job, 0), apps: L.reduce((a, r) => a + r.apps, 0),
    live, applied, resp: applied ? live / applied : 0,
    active: S.pipe.filter((p) => !CLOSED.includes(p.status) && p.status !== "To apply").length,
    overdue: S.pipe.filter((p) => p.due && p.due < t && !CLOSED.includes(p.status)),
  }
}

export function weekTotals(S: State, wk: string) {
  const inWk = (d: string) => d >= wk && d <= addD(wk, 6)
  const L = S.log.filter((r) => inWk(r.d))
  const hd = Object.keys(S.habits).filter(inWk)
  return {
    apps: L.reduce((a, r) => a + r.apps, 0), course: L.reduce((a, r) => a + r.course, 0),
    gig: L.reduce((a, r) => a + r.gig, 0), sleep: L.filter((r) => r.sleep >= 7).length,
    workout: hd.filter((d) => S.habits[d].workout).length, ship: S.weekShip[wk] ? 1 : 0,
    won: hd.filter((d) => isWon(S.habits[d])).length,
  }
}
