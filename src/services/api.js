import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: true,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("studystudent_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function errorMessage(error) {
  return error?.response?.data?.message || error?.message || "Something went wrong. Please try again.";
}

export const authApi = {
  login: (body) => api.post("/auth/login", body),
  register: (body) => api.post("/auth/register", body),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  updateProfile: (body) => api.put("/auth/profile", body),
  changePassword: (body) => api.post("/auth/change-password", body),
  forgotPassword: (body) => api.post("/auth/forgot-password", body),
  resetPassword: (body) => api.post("/auth/reset-password", body),
  verifyEmail: (body) => api.post("/auth/verify-email", body),
  users: (params) => api.get("/auth/users", { params }),
  updateUserRole: (id, role) => api.patch(`/auth/users/${id}/role`, { role }),
  updateUserStatus: (id, isActive) => api.patch(`/auth/users/${id}/status`, { isActive }),
};

export const notesApi = {
  publicNotes: (params) => api.get("/notes/public", { params }),
  detail: (id) => api.get(`/notes/${id}`),
  mine: () => api.get("/notes/my-notes"),
  bookmarks: () => api.get("/notes/bookmarks"),
  upload: (body, onUploadProgress) => api.post("/notes/upload", body, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  }),
  download: (id) => api.get(`/notes/${id}/download`),
  bookmark: (id) => api.post(`/notes/${id}/bookmark`),
  report: (id, body) => api.post(`/notes/${id}/report`, body),
  remove: (id) => api.delete(`/notes/${id}`),
  queue: () => api.get("/notes/queue"),
  reports: () => api.get("/notes/reports"),
  all: (params) => api.get("/notes/all", { params }),
  review: (id, body) => api.post(`/notes/${id}/review`, body),
};

export const academicApi = {
  courses: () => api.get("/academic/courses"),
  subjects: (params) => api.get("/academic/subjects", { params }),
  hierarchy: () => api.get("/academic/hierarchy"),
  createCourse: (body) => api.post("/academic/courses", body),
  createSubject: (body) => api.post("/academic/subjects", body),
  createUnit: (body) => api.post("/academic/units", body),
  createTopic: (body) => api.post("/academic/topics", body),
};

export const dashboardApi = {
  overview: () => api.get("/dashboard/overview"),
};

export const notificationsApi = {
  list: (params) => api.get("/notifications", { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/mark-all-read"),
  seedSystem: () => api.post("/notifications/seed-system"),
};
