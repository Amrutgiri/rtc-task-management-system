import { useState, useEffect } from "react";
import { Modal, Form, Button, Spinner, InputGroup } from "react-bootstrap";
import Swal from "sweetalert2";
import { logWork } from "../api/worklogs";

interface LogWorkModalProps {
    show: boolean;
    task: any;
    onHide: () => void;
    onWebLogAdded?: () => void;
}

export default function LogWorkModal({ show, task, onHide, onWebLogAdded }: LogWorkModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split("T")[0],
        hours: 0,
        minutes: 30,
        notes: "",
    });

    useEffect(() => {
        if (show) {
            setFormData({
                date: new Date().toISOString().split("T")[0],
                hours: 0,
                minutes: 30,
                notes: "",
            });
        }
    }, [show]);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async () => {
        if (!task) return;

        const totalMinutes = parseInt(formData.hours as any) * 60 + parseInt(formData.minutes as any);

        if (totalMinutes <= 0) {
            Swal.fire("Error", "Please enter a valid duration", "error");
            return;
        }

        try {
            setLoading(true);
            await logWork({
                taskId: task._id,
                date: formData.date,
                durationMinutes: totalMinutes,
                notes: formData.notes,
            });

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Work logged successfully!",
                showConfirmButton: false,
                timer: 1500,
            });

            if (onWebLogAdded) onWebLogAdded();
            onHide();
        } catch (error: any) {
            Swal.fire("Error", error?.response?.data?.message || "Failed to log work", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Log Work: {task?.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-500">Date</Form.Label>
                        <Form.Control
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            disabled={loading}
                            max={new Date().toISOString().split("T")[0]}
                        />
                    </Form.Group>

                    <Form.Label className="fw-500">Duration</Form.Label>
                    <InputGroup className="mb-3">
                        <Form.Control
                            type="number"
                            name="hours"
                            min="0"
                            value={formData.hours}
                            onChange={handleChange}
                            disabled={loading}
                            placeholder="Hours"
                        />
                        <InputGroup.Text>Hrs</InputGroup.Text>
                        <Form.Control
                            type="number"
                            name="minutes"
                            min="0"
                            max="59"
                            value={formData.minutes}
                            onChange={handleChange}
                            disabled={loading}
                            placeholder="Min"
                        />
                        <InputGroup.Text>Min</InputGroup.Text>
                    </InputGroup>

                    <Form.Group className="mb-3">
                        <Form.Label className="fw-500">Notes (Optional)</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="What did you work on?"
                            disabled={loading}
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" onClick={onHide} disabled={loading}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                    {loading ? <Spinner size="sm" animation="border" /> : "Log Time"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
