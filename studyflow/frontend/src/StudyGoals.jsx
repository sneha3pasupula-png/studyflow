
import { useEffect, useMemo, useState } from "react";
import {
  Target, Flame, CalendarDays, TrendingUp,
  Plus, Trash2, RotateCcw, BookOpen,
  CheckCircle2, X, Minus, Loader2
} from "lucide-react";

import {
  getGoals,
  addGoal,
  updateGoal,
  deleteGoal
} from "./services/api";

import "./StudyGoals.css";

function StudyGoals() {
  const [goals, setGoals] = useState([]);
  const [activeTab, setActiveTab] = useState("Daily");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    subject: "Computer Networks",
    priority: "Medium",
    type: "Daily",
    target: 5,
    dueDate: ""
  });

  useEffect(() => {
    loadGoals();
  }, []);

  async function loadGoals() {
    try {
      setLoading(true);
      setError("");
      const data = await getGoals();
      setGoals(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load goals. Check your backend server.");
    } finally {
      setLoading(false);
    }
  }

  const dailyGoals = useMemo(
    () => goals.filter(g => g.type === "Daily"),
    [goals]
  );

  const weeklyGoals = useMemo(
    () => goals.filter(g => g.type === "Weekly"),
    [goals]
  );

  const currentGoals = activeTab === "Daily"
    ? dailyGoals
    : weeklyGoals;

  function getProgress(items) {
    const target = items.reduce(
      (sum, goal) => sum + (goal.target || 1), 0
    );

    const progress = items.reduce(
      (sum, goal) => sum + Math.min(goal.progress || 0, goal.target || 1), 0
    );

    return {
      done: progress,
      target,
      percentage: target
        ? Math.round((progress / target) * 100)
        : 0
    };
  }

  const daily = getProgress(dailyGoals);
  const weekly = getProgress(weeklyGoals);
  const overall = getProgress(goals);

  async function handleAddGoal(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const savedGoal = await addGoal({
        ...form,
        target: Number(form.target),
        dueDate: form.dueDate || null,
        progress: 0,
        completed: false
      });

      setGoals(prev => [savedGoal, ...prev]);
      setActiveTab(form.type);
      setShowForm(false);

      setForm({
        title: "",
        subject: "Computer Networks",
        priority: "Medium",
        type: "Daily",
        target: 5,
        dueDate: ""
      });
    } catch (err) {
      console.error(err);
      setError("Unable to create goal.");
    } finally {
      setSaving(false);
    }
  }

  async function changeProgress(goal, amount) {
    const target = goal.target || 1;
    const nextProgress = Math.max(
      0,
      Math.min(target, (goal.progress || 0) + amount)
    );

    try {
      setError("");

      const updated = await updateGoal(goal._id, {
        progress: nextProgress,
        completed: nextProgress >= target
      });

      setGoals(prev =>
        prev.map(g => g._id === goal._id ? updated : g)
      );
    } catch (err) {
      console.error(err);
      setError("Unable to update progress.");
    }
  }

  async function completeGoal(goal) {
    try {
      const updated = await updateGoal(goal._id, {
        progress: goal.target || 1,
        completed: true
      });

      setGoals(prev =>
        prev.map(g => g._id === goal._id ? updated : g)
      );
    } catch (err) {
      console.error(err);
      setError("Unable to complete goal.");
    }
  }

  async function resetGoal(goal) {
    try {
      setError("");
      const updated = await updateGoal(goal._id, {
        progress: 0,
        completed: false
      });

      setGoals(prev =>
        prev.map(g => g._id === goal._id ? updated : g)
      );
    } catch (err) {
      console.error(err);
      setError("Unable to reset goal progress.");
    }
  }

  async function removeGoal(id) {
    if (!window.confirm("Delete this study goal?")) return;

    try {
      await deleteGoal(id);
      setGoals(prev => prev.filter(g => g._id !== id));
    } catch (err) {
      console.error(err);
      setError("Unable to delete goal.");
    }
  }

  async function resetAll() {
    if (!goals.length) return;

    if (!window.confirm("Reset progress of all study goals?")) return;

    try {
      setSaving(true);
      setError("");

      const updatedGoals = await Promise.all(
        goals.map(goal =>
          updateGoal(goal._id, {
            progress: 0,
            completed: false
          })
        )
      );

      setGoals(updatedGoals);
    } catch (err) {
      console.error(err);
      setError("Unable to reset all goals.");
      await loadGoals();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="study-page">

      <div className="study-header">
        <div className="study-heading">
          <div className="heading-icon">
            <Target size={35} />
          </div>
          <div>
            <h1>Study Goals</h1>
            <p>Set targets and track your learning progress</p>
          </div>
        </div>

        <div className="header-actions">
          <button className="reset-btn" onClick={resetAll}>
            <RotateCcw size={19} />
            Reset All
          </button>

          <button
            className="new-goal-btn"
            onClick={() => setShowForm(true)}
          >
            <Plus size={20} />
            New Goal
          </button>
        </div>
      </div>

      {error && <div className="study-error">{error}</div>}

      <div className="goal-stats">

        <div className="goal-stat">
          <div className="stat-symbol daily-symbol">
            <Flame size={30} />
          </div>
          <div>
            <h2>{daily.done}/{daily.target}</h2>
            <p>Daily Goals</p>
          </div>
        </div>

        <div className="goal-stat">
          <div className="stat-symbol weekly-symbol">
            <CalendarDays size={30} />
          </div>
          <div>
            <h2>{weekly.done}/{weekly.target}</h2>
            <p>Weekly Goals</p>
          </div>
        </div>

        <div className="goal-stat">
          <div className="stat-symbol overall-symbol">
            <TrendingUp size={30} />
          </div>
          <div>
            <h2>{overall.percentage}%</h2>
            <p>Overall Progress</p>
          </div>
        </div>

      </div>

      <div className="goal-tabs">
        <button
          className={activeTab === "Daily" ? "selected" : ""}
          onClick={() => setActiveTab("Daily")}
        >
          <CheckCircle2 size={19} />
          Daily Goals ({dailyGoals.length})
        </button>

        <button
          className={activeTab === "Weekly" ? "selected" : ""}
          onClick={() => setActiveTab("Weekly")}
        >
          <CalendarDays size={19} />
          Weekly Goals ({weeklyGoals.length})
        </button>
      </div>

      <div className="goal-list">

        {loading ? (
          <div className="goal-empty">
            <Loader2 className="spin" size={32} />
            <p>Loading your study goals...</p>
          </div>
        ) : currentGoals.length === 0 ? (
          <div className="goal-empty">
            <BookOpen size={45} />
            <h3>No {activeTab.toLowerCase()} goals yet</h3>
            <p>Create your first study goal and start tracking progress.</p>
            <button
              className="new-goal-btn"
              onClick={() => {
                setForm(prev => ({ ...prev, type: activeTab }));
                setShowForm(true);
              }}
            >
              <Plus size={18} /> Create Goal
            </button>
          </div>
        ) : (
          currentGoals.map(goal => {
            const target = goal.target || 1;
            const progress = goal.progress || 0;
            const percentage = Math.min(
              100,
              Math.round((progress / target) * 100)
            );

            return (
              <div className="goal-card" key={goal._id}>

                <div className="goal-card-top">
                  <div className="goal-book-icon">
                    <BookOpen size={27} />
                  </div>

                  <div className="goal-info">
                    <h3>{goal.title}</h3>
                    <p>{goal.subject}</p>
                    <div className="goal-tags">
                      <span className="type-tag">{goal.type}</span>
                      <span className={`priority-tag ${goal.priority?.toLowerCase()}`}>
                        {goal.priority} Priority
                      </span>
                      <span className="count-label">
                          {progress}/{target} steps
                      </span>
                    </div>
                  </div>

                    <div className="goal-card-actions">
                      <button
                        className="icon-action"
                        onClick={() => resetGoal(goal)}
                        title="Reset goal progress"
                        aria-label="Reset goal progress"
                        disabled={progress === 0}
                      >
                        <RotateCcw size={19} />
                      </button>
                      <button
                        className="icon-action delete-action"
                        onClick={() => removeGoal(goal._id)}
                        title="Delete goal"
                        aria-label="Delete goal"
                      >
                        <Trash2 size={19} />
                      </button>
                    </div>
                </div>

                <div className="goal-progress-track">
                  <div
                    className="goal-progress-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="goal-card-bottom">
                  <div className="counter-actions">
                    <button
                      disabled={progress <= 0}
                      onClick={() => changeProgress(goal, -1)}
                    >
                      <Minus size={16} /> 1
                    </button>

                    <button
                      disabled={progress >= target}
                      onClick={() => changeProgress(goal, 1)}
                    >
                      <Plus size={16} /> 1
                    </button>
                  </div>

                  <button
                    className={`complete-btn ${goal.completed ? "is-complete" : ""}`}
                    onClick={() => completeGoal(goal)}
                    disabled={goal.completed}
                  >
                    <CheckCircle2 size={17} />
                    {goal.completed ? "Completed" : "Complete"}
                  </button>
                </div>

              </div>
            );
          })
        )}

      </div>

      {showForm && (
        <div className="goal-modal-bg">
          <form className="goal-modal" onSubmit={handleAddGoal}>

            <div className="modal-heading">
              <div>
                <h2>Create Study Goal</h2>
                <p>Add a new target to your learning plan.</p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setShowForm(false)}
              >
                <X size={21} />
              </button>
            </div>

            <label>Goal Title</label>
            <input
              required
              placeholder="e.g. Complete DBMS chapter 1"
              value={form.title}
              onChange={e =>
                setForm({ ...form, title: e.target.value })
              }
            />

            <label>Subject</label>
            <select
              value={form.subject}
              onChange={e =>
                setForm({ ...form, subject: e.target.value })
              }
            >
              <option>Computer Networks</option>
              <option>DBMS</option>
              <option>DSA</option>
              <option>Operating Systems</option>
              <option>Mathematics</option>
              <option>Other</option>
            </select>

            <label>Goal Type</label>
            <select
              value={form.type}
              onChange={e =>
                setForm({ ...form, type: e.target.value })
              }
            >
              <option value="Daily">Daily Goal</option>
              <option value="Weekly">Weekly Goal</option>
            </select>

            <label>Target Count</label>
            <input
              type="number"
              min="1"
              max="100"
              required
              value={form.target}
              onChange={e =>
                setForm({ ...form, target: e.target.value })
              }
            />

            <label>Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={e =>
                setForm({ ...form, dueDate: e.target.value })
              }
            />

            <label>Priority</label>
            <select
              value={form.priority}
              onChange={e =>
                setForm({ ...form, priority: e.target.value })
              }
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>

            <div className="modal-buttons">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="new-goal-btn"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Goal"}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}

export default StudyGoals;
