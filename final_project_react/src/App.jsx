import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Compass,
  Crosshair,
  Home,
  Moon,
  PenLine,
  Sparkles,
  Sun,
  Trophy,
} from "lucide-react";

const milestones = [
  {
    title: "Define Your Goal",
    description: "Set a clear final goal and choose why this skill matters to you.",
    reward: "Clarity Badge",
  },
  {
    title: "Learn the Foundations",
    description: "Understand the basic vocabulary, tools, and core concepts.",
    reward: "Foundation Badge",
  },
  {
    title: "Complete a Mini Challenge",
    description: "Practice with one small exercise that feels achievable today.",
    reward: "Momentum Badge",
  },
  {
    title: "Build a Tiny Project",
    description: "Apply the skill by making something small, real, and finished.",
    reward: "Builder Badge",
  },
  {
    title: "Reflect and Level Up",
    description: "Review what worked, what was difficult, and what to practice next.",
    reward: "Growth Badge",
  },
];

const dailyTasks = [
  {
    time: "5 min",
    title: "Warm-up",
    bullets: ["Review one idea from your previous session."],
  },
  {
    time: "15 min",
    title: "Focused Practice",
    bullets: ["Work on one exercise connected to your current milestone."],
  },
  {
    time: "10 min",
    title: "Apply It",
    bullets: ["Use the skill in a tiny example, sketch, prototype, or note."],
  },
  {
    time: "5 min",
    title: "Reflection",
    bullets: ["Write what felt easy, confusing, or worth repeating."],
  },
];

const defaultState = {
  skill: "JavaScript",
  level: "Beginner",
  minutes: 30,
  xp: 0,
  completedMilestones: [],
  completedTasks: {},
  completedDates: [],
  customDailyTasks: null,
  logs: [],
};

function todayKey() {
  return dateKey(new Date());
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resourceHref(link) {
  const value = String(link || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (/^r\//i.test(value)) return `https://www.reddit.com/${value}`;

  const youtubeSearch = value.match(/^YouTube (?:channel\/search|search):\s*(.+)$/i);
  if (youtubeSearch) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeSearch[1])}`;
  }

  const searchPhrase = value.match(/^(?:Search phrase|Search):\s*(.+)$/i);
  if (searchPhrase) {
    return `https://www.google.com/search?q=${encodeURIComponent(searchPhrase[1])}`;
  }

  return `https://www.google.com/search?q=${encodeURIComponent(value)}`;
}

function displayTime(time) {
  const value = String(time || "").trim();
  return /^\d+$/.test(value) ? `${value} min` : value;
}

function taskBullets(task) {
  if (Array.isArray(task.bullets)) {
    const bullets = task.bullets.map((bullet) => String(bullet).trim()).filter(Boolean);
    if (bullets.length) return bullets;
  }

  const text = String(task.description || "").trim();
  return text ? [text] : [];
}

function loadState() {
  const saved = localStorage.getItem("build-a-skill-react");
  return saved ? JSON.parse(saved) : defaultState;
}

