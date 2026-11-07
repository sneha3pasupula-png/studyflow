import { useEffect, useMemo, useState } from "react";
import { CalendarDays, FolderKanban, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { addProject, deleteProject, getProjects, updateProject } from "./services/api";
import "./Management.css";

const EMPTY_PROJECT = {
  name: "",
  description: "",
  subject: "",
  startDate: "",
  dueDate: "",
  status: "Not Started",
};

const statuses = ["Not Started", "In Progress", "Completed"];

function dateInputValue(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function displayDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not set"
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState(EMPTY_PROJECT);

  useEffect(() => {
    let active = true;
    getProjects()
      .then(data => {
        if (active) setProjects(data);
      })
      .catch(loadError => {
        console.error(loadError);
        if (active) setLoadError(loadError.message || "Unable to load projects.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadCount]);

  const visibleProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter(project => {
      const matchesQuery = !query ||
        `${project.name} ${project.description} ${project.subject}`.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All statuses" || project.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  function openCreateForm() {
    setEditingProject(null);
    setForm(EMPTY_PROJECT);
    setError("");
    setShowForm(true);
  }

  function openEditForm(project) {
    setEditingProject(project);
    setForm({
      name: project.name,
      description: project.description || "",
      subject: project.subject,
      startDate: dateInputValue(project.startDate),
      dueDate: dateInputValue(project.dueDate),
      status: project.status || "Not Started",
    });
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;
    setShowForm(false);
    setEditingProject(null);
  }

  async function saveProject(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const projectData = {
      ...form,
      startDate: form.startDate || null,
      dueDate: form.dueDate || null,
    };

    try {
      const saved = editingProject
        ? await updateProject(editingProject._id, projectData)
        : await addProject(projectData);

      setProjects(current => editingProject
        ? current.map(project => project._id === saved._id ? saved : project)
        : [saved, ...current]);
      setShowForm(false);
      setEditingProject(null);
      setForm(EMPTY_PROJECT);
    } catch (saveError) {
      console.error(saveError);
      setError(saveError.message || "Unable to save project.");
    } finally {
      setSaving(false);
    }
  }

  async function removeProject(project) {
    if (!window.confirm(`Delete "${project.name}"?`)) return;

    try {
      setError("");
      await deleteProject(project._id);
      setProjects(current => current.filter(item => item._id !== project._id));
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError.message || "Unable to delete project.");
    }
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
  }

  return (
    <section className="management-page">
      <div className="management-heading">
        <div>
          <p className="section-kicker">PLAN YOUR LEARNING</p>
          <h1>Projects</h1>
          <p className="management-subtitle">Organize your coursework and track each project from start to finish.</p>
        </div>
        <button className="create-button" onClick={openCreateForm}>
          <Plus size={17} /> Add New Project
        </button>
      </div>

      {error && <div className="management-error" role="alert">{error}</div>}

      <div className="management-toolbar">
        <label className="management-search">
          <Search size={17} />
          <input
            aria-label="Search projects"
            placeholder="Search projects, subjects..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </label>
        <select
          aria-label="Filter projects by status"
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value)}
        >
          <option>All statuses</option>
          {statuses.map(status => <option key={status}>{status}</option>)}
        </select>
        <span className="results-count">{visibleProjects.length} {visibleProjects.length === 1 ? "project" : "projects"}</span>
      </div>

      {loading ? (
        <div className="management-state"><span className="loading-spinner" /> Loading projects...</div>
      ) : loadError && projects.length === 0 ? (
        <div className="management-state">
          <FolderKanban size={34} />
          <h2>Could not load projects</h2>
          <p>{loadError}</p>
          <button
            className="create-button"
            onClick={() => {
              setLoadError("");
              setLoading(true);
              setReloadCount(count => count + 1);
            }}
          >
            Try again
          </button>
        </div>
      ) : visibleProjects.length === 0 ? (
        <div className="management-state">
          <FolderKanban size={34} />
          <h2>{search || statusFilter !== "All statuses" ? "No matching projects" : "No projects yet"}</h2>
          <p>{search || statusFilter !== "All statuses" ? "Try changing the search or status filter." : "Create your first project to organize your study work."}</p>
          {!search && statusFilter === "All statuses" && (
            <button className="create-button" onClick={openCreateForm}><Plus size={16} /> Add New Project</button>
          )}
        </div>
      ) : (
        <div className="project-grid">
          {visibleProjects.map(project => (
            <article className="project-card" key={project._id}>
              <div className="project-card-heading">
                <span className="project-icon"><FolderKanban size={20} /></span>
                <span className={`project-status status-${(project.status || "Not Started").toLowerCase().replaceAll(" ", "-")}`}>
                  {project.status || "Not Started"}
                </span>
              </div>
              <h2>{project.name}</h2>
              <span className="project-subject">{project.subject}</span>
              <p className="project-description">{project.description || "No description added."}</p>
              <div className="project-dates">
                <span><CalendarDays size={15} /> Started <b>{displayDate(project.startDate)}</b></span>
                <span><CalendarDays size={15} /> Due <b>{displayDate(project.dueDate)}</b></span>
              </div>
              <div className="project-card-actions">
                <button onClick={() => openEditForm(project)}><Pencil size={15} /> Edit</button>
                <button className="delete-note-button" onClick={() => removeProject(project)}><Trash2 size={15} /> Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {showForm && (
        <div className="management-modal-backdrop" onMouseDown={event => {
          if (event.target === event.currentTarget) closeForm();
        }}>
          <form className="management-modal" onSubmit={saveProject} aria-labelledby="project-form-title">
            <div className="management-modal-heading">
              <div>
                <h2 id="project-form-title">{editingProject ? "Edit project" : "New project"}</h2>
                <p>Add the details for your study project.</p>
              </div>
              <button type="button" className="modal-close-button" aria-label="Close" onClick={closeForm}>
                <X size={19} />
              </button>
            </div>

            <label htmlFor="project-name">Project name</label>
            <input id="project-name" name="name" required maxLength="120" value={form.name} onChange={updateField} placeholder="e.g. Database design project" />

            <label htmlFor="project-description">Description</label>
            <textarea id="project-description" name="description" rows="3" maxLength="5000" value={form.description} onChange={updateField} placeholder="What are you working on?" />

            <label htmlFor="project-subject">Subject</label>
            <input id="project-subject" name="subject" required maxLength="100" value={form.subject} onChange={updateField} placeholder="e.g. Computer Science" />

            <div className="form-two-columns">
              <div>
                <label htmlFor="project-start-date">Start date</label>
                <input id="project-start-date" name="startDate" type="date" value={form.startDate} onChange={updateField} />
              </div>
              <div>
                <label htmlFor="project-due-date">Due date</label>
                <input id="project-due-date" name="dueDate" type="date" value={form.dueDate} onChange={updateField} min={form.startDate || undefined} />
              </div>
            </div>

            <label htmlFor="project-status">Status</label>
            <select id="project-status" name="status" value={form.status} onChange={updateField}>
              {statuses.map(status => <option key={status}>{status}</option>)}
            </select>

            <div className="management-form-error" aria-live="polite">
              {error ? error : null}
            </div>
            <div className="management-modal-actions">
              <button type="button" className="secondary-button" onClick={closeForm} disabled={saving}>Cancel</button>
              <button type="submit" className="create-button" disabled={saving}>
                {saving ? "Saving..." : editingProject ? "Save changes" : "Create project"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export default Projects;
