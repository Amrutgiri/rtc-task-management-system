import api from "./axios";

export const getComments = (taskId: string) =>
  api.get(`/comments/task/${taskId}`);

export const addComment = (data: any) =>
  api.post("/comments", data);

export const deleteComment = (id: string) =>
  api.delete(`/comments/${id}`);
