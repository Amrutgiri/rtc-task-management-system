import api from "./axios";

export const getSystemSettings = () => api.get("/system-settings");
export const updateSystemSettings = (data: any) => api.put("/system-settings", data);
