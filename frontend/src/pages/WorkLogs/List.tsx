import { useState, useEffect, useMemo } from "react";
import { Container, Row, Col, Card, Badge, Button, Form, Modal } from "react-bootstrap";
import { type ColumnDef, type PaginationState, type SortingState } from "@tanstack/react-table";
import MainLayout from "../../layout/MainLayout";
import AdminDataTable from "../../components/Admin/AdminDataTable";
import { getWorkLogs, updateWorkLog, deleteWorkLog } from "../../api/worklogs";
import Swal from "sweetalert2";

interface User {
    _id: string;
    name: string;
}

interface Task {
    _id: string;
    title: string;
}

interface WorkLog {
    _id: string;
    userId: User;
    taskId: Task | null;
    date: string;
    durationMinutes: number;
    notes: string;
    createdAt: string;
}

export default function WorkLogsList() {
    // Data state
    const [logs, setLogs] = useState<WorkLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [pageCount, setPageCount] = useState(0);

    // Table state
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const [sorting, setSorting] = useState<SortingState>([
        { id: "date", desc: true }
    ]);
    const [globalFilter, setGlobalFilter] = useState("");

    // Filters
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Edit modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedLog, setSelectedLog] = useState<WorkLog | null>(null);
    const [editFormData, setEditFormData] = useState({
        date: "",
        hours: "",
        minutes: "",
        notes: "",
    });

    useEffect(() => {
        fetchLogs();
    }, [pagination, sorting, globalFilter, startDate, endDate]);

    async function fetchLogs() {
        try {
            setLoading(true);
            const sortBy = sorting[0]?.id || "date";
            const sortOrder = sorting[0]?.desc ? "desc" : "asc";

            const response = await getWorkLogs({
                page: pagination.pageIndex + 1,
                pageSize: pagination.pageSize,
                sortBy,
                sortOrder,
                search: globalFilter,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            });

            setLogs(response.data.data || []);
            setTotalCount(response.data.totalCount || 0);
            setPageCount(response.data.totalPages || 0);
        } catch (error: any) {
            console.error("Failed to fetch logs:", error);
            Swal.fire("Error", error?.response?.data?.message || "Failed to load work logs", "error");
        } finally {
            setLoading(false);
        }
    }

    function formatDuration(minutes: number) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    }

    function openEditModal(log: WorkLog) {
        setSelectedLog(log);
        const hours = Math.floor(log.durationMinutes / 60);
        const minutes = log.durationMinutes % 60;

        setEditFormData({
            date: log.date.split('T')[0],
            hours: hours.toString(),
            minutes: minutes.toString(),
            notes: log.notes || "",
        });
        setShowEditModal(true);
    }

    async function handleUpdateLog() {
        if (!selectedLog) return;

        const hours = parseInt(editFormData.hours) || 0;
        const minutes = parseInt(editFormData.minutes) || 0;
        const durationMinutes = (hours * 60) + minutes;

        if (durationMinutes <= 0) {
            Swal.fire("Error", "Please enter a valid duration", "error");
            return;
        }

        try {
            await updateWorkLog(selectedLog._id, {
                date: editFormData.date,
                durationMinutes,
                notes: editFormData.notes,
            });

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Work log updated successfully",
                showConfirmButton: false,
                timer: 2000,
            });

            setShowEditModal(false);
            setSelectedLog(null);
            fetchLogs();
        } catch (error: any) {
            Swal.fire("Error", error?.response?.data?.message || "Failed to update work log", "error");
        }
    }

    async function handleDeleteLog(log: WorkLog) {
        try {
            const result = await Swal.fire({
                title: "Delete Work Log?",
                text: "This action cannot be undone",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#dc3545",
                confirmButtonText: "Yes, Delete",
            });

            if (result.isConfirmed) {
                await deleteWorkLog(log._id);
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: "Work log deleted successfully",
                    showConfirmButton: false,
                    timer: 2000,
                });
                fetchLogs();
            }
        } catch (error: any) {
            Swal.fire("Error", error?.response?.data?.message || "Failed to delete work log", "error");
        }
    }

    // Calculate total hours
    const totalMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0);

    // Column definitions
    const columns = useMemo<ColumnDef<WorkLog>[]>(
        () => [
            {
                accessorKey: "date",
                header: "Date",
                cell: ({ getValue }) => {
                    const date = getValue<string>();
                    return new Date(date).toLocaleDateString();
                },
            },
            {
                accessorKey: "taskId",
                header: "Task",
                cell: ({ row }) => {
                    const task = row.original.taskId;
                    return task ? (
                        <span className="text-primary fw-500">{task.title}</span>
                    ) : (
                        <span className="text-muted fst-italic">No task</span>
                    );
                },
            },
            {
                accessorKey: "durationMinutes",
                header: "Duration",
                cell: ({ getValue }) => (
                    <Badge bg="light" text="dark" className="border">
                        {formatDuration(getValue<number>())}
                    </Badge>
                ),
            },
            {
                accessorKey: "notes",
                header: "Notes",
                cell: ({ getValue }) => {
                    const notes = getValue<string>();
                    return notes ? (
                        <span className="text-muted small">{notes.substring(0, 50)}{notes.length > 50 ? "..." : ""}</span>
                    ) : (
                        <span className="text-muted">—</span>
                    );
                },
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => {
                    const log = row.original;
                    return (
                        <div className="d-flex gap-1">
                            <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => openEditModal(log)}
                                title="Edit"
                            >
                                ✏️
                            </Button>
                            <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => handleDeleteLog(log)}
                                title="Delete"
                            >
                                🗑️
                            </Button>
                        </div>
                    );
                },
            },
        ],
        []
    );

    return (
        <MainLayout>
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="fw-bold">Work Log History</h3>
                    <Badge bg="primary" className="fs-6">
                        Total: {formatDuration(totalMinutes)}
                    </Badge>
                </div>

                {/* Filters Card */}
                <Card className="mb-4 shadow-sm">
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Label>Start Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        setPagination({ ...pagination, pageIndex: 0 });
                                    }}
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Label>End Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        setPagination({ ...pagination, pageIndex: 0 });
                                    }}
                                />
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Logs Table */}
                <Card className="shadow-sm">
                    <Card.Body className="p-0">
                        <div className="p-3">
                            <AdminDataTable
                                data={logs}
                                columns={columns}
                                loading={loading}
                                pageCount={pageCount}
                                totalItems={totalCount}
                                emptyMessage="No work logs found"
                                onPaginationChange={setPagination}
                                onSortingChange={setSorting}
                                onGlobalFilterChange={(filter) => {
                                    setGlobalFilter(filter);
                                    setPagination({ ...pagination, pageIndex: 0 });
                                }}
                                initialPageSize={10}
                            />
                        </div>
                    </Card.Body>
                </Card>

                {/* Edit Modal */}
                <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>✏️ Edit Work Log</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={editFormData.date}
                                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </Form.Group>

                            <Row>
                                <Col>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Hours</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={editFormData.hours}
                                            onChange={(e) => setEditFormData({ ...editFormData, hours: e.target.value })}
                                            min="0"
                                            max="24"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Minutes</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={editFormData.minutes}
                                            onChange={(e) => setEditFormData({ ...editFormData, minutes: e.target.value })}
                                            min="0"
                                            max="59"
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Label>Notes</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={editFormData.notes}
                                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                                />
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleUpdateLog}>
                            Save Changes
                        </Button>
                    </Modal.Footer>
                </Modal>
            </Container>
        </MainLayout>
    );
}
