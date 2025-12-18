import api from "./axios";

export const getProjects = () => api.get("/projects");
export const createProject = (data: any) => api.post("/projects", data);
export const updateProject = (id: string, data: any) => api.patch(`/projects/${id}`, data);
export const deleteProject = (id: string) => api.delete(`/projects/${id}`);
export const updateProjectStatus = (id: string, status: "active" | "archived") =>
  api.patch(`/projects/${id}/status`, { status });
export const addProjectMember = (id: string, userId: string) =>
  api.post(`/projects/${id}/members`, { userId });
export const removeProjectMember = (id: string, userId: string) =>
  api.delete(`/projects/${id}/members/${userId}`);
