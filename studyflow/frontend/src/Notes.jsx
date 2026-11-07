import { useEffect, useMemo, useState } from "react";
import { BookOpenText, FileText, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { addNote, deleteNote, getNotes, updateNote } from "./services/api";
import "./Management.css";

const EMPTY_NOTE = { title: "", subject: "", description: "" };

function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All subjects");
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [form, setForm] = useState(EMPTY_NOTE);

  useEffect(() => {
    let active = true;
    getNotes()
      .then(data => {
        if (active) setNotes(data);
      })
      .catch(loadError => {
        console.error(loadError);
        if (active) setLoadError(loadError.message || "Unable to load notes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadCount]);

  const subjects = useMemo(
    () => [...new Set(notes.map(note => note.subject).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [notes],
  );

  const visibleNotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notes.filter(note => {
      const matchesQuery = !query ||
        `${note.title} ${note.subject} ${note.description}`.toLowerCase().includes(query);
      const matchesSubject = subjectFilter === "All subjects" || note.subject === subjectFilter;
      return matchesQuery && matchesSubject;
    });
  }, [notes, search, subjectFilter]);

  function openCreateForm() {
    setEditingNote(null);
    setForm(EMPTY_NOTE);
    setError("");
    setShowForm(true);
  }

  function openEditForm(note) {
    setEditingNote(note);
    setForm({ title: note.title, subject: note.subject, description: note.description });
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;
    setShowForm(false);
    setEditingNote(null);
  }

  async function saveNote(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const saved = editingNote
        ? await updateNote(editingNote._id, form)
        : await addNote(form);
      setNotes(current => editingNote
        ? current.map(note => note._id === saved._id ? saved : note)
        : [saved, ...current]);
      setShowForm(false);
      setEditingNote(null);
      setForm(EMPTY_NOTE);
    } catch (saveError) {
      console.error(saveError);
      setError(saveError.message || "Unable to save note.");
    } finally {
      setSaving(false);
    }
  }

  async function removeNote(note) {
    if (!window.confirm(`Delete "${note.title}"?`)) return;

    try {
      setError("");
      await deleteNote(note._id);
      setNotes(current => current.filter(item => item._id !== note._id));
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError.message || "Unable to delete note.");
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
          <p className="section-kicker">YOUR KNOWLEDGE LIBRARY</p>
          <h1>Notes</h1>
          <p className="management-subtitle">Keep important ideas, class notes and study references in one place.</p>
        </div>
        <button className="create-button" onClick={openCreateForm}>
          <Plus size={17} /> Add New Note
        </button>
      </div>

      {error && <div className="management-error" role="alert">{error}</div>}

      <div className="management-toolbar">
        <label className="management-search">
          <Search size={17} />
          <input
            aria-label="Search notes"
            placeholder="Search notes..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </label>
        <select
          aria-label="Filter notes by subject"
          value={subjectFilter}
          onChange={event => setSubjectFilter(event.target.value)}
        >
          <option>All subjects</option>
          {subjects.map(subject => <option key={subject}>{subject}</option>)}
        </select>
        <span className="results-count">{visibleNotes.length} {visibleNotes.length === 1 ? "note" : "notes"}</span>
      </div>

      {loading ? (
        <div className="management-state"><span className="loading-spinner" /> Loading notes...</div>
      ) : loadError && notes.length === 0 ? (
        <div className="management-state">
          <BookOpenText size={34} />
          <h2>Could not load notes</h2>
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
      ) : visibleNotes.length === 0 ? (
        <div className="management-state">
          <BookOpenText size={34} />
          <h2>{search || subjectFilter !== "All subjects" ? "No matching notes" : "Your notes library is empty"}</h2>
          <p>{search || subjectFilter !== "All subjects" ? "Try a different search or subject." : "Create your first note and keep your study materials organized."}</p>
          {!search && subjectFilter === "All subjects" && (
            <button className="create-button" onClick={openCreateForm}><Plus size={16} /> Add New Note</button>
          )}
        </div>
      ) : (
        <div className="notes-grid">
          {visibleNotes.map(note => (
            <article className="note-card" key={note._id}>
              <div className="note-card-heading">
                <span className="note-icon"><FileText size={19} /></span>
                <span className="note-subject">{note.subject}</span>
              </div>
              <h2>{note.title}</h2>
              <p>{note.description}</p>
              <div className="note-card-footer">
                <span>Updated {new Date(note.updatedAt || note.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                <div>
                  <button aria-label={`Edit ${note.title}`} onClick={() => openEditForm(note)}><Pencil size={15} /></button>
                  <button className="delete-note-button" aria-label={`Delete ${note.title}`} onClick={() => removeNote(note)}><Trash2 size={15} /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {showForm && (
        <div className="management-modal-backdrop" onMouseDown={event => {
          if (event.target === event.currentTarget) closeForm();
        }}>
          <form className="management-modal" onSubmit={saveNote} aria-labelledby="note-form-title">
            <div className="management-modal-heading">
              <div>
                <h2 id="note-form-title">{editingNote ? "Edit note" : "New note"}</h2>
                <p>Save a useful idea or study reference.</p>
              </div>
              <button type="button" className="modal-close-button" aria-label="Close" onClick={closeForm}>
                <X size={19} />
              </button>
            </div>

            <label htmlFor="note-title">Title</label>
            <input id="note-title" name="title" required maxLength="160" value={form.title} onChange={updateField} placeholder="e.g. TCP congestion control" />

            <label htmlFor="note-subject">Subject / category</label>
            <input
              id="note-subject"
              name="subject"
              list="note-subject-options"
              required
              maxLength="100"
              value={form.subject}
              onChange={updateField}
              placeholder="e.g. Computer Networks"
            />
            <datalist id="note-subject-options">
              {subjects.map(subject => <option key={subject} value={subject} />)}
            </datalist>

            <label htmlFor="note-description">Description</label>
            <textarea id="note-description" name="description" required rows="7" maxLength="10000" value={form.description} onChange={updateField} placeholder="Write your notes here..." />

            <div className="management-form-error" aria-live="polite">
              {error ? error : null}
            </div>
            <div className="management-modal-actions">
              <button type="button" className="secondary-button" onClick={closeForm} disabled={saving}>Cancel</button>
              <button type="submit" className="create-button" disabled={saving}>
                {saving ? "Saving..." : editingNote ? "Save changes" : "Create note"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export default Notes;
