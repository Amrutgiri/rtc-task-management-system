import api from "./axios";

/**
 * User Management API Endpoints
 */

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "developer";
  active: boolean;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  role?: "admin" | "manager" | "developer";
  password?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: "admin" | "manager" | "developer";
  active?: boolean;
  avatar?: string;
}

export interface ResetPasswordPayload {
  password: string;
}

// ============================================
// USER MANAGEMENT ENDPOINTS
// ============================================

/**
 * Get all users (Admin/Manager only)
 */
export async function getAllUsers(): Promise<User[]> {
  const response = await api.get("/users");
  return response.data;
}

/**
 * Create new user (Admin only)
 */
export async function createUser(payload: CreateUserPayload): Promise<User> {
  const response = await api.post("/users", payload);
  return response.data;
}

/**
 * Update user details (Admin only)
 */
export async function updateUser(
  userId: string,
  payload: UpdateUserPayload
): Promise<User> {
  const response = await api.patch(`/users/${userId}`, payload);
  return response.data;
}

/**
 * Reset user password (Admin only)
 */
export async function resetUserPassword(
  userId: string,
  payload: ResetPasswordPayload
): Promise<{ message: string }> {
  const response = await api.patch(`/users/${userId}/reset-password`, payload);
  return response.data;
}

/**
 * Deactivate user (sets active: false)
 */
export async function deactivateUser(userId: string): Promise<User> {
  return updateUser(userId, { active: false });
}

/**
 * Activate user (sets active: true)
 */
export async function activateUser(userId: string): Promise<User> {
  return updateUser(userId, { active: true });
}

/**
 * Change user role
 */
export async function changeUserRole(
  userId: string,
  role: "admin" | "manager" | "developer"
): Promise<User> {
  return updateUser(userId, { role });
}

/**
 * Approve pending user (Admin only)
 */
export async function approveUser(userId: string): Promise<{ message: string; user: User }> {
  const response = await api.patch(`/users/${userId}/approve`);
  return response.data;
}

/**
 * Reject pending user (Admin only)
 */
export async function rejectUser(userId: string, reason?: string): Promise<{ message: string }> {
  const response = await api.delete(`/users/${userId}/reject`, {
    data: { reason }
  });
  return response.data;
}

// ============================================
// PROJECT MANAGEMENT ENDPOINTS (Future)
// ============================================

export interface Project {
  _id: string;
  name: string;
  description: string;
  members: string[];
  status: "active" | "archived";
  createdAt: string;
}

export async function getAllProjects(): Promise<Project[]> {
  const response = await api.get("/projects");
  return response.data;
}

export async function getProjectDetails(projectId: string): Promise<Project> {
  const response = await api.get(`/projects/${projectId}`);
  return response.data;
}

// ============================================
// ANALYTICS ENDPOINTS (Future)
// ============================================

export async function getAnalytics(period: "day" | "week" | "month") {
  const response = await api.get("/analytics", {
    params: { period },
  });
  return response.data;
}