export default function App() {
  const [page, setPage] = useState("home");
  const [state, setState] = useState(loadState);
  const [darkMode, setDarkMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [focusWarning, setFocusWarning] = useState(false);

  useEffect(() => {
    localStorage.setItem("build-a-skill-react", JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden && focusMode) {
        setFocusWarning(true);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [focusMode]);

  const completedPercent = Math.round(
    (state.completedMilestones.length / milestones.length) * 100
  );

  const appClass = darkMode ? "app dark" : "app";

  return (
    <div className={appClass}>
      <Navbar
        page={page}
        setPage={setPage}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        focusMode={focusMode}
        setFocusMode={setFocusMode}
      />

      <main className="main-shell">
        {page === "home" && <HomePage state={state} setState={setState} setPage={setPage} />}
        {page === "map" && (
          <SkillMap
            state={state}
            setState={setState}
            completedPercent={completedPercent}
          />
        )}
        {page === "daily" && <DailyPlan state={state} setState={setState} />}
        {page === "month" && (
          <MonthlyView
            state={state}
            setState={setState}
          />
        )}
        {page === "log" && <DailyLog state={state} setState={setState} />}
      </main>

      {focusWarning && (
        <div className="focus-overlay" role="alertdialog" aria-modal="true">
          <div className="focus-modal">
            <Crosshair size={34} />
            <h2>Stay Focused</h2>
            <p>Don't switch tabs. Stay focused on your learning goal.</p>
            <button className="primary-button" onClick={() => setFocusWarning(false)}>
              Back to focus
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Navbar({ page, setPage, darkMode, setDarkMode, focusMode, setFocusMode }) {
  const navItems = [
    ["home", "Home", Home],
    ["map", "Skill Map", Compass],
    ["daily", "Daily Plan", CheckCircle2],
    ["month", "Monthly", CalendarDays],
    ["log", "Daily Log", PenLine],
  ];

  return (
    <header className="navbar">
      <button className="brand" onClick={() => setPage("home")}>
        <Sparkles size={22} />
        <span>Build a Skill</span>
      </button>

      <nav className="nav-list">
        {navItems.map(([id, label, Icon]) => (
          <button
            key={id}
            className={page === id ? "nav-button active" : "nav-button"}
            onClick={() => setPage(id)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      <div className="mode-actions">
        <button
          className={focusMode ? "theme-button focus-active" : "theme-button"}
          onClick={() => setFocusMode(!focusMode)}
          title={focusMode ? "Turn off Focus Mode" : "Turn on Focus Mode"}
          aria-label={focusMode ? "Turn off Focus Mode" : "Turn on Focus Mode"}
          aria-pressed={focusMode}
        >
          <Crosshair size={18} />
        </button>

        <button
          className="theme-button"
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}

function HomePage({ state, setState, setPage }) {
  const [form, setForm] = useState({
    skill: state.skill,
    level: state.level,
    minutes: state.minutes,
  });

  function handleSubmit(event) {
    event.preventDefault();
    setState({
      ...state,
      skill: form.skill.trim() || "New Skill",
      level: form.level,
      minutes: Number(form.minutes),
      xp: 0,
      completedMilestones: [],
      completedTasks: {},
      customDailyTasks: null,
    });
    setPage("map");
  }

  return (
    <section className="hero-grid">
      <div className="hero-copy">
        <p className="eyebrow">Personalized learning roadmap</p>
        <h1>BUILD</h1>
        <h1 className="hero-a">A</h1>
        <h1>SKILL</h1>
        <p>
          Build a Skill creates a flexible learning journey with milestones,
          daily micro-tasks, progress tracking, reflections, and API-powered resources.
        </p>

        <div className="hero-stats">
          <Stat label="Current Skill" value={state.skill || "None"} />
          <Stat label="XP" value={state.xp} />
          <Stat label="Milestones" value={`${state.completedMilestones.length}/${milestones.length}`} />
        </div>
      </div>

      <form className="glass-card setup-form" onSubmit={handleSubmit}>
        <h2>Create your journey</h2>

        <label htmlFor="skill" className="field-label">
          Skill
          <span> (e.g. Web Dev, Guitar, Cooking...)</span>
        </label>
        <input
          id="skill"
          value={form.skill}
          onChange={(e) => setForm({ ...form, skill: e.target.value })}
          placeholder="Example: React, drawing, UX design"
        />

        <label htmlFor="level">Experience level</label>
        <select
          id="level"
          value={form.level}
          onChange={(e) => setForm({ ...form, level: e.target.value })}
        >
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </select>

        <label htmlFor="minutes">Time available per day</label>
        <select
          id="minutes"
          value={form.minutes}
          onChange={(e) => setForm({ ...form, minutes: e.target.value })}
        >
          <option value="15">15 minutes</option>
          <option value="30">30 minutes</option>
          <option value="45">45 minutes</option>
          <option value="60">60 minutes</option>
        </select>

        <button className="primary-button">Generate Skill Map</button>
      </form>
    </section>
  );
}

function SkillMap({ state, setState, completedPercent }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resourceError, setResourceError] = useState("");
  const nextMilestone = milestones.find(
    (_, index) => !state.completedMilestones.includes(index)
  );

  function completeMilestone(index) {
    if (state.completedMilestones.includes(index)) return;

    setState({
      ...state,
      completedMilestones: [...state.completedMilestones, index],
      xp: state.xp + 50,
    });
  }

  async function findResources() {
    setLoading(true);
    setResources([]);
    setResourceError("");

    try {
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          skill: state.skill,
          level: state.level,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not generate resources.");
      }

      setResources(data.categories || []);
    } catch (error) {
      setResourceError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <PageIntro
        label="Roadmap"
        title={`${state.skill} Skill Map`}
        text="Complete one milestone to unlock the next stage of the learning journey."
      />

      <div className="dashboard">
        <Stat label="Level" value={Math.floor(state.xp / 100) + 1} />
        <Stat label="XP" value={state.xp} />
        <Stat label="Progress" value={`${completedPercent}%`} />
        <Stat label="Daily Time" value={`${state.minutes} min`} />
      </div>

      <div className="quest-hud">
        <div className="quest-progress">
          <div className="quest-progress-copy">
            <span>Quest Progress</span>
            <strong>{completedPercent}%</strong>
          </div>
          <div className="quest-progress-bar" aria-label={`${completedPercent}% complete`}>
            <div style={{ width: `${completedPercent}%` }} />
          </div>
          <p>
            {nextMilestone
              ? `Next stop: ${nextMilestone.title}`
              : "All milestones complete. Your badge case is full."}
          </p>
        </div>

        <div className="badge-case" aria-label="Earned badges">
          {milestones.map((milestone, index) => {
            const earned = state.completedMilestones.includes(index);

            return (
              <div
                key={milestone.reward}
                className={`badge-token ${earned ? "earned" : ""}`}
                title={earned ? milestone.reward : "Locked badge"}
              >
                <Trophy size={18} />
                <span>{milestone.reward}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="two-column">
        <div className="map-path">
          {milestones.map((milestone, index) => {
            const completed = state.completedMilestones.includes(index);
            const unlocked = index === 0 || state.completedMilestones.includes(index - 1);

            return (
              <article
                key={milestone.title}
                className={`milestone-card ${completed ? "complete" : ""} ${!unlocked ? "locked" : ""}`}
              >
                <div className="milestone-node">{completed ? "✓" : index + 1}</div>
                <div>
                  <h3>{milestone.title}</h3>
                  <p>{milestone.description}</p>
                  <span>{milestone.reward}</span>
                </div>
                <button
                  disabled={!unlocked || completed}
                  onClick={() => completeMilestone(index)}
                >
                  {completed ? "Done" : unlocked ? "Complete" : "Locked"}
                </button>
              </article>
            );
          })}
        </div>

        <aside className="glass-card resource-card">
          <BookOpen size={28} />
          <h2>Resource Finder</h2>
          <p>
            Supported by OpenAI to suggest relevant resources for the skill you want to learn.
          </p>
          <button className="secondary-button" onClick={findResources}>
            {loading ? "Searching..." : "Find Resources"}
          </button>
          {resourceError && <p className="resource-error">{resourceError}</p>}

          <div className="resource-list">
            {resources.map((category) => (
              <div className="resource-category" key={category.name}>
                <h3>{category.name}</h3>
                {category.items.map((item, index) => (
                  <div className="resource-item" key={`${category.name}-${item.title}-${index}`}>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                    {item.link && (
                      <a href={resourceHref(item.link)} target="_blank" rel="noreferrer">
                        {item.link}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function DailyPlan({ state, setState }) {
  const today = todayKey();
  const planTasks = state.customDailyTasks?.length ? state.customDailyTasks : dailyTasks;
  const completed = state.completedTasks[today] || [];
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState("");

  function toggleTask(index) {
    const alreadyDone = completed.includes(index);
    const updatedTasks = alreadyDone
      ? completed.filter((item) => item !== index)
      : [...completed, index];

    const updatedDates =
      !alreadyDone && !state.completedDates.includes(today)
        ? [...state.completedDates, today]
        : state.completedDates;

    setState({
      ...state,
      completedTasks: {
        ...state.completedTasks,
        [today]: updatedTasks,
      },
      completedDates: updatedDates,
      xp: alreadyDone ? state.xp : state.xp + 15,
    });
  }

  async function generatePlan() {
    setLoadingPlan(true);
    setPlanError("");

    try {
      const response = await fetch("/api/daily-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          skill: state.skill,
          level: state.level,
          minutes: state.minutes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not generate a daily plan.");
      }

      setState({
        ...state,
        customDailyTasks: data.tasks,
        completedTasks: {
          ...state.completedTasks,
          [today]: [],
        },
      });
    } catch (error) {
      setPlanError(error.message);
    } finally {
      setLoadingPlan(false);
    }
  }

  const suggestion =
    completed.length === 0
      ? "Try AI generated study plan based on your experience level and availability"
      : completed.length < planTasks.length
      ? "Nice progress. Focus on one more task instead of finishing everything perfectly."
      : "You finished today's plan. Add a reflection in Daily Log to lock in what you learned.";

  return (
    <section>
      <PageIntro
        label="Today"
        title="Daily Plan"
        text="Break down the skill with small, manageable tasks each day"
      />

      <div className="two-column">
        <div className="task-list">
          {planTasks.map((task, index) => (
            <label
              key={task.title}
              className={`task-card ${completed.includes(index) ? "complete" : ""}`}
            >
              <input
                type="checkbox"
                checked={completed.includes(index)}
                onChange={() => toggleTask(index)}
              />
              <div className="task-content">
                <div className={`task-icon tone-${index + 1}`}>{index + 1}</div>
                <div className="task-copy">
                  <h3>{task.title}</h3>
                  <ul>
                    {taskBullets(task).map((bullet, bulletIndex) => (
                      <li key={`${task.title}-bullet-${bulletIndex}`}>{bullet}</li>
                    ))}
                  </ul>
                </div>
                <div className="task-time">
                  <strong>{displayTime(task.time)}</strong>
                </div>
              </div>
            </label>
          ))}
        </div>

        <aside className="glass-card suggestion-card">
          <Trophy size={30} />
          <h2>Adaptive Suggestion</h2>
          <p>{suggestion}</p>
          <div className="progress-bar">
            <div style={{ width: `${(completed.length / planTasks.length) * 100}%` }} />
          </div>
          <span>{completed.length}/{planTasks.length} tasks complete</span>
          <button className="secondary-button plan-button" onClick={generatePlan}>
            {loadingPlan ? "Generating..." : "Generate Plan"}
          </button>
          {planError && <p className="plan-error">{planError}</p>}
        </aside>
      </div>
    </section>
  );
}

function MonthlyView({ state, setState }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const finalDay = new Date(year, month + 1, 0).getDate();

  const days = useMemo(() => {
    const result = [];
    for (let i = 0; i < first.getDay(); i++) result.push(null);
    for (let d = 1; d <= finalDay; d++) result.push(new Date(year, month, d));
    return result;
  }, [year, month, first, finalDay]);

  const activityByDate = useMemo(() => {
    const activity = {};

    Object.entries(state.completedTasks).forEach(([date, tasks]) => {
      activity[date] = (activity[date] || 0) + tasks.length;
    });

    state.completedDates.forEach((date) => {
      activity[date] = (activity[date] || 0) + 1;
    });

    state.logs.forEach((log) => {
      const parsed = new Date(log.date);
      if (Number.isNaN(parsed.getTime())) return;

      const date = dateKey(parsed);
      activity[date] = (activity[date] || 0) + 1;
    });

    return activity;
  }, [state.completedDates, state.completedTasks, state.logs]);

  function toggleDate(date) {
    const key = dateKey(date);
    const exists = state.completedDates.includes(key);

    setState({
      ...state,
      completedDates: exists
        ? state.completedDates.filter((item) => item !== key)
        : [...state.completedDates, key],
      xp: exists ? state.xp : state.xp + 10,
    });
  }

  return (
    <section>
      <PageIntro
        label="Consistency"
        title="Monthly View"
        text="Click a date to mark a learning day complete or incomplete."
      />

      <div className="glass-card calendar-card">
        <h2>{now.toLocaleString("en-US", { month: "long", year: "numeric" })}</h2>
        <div className="calendar-names">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="calendar-grid">
          {days.map((date, index) => {
            if (!date) return <div key={`blank-${index}`} />;

            const key = dateKey(date);
            const complete = state.completedDates.includes(key);
            const isToday = key === todayKey();

            return (
              <button
                key={key}
                className={`calendar-day ${complete ? "complete" : ""} ${isToday ? "today" : ""}`}
                onClick={() => toggleDate(date)}
              >
                <strong>{date.getDate()}</strong>
                <span>{complete ? "Complete" : "Open"}</span>
              </button>
            );
          })}
        </div>

        <ActivityHeatmap
          year={year}
          activityByDate={activityByDate}
        />
      </div>
    </section>
  );
}

function ActivityHeatmap({ year, activityByDate }) {
  const { weeks, monthLabels } = useMemo(() => {
    const start = new Date(year, 0, 1);
    start.setDate(start.getDate() - start.getDay());

    const end = new Date(year, 11, 31);
    end.setDate(end.getDate() + (6 - end.getDay()));

    const weekList = [];
    let week = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      week.push(new Date(cursor));

      if (week.length === 7) {
        weekList.push(week);
        week = [];
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    const labels = Array.from({ length: 12 }, (_, month) => {
      const firstOfMonth = new Date(year, month, 1);
      const daysSinceStart = Math.floor((firstOfMonth - start) / 86400000);
      return {
        label: firstOfMonth.toLocaleString("en-US", { month: "short" }),
        column: Math.floor(daysSinceStart / 7) + 1,
      };
    });

    return { weeks: weekList, monthLabels: labels };
  }, [year]);

  const activeDays = weeks.flat().filter((date) => {
    const key = dateKey(date);
    return date.getFullYear() === year && activityByDate[key] > 0;
  }).length;

  const chartColumns = { gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` };

  return (
    <section className="activity-panel" aria-label="Yearly activity heatmap">
      <div className="activity-header">
        <div>
          <h3>{year} Goal Activity</h3>
          <p>{activeDays} active days</p>
        </div>
      </div>

      <div className="activity-scroll">
        <div className="activity-map">
          <div className="activity-months" style={chartColumns}>
            {monthLabels.map((month) => (
              <span
                key={month.label}
                style={{ gridColumn: `${month.column} / span 4` }}
              >
                {month.label}
              </span>
            ))}
          </div>

          <div className="activity-body">
            <div className="activity-weekdays">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            <div className="activity-grid" style={chartColumns}>
              {weeks.map((week, weekIndex) =>
                week.map((date, dayIndex) => {
                  const key = dateKey(date);
                  const isThisYear = date.getFullYear() === year;
                  const count = activityByDate[key] || 0;
                  const level = isThisYear && count > 0 ? 1 : 0;

                  return (
                    <div
                      key={`activity-${weekIndex}-${dayIndex}`}
                      className={`activity-day level-${level} ${isThisYear ? "" : "outside-year"}`}
                      title={`${date.toLocaleDateString()}: ${count} activity item${count === 1 ? "" : "s"}`}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DailyLog({ state, setState }) {
  const [entry, setEntry] = useState({ mood: "Focused", text: "" });

  function saveLog(event) {
    event.preventDefault();
    if (!entry.text.trim()) return;

    const today = todayKey();

    setState({
      ...state,
      logs: [
        ...state.logs,
        {
          mood: entry.mood,
          text: entry.text,
          date: new Date().toLocaleString(),
        },
      ],
      completedDates: state.completedDates.includes(today)
        ? state.completedDates
        : [...state.completedDates, today],
      xp: state.xp + 20,
    });

    setEntry({ mood: "Focused", text: "" });
  }

  return (
    <section>
      <PageIntro
        label="Reflection"
        title="Daily Log"
        text="Reflection turns practice into progress. Save what you learned and what to try next."
      />

      <div className="two-column reverse">
        <form className="glass-card input-card" onSubmit={saveLog}>
          <h2>New Reflection</h2>
          <select
            value={entry.mood}
            onChange={(e) => setEntry({ ...entry, mood: e.target.value })}
          >
            <option>Focused</option>
            <option>Confused</option>
            <option>Excited</option>
            <option>Tired but tried</option>
          </select>
          <textarea
            rows="8"
            value={entry.text}
            onChange={(e) => setEntry({ ...entry, text: e.target.value })}
            placeholder="Today I learned..."
          />
          <button className="primary-button">Save Log</button>
        </form>

        <div className="post-list">
          {state.logs.length === 0 ? (
            <article className="post-card">
              <h3>No logs yet</h3>
              <p>Write your first reflection after finishing a task.</p>
            </article>
          ) : (
            state.logs.map((log, index) => (
              <article className="post-card" key={`${log.date}-${index}`}>
                <span>{log.date} · {log.mood}</span>
                <p>{log.text}</p>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function PageIntro({ label, title, text }) {
  return (
    <div className="page-intro">
      <p className="eyebrow">{label}</p>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
