
const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "https://studyflow-3-clm5.onrender.com/api"
).replace(/\/+$/, "");

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    throw new Error(
      `Cannot reach StudyFlow API at ${API_BASE_URL}. Please check the backend.`,
      { cause: error }
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload?.message
        ? payload.message
        : `Request failed (${response.status})`;

    throw new Error(message);
  }

  return payload;
}

function jsonBody(data) {
  return JSON.stringify(data);
}

// Goals
export const getGoals = () => request("/goals");

export const addGoal = goal =>
  request("/goals", {
    method: "POST",
    body: jsonBody(goal),
  });

export const updateGoal = (id, data) =>
  request(`/goals/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: jsonBody(data),
  });

export const deleteGoal = id =>
  request(`/goals/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

// Projects
export const getProjects = () => request("/projects");

export const addProject = project =>
  request("/projects", {
    method: "POST",
    body: jsonBody(project),
  });

export const updateProject = (id, project) =>
  request(`/projects/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: jsonBody(project),
  });

export const deleteProject = id =>
  request(`/projects/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

// Notes
export const getNotes = () => request("/notes");

export const addNote = note =>
  request("/notes", {
    method: "POST",
    body: jsonBody(note),
  });

export const updateNote = (id, note) =>
  request(`/notes/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: jsonBody(note),
  });

export const deleteNote = id =>
  request(`/notes/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
