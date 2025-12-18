import { useState, useEffect, useMemo } from "react";
import { Container, Row, Col, Card, Badge, Form } from "react-bootstrap";
import { type ColumnDef, type PaginationState, type SortingState } from "@tanstack/react-table";
import AdminLayout from "../../components/Admin/AdminLayout";
import AdminDataTable from "../../components/Admin/AdminDataTable";
import Swal from "sweetalert2";
import api from "../../api/axios";

interface User {
  _id: string;
  name: string;
  email: string;
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

export default function Logs() {
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

  useEffect(() => {
    fetchLogs();
  }, [pagination, sorting, globalFilter, startDate, endDate]);

  async function fetchLogs() {
    try {
      setLoading(true);
      const sortBy = sorting[0]?.id || "date";
      const sortOrder = sorting[0]?.desc ? "desc" : "asc";

      const response = await api.get("/worklogs", {
        params: {
          page: pagination.pageIndex + 1,
          pageSize: pagination.pageSize,
          sortBy,
          sortOrder,
          search: globalFilter,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });

      setLogs(response.data.data);
      setTotalCount(response.data.totalCount);
      setPageCount(response.data.totalPages);
    } catch (error: any) {
      console.error("Failed to fetch logs:", error);
      Swal.fire("Error", error?.response?.data?.message || "Failed to load work logs", "error");
    } finally {
      setLoading(false);
    }
  }

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  // Column definitions
  const columns = useMemo<ColumnDef<WorkLog>[]>(
    () => [
      {
        accessorKey: "userId",
        header: "User",
        cell: ({ row }) => (
          <div className="d-flex align-items-center">
            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: 32, height: 32 }}>
              <i className="bi bi-person text-secondary"></i>
            </div>
            <div className="fw-500">{row.original.userId?.name || "Unknown User"}</div>
          </div>
        ),
      },
      {
        accessorKey: "taskId",
        header: "Task",
        cell: ({ row }) => {
          const task = row.original.taskId;
          return task ? (
            <span className="text-primary fw-500">{task.title}</span>
          ) : (
            <span className="text-muted fst-italic">Deleted Task</span>
          );
        },
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ getValue }) => {
          const date = getValue<string>();
          return <span className="text-muted">{new Date(date).toLocaleDateString()}</span>;
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
    ],
    []
  );

  return (
    <AdminLayout title="Global Work Logs">
      <Container fluid>
        <Row className="mb-4">
          <Col>
            <p className="text-muted">View all work logs from employees</p>
          </Col>
        </Row>

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
      </Container>
    </AdminLayout>
  );
}
