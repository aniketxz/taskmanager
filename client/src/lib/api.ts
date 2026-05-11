import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// --- Auth ---
export const authApi = {
  signup: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/signup", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};

// --- Dashboard ---
export const dashboardApi = {
  getStats: () => api.get("/dashboard"),
};

// --- Projects ---
export const projectsApi = {
  getAll: () => api.get("/projects"),
  create: (data: { name: string; description?: string }) =>
    api.post("/projects", data),
  getOne: (projectId: string) => api.get(`/projects/${projectId}`),
  update: (projectId: string, data: { name?: string; description?: string }) =>
    api.patch(`/projects/${projectId}`, data),
  delete: (projectId: string) => api.delete(`/projects/${projectId}`),
};

// --- Members ---
export const membersApi = {
  add: (projectId: string, data: { email: string; role?: "ADMIN" | "MEMBER" }) =>
    api.post(`/projects/${projectId}/members`, data),
  remove: (projectId: string, userId: string) =>
    api.delete(`/projects/${projectId}/members/${userId}`),
};

// --- Tasks ---
export const tasksApi = {
  getAll: (
    projectId: string,
    filters?: { status?: string; priority?: string; assignedTo?: string }
  ) => api.get(`/projects/${projectId}/tasks`, { params: filters }),
  create: (
    projectId: string,
    data: {
      title: string;
      description?: string;
      dueDate?: string;
      priority?: "LOW" | "MEDIUM" | "HIGH";
      status?: "TODO" | "IN_PROGRESS" | "DONE";
      assignedTo?: string;
    }
  ) => api.post(`/projects/${projectId}/tasks`, data),
  getOne: (projectId: string, taskId: string) =>
    api.get(`/projects/${projectId}/tasks/${taskId}`),
  update: (projectId: string, taskId: string, data: Record<string, unknown>) =>
    api.patch(`/projects/${projectId}/tasks/${taskId}`, data),
  delete: (projectId: string, taskId: string) =>
    api.delete(`/projects/${projectId}/tasks/${taskId}`),
};
