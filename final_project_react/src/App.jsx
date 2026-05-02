import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Compass,
  Home,
  MessageCircle,
  Moon,
  PenLine,
  Sparkles,
  Sun,
  Trophy,
} from "lucide-react";

const milestones = [
  {
    title: "Define Your Quest",
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
  { time: "5 min", title: "Warm-up", description: "Review one idea from your previous session." },
  { time: "15 min", title: "Focused Practice", description: "Work on one exercise connected to your current milestone." },
  { time: "10 min", title: "Apply It", description: "Use the skill in a tiny example, sketch, prototype, or note." },
  { time: "5 min", title: "Reflection", description: "Write what felt easy, confusing, or worth repeating." },
];

const defaultState = {
  skill: "JavaScript",
  level: "Beginner",
  minutes: 30,
  xp: 0,
  completedMilestones: [],
  completedTasks: {},
  completedDates: [],
  logs: [],
  posts: [
    {
      title: "Welcome to the learner forum!",
      body: "Share one small win, a question, or a challenge you are facing.",
      date: new Date().toLocaleString(),
      likes: 0,
    },
  ],
};

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function loadState() {
  const saved = localStorage.getItem("build-a-skill-react");
  return saved ? JSON.parse(saved) : defaultState;
}

export default function App() {
  const [page, setPage] = useState("home");
  const [state, setState] = useState(loadState);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    localStorage.setItem("build-a-skill-react", JSON.stringify(state));
  }, [state]);

  const completedPercent = Math.round(
    (state.completedMilestones.length / milestones.length) * 100
  );

  const appClass = darkMode ? "app dark" : "app";

  return (
    <div className={appClass}>
      <Navbar page={page} setPage={setPage} darkMode={darkMode} setDarkMode={setDarkMode} />

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
        {page === "month" && <MonthlyView state={state} setState={setState} />}
        {page === "forum" && <Forum state={state} setState={setState} />}
        {page === "log" && <DailyLog state={state} setState={setState} />}
      </main>
    </div>
  );
}

function Navbar({ page, setPage, darkMode, setDarkMode }) {
  const navItems = [
    ["home", "Home", Home],
    ["map", "Skill Map", Compass],
    ["daily", "Daily Plan", CheckCircle2],
    ["month", "Monthly", CalendarDays],
    ["forum", "Forum", MessageCircle],
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

      <button className="theme-button" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>
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
    });
    setPage("map");
  }

  return (
    <section className="hero-grid">
      <div className="hero-copy">
        <p className="eyebrow">Personalized learning roadmap</p>
        <h1>Turn a skill into a quest you actually want to finish.</h1>
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

        <label htmlFor="skill">Skill</label>
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

    try {
      const query = encodeURIComponent(state.skill || "learning");
      const response = await fetch(`https://openlibrary.org/search.json?q=${query}&limit=6`);
      const data = await response.json();

      setResources(
        data.docs.map((book) => ({
          title: book.title,
          author: book.author_name?.slice(0, 2).join(", ") || "Unknown author",
          year: book.first_publish_year || "Unknown year",
        }))
      );
    } catch {
      setResources([{ title: "Could not load resources", author: "Try again later", year: "" }]);
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
            This uses the external Open Library API to find books related to your selected skill.
          </p>
          <button className="secondary-button" onClick={findResources}>
            {loading ? "Searching..." : "Find API Resources"}
          </button>

          <div className="resource-list">
            {resources.map((book, index) => (
              <div className="resource-item" key={`${book.title}-${index}`}>
                <strong>{book.title}</strong>
                <span>{book.author} · {book.year}</span>
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
  const completed = state.completedTasks[today] || [];

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

  const suggestion =
    completed.length === 0
      ? "Start with the warm-up. Make the first step almost too easy."
      : completed.length < dailyTasks.length
      ? "Nice progress. Focus on one more task instead of finishing everything perfectly."
      : "You finished today's plan. Add a reflection in Daily Log to lock in what you learned.";

  return (
    <section>
      <PageIntro
        label="Today"
        title="Daily Plan"
        text="Small tasks make the roadmap feel manageable and help you keep momentum."
      />

      <div className="two-column">
        <div className="task-list">
          {dailyTasks.map((task, index) => (
            <label
              key={task.title}
              className={`task-card ${completed.includes(index) ? "complete" : ""}`}
            >
              <input
                type="checkbox"
                checked={completed.includes(index)}
                onChange={() => toggleTask(index)}
              />
              <div>
                <span>{task.time}</span>
                <h3>{task.title}</h3>
                <p>{task.description}</p>
              </div>
            </label>
          ))}
        </div>

        <aside className="glass-card suggestion-card">
          <Trophy size={30} />
          <h2>Adaptive Suggestion</h2>
          <p>{suggestion}</p>
          <div className="progress-bar">
            <div style={{ width: `${(completed.length / dailyTasks.length) * 100}%` }} />
          </div>
          <span>{completed.length}/{dailyTasks.length} tasks complete</span>
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

  function toggleDate(date) {
    const key = date.toISOString().split("T")[0];
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

            const key = date.toISOString().split("T")[0];
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
      </div>
    </section>
  );
}

function Forum({ state, setState }) {
  const [post, setPost] = useState({ title: "", body: "" });

  function submitPost(event) {
    event.preventDefault();
    if (!post.title.trim() || !post.body.trim()) return;

    setState({
      ...state,
      posts: [
        ...state.posts,
        {
          title: post.title,
          body: post.body,
          date: new Date().toLocaleString(),
          likes: 0,
        },
      ],
    });

    setPost({ title: "", body: "" });
  }

  function likePost(index) {
    const posts = [...state.posts];
    posts[index] = { ...posts[index], likes: posts[index].likes + 1 };
    setState({ ...state, posts });
  }

  return (
    <section>
      <PageIntro
        label="Community"
        title="Forum"
        text="This is a local demo forum: no login, no email, and no real data collection."
      />

      <div className="two-column reverse">
        <form className="glass-card input-card" onSubmit={submitPost}>
          <h2>Create a Post</h2>
          <input
            value={post.title}
            onChange={(e) => setPost({ ...post, title: e.target.value })}
            placeholder="Post title"
          />
          <textarea
            rows="6"
            value={post.body}
            onChange={(e) => setPost({ ...post, body: e.target.value })}
            placeholder="Ask a question or share a small win..."
          />
          <button className="primary-button">Post</button>
        </form>

        <div className="post-list">
          {state.posts.map((item, index) => (
            <article className="post-card" key={`${item.title}-${index}`}>
              <span>{item.date}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <button onClick={() => likePost(index)}>Encourage 👍 {item.likes}</button>
            </article>
          ))}
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
