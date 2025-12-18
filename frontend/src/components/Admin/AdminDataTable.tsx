import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
    type PaginationState,
} from "@tanstack/react-table";
import { Table, Form, InputGroup, Button, Spinner } from "react-bootstrap";
import "./AdminDataTable.css";

export interface AdminDataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    loading?: boolean;
    emptyMessage?: string;
    // Server-side pagination
    pageCount?: number;
    totalItems?: number;
    onPaginationChange?: (pagination: PaginationState) => void;
    onSortingChange?: (sorting: SortingState) => void;
    onGlobalFilterChange?: (filter: string) => void;
    // Initial state
    initialPageSize?: number;
}

export default function AdminDataTable<T>({
    data,
    columns,
    loading = false,
    emptyMessage = "No data found",
    pageCount,
    totalItems,
    onPaginationChange,
    onSortingChange,
    onGlobalFilterChange,
    initialPageSize = 10,
}: AdminDataTableProps<T>) {

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        // Server-side mode when pageCount or callbacks provided
        manualPagination: !!onPaginationChange,
        manualSorting: !!onSortingChange,
        manualFiltering: !!onGlobalFilterChange,
        pageCount: pageCount,
        initialState: {
            pagination: {
                pageSize: initialPageSize,
                pageIndex: 0,
            },
        },
        onPaginationChange: (updater) => {
            if (onPaginationChange) {
                const newState = typeof updater === 'function'
                    ? updater(table.getState().pagination)
                    : updater;
                onPaginationChange(newState);
            }
        },
        onSortingChange: (updater) => {
            if (onSortingChange) {
                const newState = typeof updater === 'function'
                    ? updater(table.getState().sorting)
                    : updater;
                onSortingChange(newState);
            }
        },
        onGlobalFilterChange: (filter) => {
            if (onGlobalFilterChange) {
                onGlobalFilterChange(filter);
            }
        },
    });

    const pagination = table.getState().pagination;
    const startItem = pagination.pageIndex * pagination.pageSize + 1;
    const endItem = Math.min(
        (pagination.pageIndex + 1) * pagination.pageSize,
        totalItems || data.length
    );
    const totalCount = totalItems || data.length;

    return (
        <div className="admin-data-table">
            {/* Global Search */}
            {onGlobalFilterChange && (
                <div className="mb-3">
                    <InputGroup>
                        <InputGroup.Text>
                            <i className="bi bi-search"></i>
                        </InputGroup.Text>
                        <Form.Control
                            placeholder="Search..."
                            onChange={(e) => onGlobalFilterChange(e.target.value)}
                        />
                    </InputGroup>
                </div>
            )}

            {/* Table */}
            <div className="table-responsive">
                <Table hover className="mb-0">
                    <thead className="bg-light">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        onClick={header.column.getToggleSortingHandler()}
                                        style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                                    >
                                        {header.isPlaceholder ? null : (
                                            <div className="d-flex align-items-center gap-2">
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                                {header.column.getCanSort() && (
                                                    <span className="sort-indicator">
                                                        {header.column.getIsSorted() === 'asc' && '↑'}
                                                        {header.column.getIsSorted() === 'desc' && '↓'}
                                                        {!header.column.getIsSorted() && '↕'}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-5">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="mt-2 text-muted">Loading...</p>
                                </td>
                            </tr>
                        ) : table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-5 text-muted">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <tr key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-3">
                <div className="text-muted small">
                    Showing {loading ? 0 : startItem} to {loading ? 0 : endItem} of {totalCount} entries
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                    {/* Page Size Selector */}
                    <Form.Select
                        size="sm"
                        style={{ width: 'auto' }}
                        value={pagination.pageSize}
                        onChange={(e) => table.setPageSize(Number(e.target.value))}
                    >
                        {[10, 20, 30, 50].map((size) => (
                            <option key={size} value={size}>
                                Show {size}
                            </option>
                        ))}
                    </Form.Select>

                    {/* Pagination Controls */}
                    <div className="btn-group" role="group">
                        <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            «
                        </Button>
                        <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            ‹
                        </Button>
                        <Button
                            size="sm"
                            variant="outline-secondary"
                            disabled
                            style={{ minWidth: '100px' }}
                        >
                            Page {pagination.pageIndex + 1} of {table.getPageCount()}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            ›
                        </Button>
                        <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            »
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
