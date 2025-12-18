import { useState, useEffect, useMemo } from "react";
import { Container, Card, Button, Form, Row, Col, Badge } from "react-bootstrap";
import { type ColumnDef, type PaginationState, type SortingState } from "@tanstack/react-table";
import AdminDataTable from "../../components/Admin/AdminDataTable";
import api from "../../api/axios";
import Swal from "sweetalert2";

interface AuditLog {
    _id: string;
    userId: { _id: string; name: string; email: string };
    action: string;
    entityType: string;
    entityId: string;
    details: any;
    ipAddress: string;
    createdAt: string;
}

export default function AuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [pageCount, setPageCount] = useState(0);

    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 20,
    });
    const [sorting, setSorting] = useState<SortingState>([
        { id: "createdAt", desc: true }
    ]);

    const [users, setUsers] = useState<any[]>([]);
    const [filterUser, setFilterUser] = useState("");
    const [filterAction, setFilterAction] = useState("");
    const [filterEntity, setFilterEntity] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [pagination, sorting, filterUser, filterAction, filterEntity, startDate, endDate]);

    async function fetchUsers() {
        try {
            const res = await api.get("/users");
            setUsers(res.data.data || res.data || []);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    }

    async function fetchLogs() {
        try {
            setLoading(true);
            const params: any = {
                page: pagination.pageIndex + 1,
                pageSize: pagination.pageSize,
                sortBy: sorting[0]?.id || "createdAt",
                sortOrder: sorting[0]?.desc ? "desc" : "asc",
            };

            if (filterUser) params.userId = filterUser;
            if (filterAction) params.action = filterAction;
            if (filterEntity) params.entityType = filterEntity;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await api.get("/audit", { params });
            setLogs(response.data.data || []);
            setTotalCount(response.data.totalCount || 0);
            setPageCount(response.data.totalPages || 0);
        } catch (error: any) {
            console.error("Failed to fetch audit logs:", error);
            Swal.fire("Error", error?.response?.data?.message || "Failed to load audit logs", "error");
        } finally {
            setLoading(false);
        }
    }

    function clearFilters() {
        setFilterUser("");
        setFilterAction("");
        setFilterEntity("");
        setStartDate("");
        setEndDate("");
        setPagination({ ...pagination, pageIndex: 0 });
    }

    const columns = useMemo<ColumnDef<AuditLog>[]>(
        () => [
            {
                accessorKey: "createdAt",
                header: "Timestamp",
                cell: ({ getValue }) => {
                    const date = new Date(getValue<string>());
                    return (
                        <div>
                            <div>{date.toLocaleDateString()}</div>
                            <small className="text-muted">{date.toLocaleTimeString()}</small>
                        </div>
                    );
                },
                size: 150,
            },
            {
                accessorKey: "userId",
                header: "User",
                cell: ({ row }) => (
                    <div>
                        <div className="fw-500">{row.original.userId?.name || "Unknown"}</div>
                        <small className="text-muted">{row.original.userId?.email}</small>
                    </div>
                ),
            },
            {
                accessorKey: "action",
                header: "Action",
                cell: ({ getValue }) => {
                    const action = getValue<string>();
                    const colors: any = {
                        CREATE: "success",
                        UPDATE: "primary",
                        DELETE: "danger",
                        LOGIN: "info",
                        LOGOUT: "secondary",
                        VIEW: "light",
                        EXPORT: "warning"
                    };
                    return (
                        <Badge bg={colors[action] || "secondary"}>
                            {action}
                        </Badge>
                    );
                },
                size: 100,
            },
            {
                accessorKey: "entityType",
                header: "Entity",
                cell: ({ getValue }) => <Badge bg="dark">{getValue<string>()}</Badge>,
                size: 100,
            },
            {
                accessorKey: "ipAddress",
                header: "IP Address",
                cell: ({ getValue }) => (
                    <small className="font-monospace">{getValue<string>() || "—"}</small>
                ),
                size: 130,
            },
            {
                id: "details",
                header: "Details",
                cell: ({ row }) => {
                    const details = row.original.details;
                    if (!details || Object.keys(details).length === 0) return "—";
                    return (
                        <small className="text-muted">
                            {JSON.stringify(details).substring(0, 50)}...
                        </small>
                    );
                },
            },
        ],
        []
    );

    return (
        <Container fluid>
            {/* Filters */}
            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={2}>
                            <Form.Label>User</Form.Label>
                            <Form.Select
                                value={filterUser}
                                onChange={(e) => {
                                    setFilterUser(e.target.value);
                                    setPagination({ ...pagination, pageIndex: 0 });
                                }}
                            >
                                <option value="">All Users</option>
                                {users.map((u) => (
                                    <option key={u._id} value={u._id}>{u.name}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label>Action</Form.Label>
                            <Form.Select
                                value={filterAction}
                                onChange={(e) => {
                                    setFilterAction(e.target.value);
                                    setPagination({ ...pagination, pageIndex: 0 });
                                }}
                            >
                                <option value="">All Actions</option>
                                <option value="CREATE">CREATE</option>
                                <option value="UPDATE">UPDATE</option>
                                <option value="DELETE">DELETE</option>
                                <option value="LOGIN">LOGIN</option>
                                <option value="LOGOUT">LOGOUT</option>
                                <option value="VIEW">VIEW</option>
                                <option value="EXPORT">EXPORT</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label>Entity Type</Form.Label>
                            <Form.Select
                                value={filterEntity}
                                onChange={(e) => {
                                    setFilterEntity(e.target.value);
                                    setPagination({ ...pagination, pageIndex: 0 });
                                }}
                            >
                                <option value="">All Types</option>
                                <option value="Task">Task</option>
                                <option value="Project">Project</option>
                                <option value="User">User</option>
                                <option value="WorkLog">WorkLog</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label>Start Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </Col>
                        <Col md={2}>
                            <Form.Label>End Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </Col>
                        <Col md={2} className="d-flex align-items-end">
                            <Button variant="outline-secondary" onClick={clearFilters} className="w-100">
                                Clear Filters
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Audit Table */}
            <Card className="shadow-sm">
                <Card.Body className="p-0">
                    <AdminDataTable
                        data={logs}
                        columns={columns}
                        loading={loading}
                        pageCount={pageCount}
                        totalItems={totalCount}
                        emptyMessage="No audit logs found"
                        onPaginationChange={setPagination}
                        onSortingChange={setSorting}
                        onGlobalFilterChange={() => { }} // No global search for audit logs
                        initialPageSize={20}
                    />
                </Card.Body>
            </Card>
        </Container>
    );
}
