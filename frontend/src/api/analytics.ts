import api from "./axios";

export const getAnalyticsSummary = () => api.get("/analytics/summary");

export const getProductivityStats = () => api.get("/analytics/productivity");

export const getWorkStats = () => api.get("/analytics/work-stats");

// NEW: Work Log Analytics
export const getWorkLogsSummary = (params?: any) => api.get("/analytics/worklogs/summary", { params });
export const getWorkLogsTrends = (params?: any) => api.get("/analytics/worklogs/trends", { params });

// NEW: Project Analytics
export const getProjectsProgress = (params?: any) => api.get("/analytics/projects/progress", { params });
export const getProjectsHealth = (params?: any) => api.get("/analytics/projects/health", { params });

// NEW: User Productivity
export const getUsersProductivity = (params?: any) => api.get("/analytics/productivity/users", { params });

// NEW: Export
export const exportWorkLogsCSV = (params?: any) => {
    return api.get("/analytics/export/worklogs", {
        params,
        responseType: "blob"
    });
};

export const exportTasksCSV = () => {
    return api.get("/analytics/export/tasks", {
        responseType: "blob"
    });
};
