import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Check,
  Clock3,
  Folder,
  LayoutDashboard,
  LifeBuoy,
  ListTodo,
  NotebookPen,
  Plus,
  Search,
  Settings,
  Target,
  Trash2,
} from "lucide-react";
import { deleteGoal, getGoals, updateGoal } from "./services/api";
import StudyGoals from "./StudyGoals";
import Projects from "./Projects";
import Notes from "./Notes";
import "./index.css";
import "./App.css";

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "goals", label: "Study Goals", icon: ListTodo },
  { id: "progress", label: "Progress", icon: Target },
  { id: "projects", label: "Projects", icon: Folder },
  { id: "notes", label: "Notes", icon: NotebookPen },
];

function formatDueDate(value) {
  if (!value) return "No due date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";

  return `Due ${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  function openPage(page) {
    setActivePage(page);
    setError("");
  }

  useEffect(() => {
    if (activePage !== "dashboard" && activePage !== "progress") return;

    let active = true;

    async function loadGoals() {
      try {
        setLoading(true);
        setError("");
        const data = await getGoals();
        if (active) setGoals(data);
      } catch (loadError) {
        console.error(loadError);
        if (active) setError(loadError.message || "Unable to load study goals.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadGoals();
    return () => {
      active = false;
    };
  }, [activePage]);

  const completedUnits = goals.reduce(
    (total, goal) => total + Math.min(goal.progress || 0, goal.target || 1),
    0,
  );
  const totalUnits = goals.reduce((total, goal) => total + (goal.target || 1), 0);
  const progress = totalUnits ? Math.round((completedUnits / totalUnits) * 100) : 0;
  const inProgressCount = goals.filter(
    goal => !goal.completed && (goal.progress || 0) > 0,
  ).length;

  const filteredGoals = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return goals;
    return goals.filter(goal =>
      `${goal.title} ${goal.subject}`.toLowerCase().includes(query),
    );
  }, [goals, search]);

  const upcomingGoals = useMemo(
    () =>
      goals
        .filter(goal => goal.dueDate && !goal.completed)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 4),
    [goals],
  );

  async function toggleGoal(goal) {
    const target = goal.target || 1;
    const isComplete = !goal.completed;

    try {
      setError("");
      const updated = await updateGoal(goal._id, {
        progress: isComplete ? target : 0,
        completed: isComplete,
      });
      setGoals(current => current.map(item => item._id === goal._id ? updated : item));
    } catch (updateError) {
      console.error(updateError);
      setError(updateError.message || "Unable to update goal progress.");
    }
  }

  async function removeGoal(goal) {
    if (!window.confirm(`Delete "${goal.title}"?`)) return;

    try {
      setError("");
      await deleteGoal(goal._id);
      setGoals(current => current.filter(item => item._id !== goal._id));
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError.message || "Unable to delete this goal.");
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => openPage("dashboard")}>
          <span className="brand-mark"><BookOpen size={20} /></span>
          <span>StudyFlow</span>
        </button>

        <p className="menu-title">MENU</p>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${activePage === id ? "active" : ""}`}
              onClick={() => openPage(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === "goals" && goals.length > 0 && (
                <span className="nav-count">{goals.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className={`nav-item ${activePage === "settings" ? "active" : ""}`} onClick={() => openPage("settings")}>
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <button className={`nav-item ${activePage === "help" ? "active" : ""}`} onClick={() => openPage("help")}>
            <LifeBuoy size={18} />
            <span>Help</span>
          </button>
          <div className="sidebar-profile">
            <div className="avatar">S</div>
            <div><strong>Student</strong><span>My Workspace</span></div>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <label className="search-box">
            <Search size={17} />
            <input
              aria-label="Search study goals"
              placeholder="Search tasks"
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </label>
          <div className="topbar-actions">
            <button className="create-button" onClick={() => openPage("goals")}>
              Create <Plus size={16} />
            </button>
            <button className="icon-button" aria-label="Notifications">
              <span className="notification-dot" />
              <Clock3 size={19} />
            </button>
            <div className="avatar top-avatar" aria-label="Student profile">S</div>
          </div>
        </header>

        {error && <div className="app-error" role="alert">{error}</div>}

        {activePage === "goals" ? (
          <StudyGoals />
        ) : activePage === "projects" ? (
          <Projects />
        ) : activePage === "notes" ? (
          <Notes />
        ) : activePage === "dashboard" ? (
          <div className="dashboard-page">
            <section className="urgent-section">
              <div className="section-title-row">
                <div>
                  <p className="section-kicker">YOUR PLAN</p>
                  <h1>Urgent tasks <span>({filteredGoals.length})</span></h1>
                </div>
                <button className="text-button" onClick={() => openPage("goals")}>
                  View all goals <span aria-hidden="true">→</span>
                </button>
              </div>

              {loading ? (
                <p className="dashboard-message">Loading your study plan...</p>
              ) : filteredGoals.length === 0 ? (
                <div className="dashboard-message">
                  {search ? "No study goals match your search." : "No study goals yet. Create one to start planning."}
                  {!search && (
                    <button className="create-button empty-create" onClick={() => openPage("goals")}>
                      Create a goal <Plus size={16} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="urgent-grid">
                  {filteredGoals.slice(0, 4).map(goal => {
                    const target = goal.target || 1;
                    const amount = Math.min(goal.progress || 0, target);
                    const percentage = Math.round((amount / target) * 100);

                    return (
                      <article className="task-card" key={goal._id}>
                        <div className="task-card-top">
                          <span className="task-type"><Folder size={14} /> {goal.type || "Study"}</span>
                          <button
                            className={`task-check ${goal.completed ? "checked" : ""}`}
                            aria-label={goal.completed ? "Mark goal incomplete" : "Mark goal complete"}
                            onClick={() => toggleGoal(goal)}
                          >
                            {goal.completed && <Check size={13} />}
                          </button>
                        </div>
                        <h2>{goal.title}</h2>
                        <div className="task-tags">
                          <span>{goal.subject}</span>
                          <span className={`priority-chip ${goal.priority?.toLowerCase() || "medium"}`}>
                            {goal.priority || "Medium"}
                          </span>
                        </div>
                        <div className="task-due"><CalendarDays size={14} /> {formatDueDate(goal.dueDate)}</div>
                        <div className="task-progress-track">
                          <span style={{ width: `${percentage}%` }} />
                        </div>
                        <div className="task-progress-label">
                          <span>{amount}/{target} steps completed</span>
                          <button aria-label={`Delete ${goal.title}`} onClick={() => removeGoal(goal)}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="dashboard-lower">
              <div className="panel productivity-panel">
                <div className="panel-heading">
                  <div>
                    <p className="section-kicker">AT A GLANCE</p>
                    <h2>Your productivity</h2>
                  </div>
                  <span className="period-label">All goals</span>
                </div>
                <div className="productivity-summary">
                  <div className="completion-widget">
                    <h3>Goals progress</h3>
                    <div className="progress-ring" style={{ "--progress": `${progress}%` }}>
                      <div><strong>{progress}%</strong></div>
                    </div>
                    <p>{completedUnits} of {totalUnits} steps complete</p>
                    <small>{inProgressCount} goals in progress</small>
                  </div>
                  <div className="goal-chart">
                    <h3>Progress by goal</h3>
                    {goals.length === 0 ? (
                      <p className="chart-empty">Add goals to see your progress here.</p>
                    ) : goals.slice(0, 6).map(goal => {
                      const percentage = Math.min(
                        100,
                        Math.round(((goal.progress || 0) / (goal.target || 1)) * 100),
                      );
                      return (
                        <div className="chart-row" key={goal._id}>
                          <span title={goal.title}>{goal.title}</span>
                          <div className="chart-track"><span style={{ width: `${percentage}%` }} /></div>
                          <b>{percentage}%</b>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="panel schedule-panel">
                <div className="panel-heading">
                  <div>
                    <p className="section-kicker">COMING UP</p>
                    <h2>Study schedule</h2>
                  </div>
                  <CalendarDays size={19} />
                </div>
                {upcomingGoals.length ? (
                  <div className="schedule-list">
                    {upcomingGoals.map(goal => (
                      <article className="schedule-item" key={goal._id}>
                        <div className="schedule-date">
                          <strong>{new Date(goal.dueDate).toLocaleDateString(undefined, { day: "2-digit" })}</strong>
                          <span>{new Date(goal.dueDate).toLocaleDateString(undefined, { month: "short" })}</span>
                        </div>
                        <div className="schedule-detail">
                          <strong>{goal.title}</strong>
                          <span>{goal.subject}</span>
                        </div>
                        <span className="schedule-dot" />
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="schedule-empty">
                    <CalendarDays size={30} />
                    <p>No upcoming deadlines</p>
                    <span>Add a due date to a goal to see it here.</span>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : activePage === "progress" ? (
          <section className="progress-page">
            <div className="section-title-row">
              <div>
                <p className="section-kicker">YOUR ACHIEVEMENT</p>
                <h1>Study progress</h1>
              </div>
              <button className="create-button" onClick={() => openPage("goals")}>
                Manage goals <Plus size={16} />
              </button>
            </div>
            <div className="progress-overview">
              <div className="progress-ring large-ring" style={{ "--progress": `${progress}%` }}>
                <div><strong>{progress}%</strong><span>complete</span></div>
              </div>
              <div>
                <h2>{completedUnits} of {totalUnits} study steps complete</h2>
                <p>{inProgressCount} goals currently in progress</p>
              </div>
            </div>
            <div className="panel progress-goals">
              <h2>Progress by goal</h2>
              {loading ? <p className="dashboard-message">Loading your study plan...</p> :
                goals.length === 0 ? <p className="dashboard-message">Your goals will appear here once you create them.</p> :
                  goals.map(goal => {
                    const percentage = Math.min(
                      100,
                      Math.round(((goal.progress || 0) / (goal.target || 1)) * 100),
                    );
                    return (
                      <div className="progress-goal-row" key={goal._id}>
                        <div><strong>{goal.title}</strong><span>{goal.subject}</span></div>
                        <div className="task-progress-track"><span style={{ width: `${percentage}%` }} /></div>
                        <b>{percentage}%</b>
                      </div>
                    );
                  })}
            </div>
          </section>
        ) : activePage === "settings" ? (
          <section className="simple-page">
            <p className="section-kicker">PREFERENCES</p>
            <h1>Settings</h1>
            <p>Manage your StudyFlow workspace preferences.</p>
            <div className="panel settings-panel">
              <div><strong>Workspace</strong><span>Personal study planner</span></div>
              <div><strong>Study reminders</strong><span>Use project and goal due dates to plan your study schedule.</span></div>
              <div><strong>Data storage</strong><span>Your projects, notes and study goals are saved to your connected MongoDB database.</span></div>
            </div>
          </section>
        ) : (
          <section className="simple-page">
            <p className="section-kicker">STUDYFLOW SUPPORT</p>
            <h1>Help</h1>
            <p>Quick tips for keeping your study plan organized.</p>
            <div className="help-grid">
              <article className="panel"><h2>Study goals</h2><p>Set daily or weekly targets, then update progress as you complete each step.</p><button className="text-button" onClick={() => openPage("goals")}>Open Study Goals →</button></article>
              <article className="panel"><h2>Projects</h2><p>Track coursework with a subject, timeline and status. Edit a project whenever plans change.</p><button className="text-button" onClick={() => openPage("projects")}>Open Projects →</button></article>
              <article className="panel"><h2>Notes</h2><p>Save class notes by subject and use search or the category filter to find them later.</p><button className="text-button" onClick={() => openPage("notes")}>Open Notes →</button></article>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
