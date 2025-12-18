import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import MainLayout from "../layout/MainLayout";
import { getTaskById, updateTask } from "../api/tasks";
import { getComments, addComment, deleteComment } from "../api/comments";
import { Card, Button, Form, ListGroup, Modal } from "react-bootstrap";
import Swal from "sweetalert2";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";
import FileUpload from "../components/FileUpload";
import AttachmentList from "../components/AttachmentList";
import "../styles/file-upload.css";

// Single socket instance
const socket = io(import.meta.env.VITE_API_URL || "http://localhost:3232", { autoConnect: true });

export default function TaskDetails() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [task, setTask] = useState<any>(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    status: "",
    priority: "",
  });

  useEffect(() => {
    loadTask();
    loadComments();
  }, [id]);

  // SOCKET COMMENT LISTENER
  useEffect(() => {
    socket.emit("join-task", id);

    socket.on("new-comment", (comment) => {
      setComments((prev) => [comment, ...prev]);
    });

    return () => socket.off("new-comment");
  }, [id]);

  // -------------------------
  // LOAD TASK
  // -------------------------
  async function loadTask() {
    try {
      const res = await getTaskById(id);
      setTask(res.data);

      // Pre-fill edit modal
      setEditData({
        title: res.data.title,
        description: res.data.description,
        status: res.data.status,
        priority: res.data.priority,
      });
    } catch (err) {
      console.error(err);
    }
  }

  // -------------------------
  // LOAD COMMENTS
  // -------------------------
  async function loadComments() {
    try {
      const res = await getComments(id!);
      setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  // -------------------------
  // ADD COMMENT
  // -------------------------
  async function handleAddComment() {
    if (!user) return;

    await addComment({
      content: commentText,
      taskId: id,
      userId: user.id,
    });

    setCommentText("");
    loadComments();
  }

  // -------------------------
  // DELETE COMMENT
  // -------------------------
  async function handleDeleteComment(commentId: string) {
    const res = await Swal.fire({
      title: "Delete comment?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
    });

    if (res.isConfirmed) {
      await deleteComment(commentId);
      Swal.fire("Deleted!", "", "success");
      loadComments();
    }
  }

  // -------------------------
  // HANDLE UPDATE TASK
  // -------------------------
  async function handleUpdateTask() {
    try {
      await updateTask(id!, editData);

      Swal.fire({
        icon: "success",
        title: "Task updated!",
        timer: 1200,
        showConfirmButton: false,
      });

      setShowEditModal(false);
      loadTask(); // refresh UI
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to update task", "error");
    }
  }

  if (!task) return <MainLayout>Loading...</MainLayout>;

  return (
    <MainLayout>

      <h3 className="fw-bold mb-4">{task.title}</h3>

      {/* ----------------------- */}
      {/* TASK INFORMATION CARD */}
      {/* ----------------------- */}
      <Card className="p-3 shadow-sm mb-4">
        <h5 className="fw-bold">Task Information</h5>

        <p><strong>Status:</strong> {task.status}</p>
        <p><strong>Priority:</strong> {task.priority}</p>
        <p><strong>Description:</strong></p>
        <p>{task.description || "No description provided."}</p>

        <Button
          className="mt-3"
          variant="outline-primary"
          onClick={() => setShowEditModal(true)}
        >
          ✏️ Edit Task
        </Button>
      </Card>

      {/* ----------------------- */}
      {/* FILE ATTACHMENTS SECTION */}
      {/* ----------------------- */}
      <Card className="p-3 shadow-sm mb-4">
        <h5 className="fw-bold mb-3">📎 File Attachments</h5>

        <FileUpload
          entityId={id!}
          entityType="task"
          onUploadComplete={loadTask}
        />

        <hr className="my-4" />

        <AttachmentList
          entityId={id!}
          entityType="task"
          onAttachmentDeleted={loadTask}
        />
      </Card>

      {/* ----------------------- */}
      {/* COMMENTS SECTION */}
      {/* ----------------------- */}
      <Card className="p-3 shadow-sm mb-3">
        <h5 className="fw-bold mb-3">Write a Comment</h5>

        <Form.Control
          as="textarea"
          rows={2}
          value={commentText}
          placeholder="Share your thoughts..."
          onChange={(e) => setCommentText(e.target.value)}
          className="mb-2"
        />

        <Button
          className="rounded-pill px-4"
          onClick={handleAddComment}
          disabled={!commentText.trim()}
        >
          Post Comment
        </Button>

        <ListGroup className="mt-4">
          {comments.map((c: any) => (
            <ListGroup.Item key={c._id} className="border-0 px-0">
              <div className="d-flex gap-3">

                <div
                  className="avatar rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: 40,
                    height: 40,
                    background: "#007bff20",
                    color: "#007bff",
                    fontWeight: "bold",
                    fontSize: 18,
                  }}
                >
                  {c.userId?.name?.[0]?.toUpperCase() || "U"}
                </div>

                <div className="flex-grow-1">

                  <div className="d-flex justify-content-between">
                    <strong>{c.userId?.name || "Unknown User"}</strong>
                    <small className="text-muted">
                      {new Date(c.createdAt).toLocaleString()}
                    </small>
                  </div>

                  <div className="p-3 rounded mt-1" style={{ background: "#f5f7fa" }}>
                    {c.content}
                  </div>

                  {/* Delete only if comment created by current user */}
                  {c.userId?._id === user?.id && (
                    <div className="mt-2">
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteComment(c._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}

                </div>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>

      </Card>

      {/* ----------------------- */}
      {/* EDIT MODAL */}
      {/* ----------------------- */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Task</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                value={editData.title}
                onChange={(e) =>
                  setEditData({ ...editData, title: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editData.description}
                onChange={(e) =>
                  setEditData({ ...editData, description: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={editData.status}
                onChange={(e) =>
                  setEditData({ ...editData, status: e.target.value })
                }
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="completed">Completed</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Priority</Form.Label>
              <Form.Select
                value={editData.priority}
                onChange={(e) =>
                  setEditData({ ...editData, priority: e.target.value })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateTask}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

    </MainLayout>
  );
}
