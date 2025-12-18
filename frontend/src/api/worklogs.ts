import api from "./axios";

export interface LogWorkData {
    taskId?: string;  // Made optional
    date: string;
    durationMinutes: number;
    notes?: string;
}

export const logWork = (data: LogWorkData) => api.post("/worklogs", data);

export const createWorkLog = (data: LogWorkData) => api.post("/worklogs", data);

export const updateWorkLog = (id: string, data: Partial<LogWorkData>) => api.patch(`/worklogs/${id}`, data);

export const getWorkLogs = (params?: any) => api.get("/worklogs", { params });

export const getTaskWorkLogs = (taskId: string) => api.get(`/worklogs`, { params: { taskId } });

export const deleteWorkLog = (id: string) => api.delete(`/worklogs/${id}`);
