import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { Container, Row, Col, Card, Button, Badge, Spinner, Pagination } from 'react-bootstrap';
import AdminLayout from '../../components/Admin/AdminLayout';
import '../../styles/notifications.css';

export default function NotificationsAdmin() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [unreadCount, setUnreadCount] = useState(0);
    const [filter, setFilter] = useState('all'); // 'all', 'read', 'unread'
    const limit = 15;

    // Fetch notifications
    const fetchNotifications = async (pageNum = 1, readFilter = 'all') => {
        try {
            setLoading(true);
            const params: any = { page: pageNum, limit };

            if (readFilter === 'read') {
                params.read = 'true';
            } else if (readFilter === 'unread') {
                params.read = 'false';
            }

            const res = await api.get('/notifications', { params });
            setNotifications(res.data.notifications);
            setTotalPages(res.data.pages);
            setPage(res.data.page);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            Swal.fire('Error', 'Failed to fetch notifications', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Fetch unread count
    const fetchUnreadCount = async () => {
        try {
            const res = await api.get('/notifications/count/unread');
            setUnreadCount(res.data.unreadCount);
        } catch (err) {
            console.error('Error fetching unread count:', err);
        }
    };

    useEffect(() => {
        fetchNotifications(1, filter);
        fetchUnreadCount();
    }, [filter]);

    // Mark single notification as read
    const markAsRead = async (notificationId: string) => {
        try {
            await api.patch(`/notifications/${notificationId}/read`);
            fetchNotifications(page, filter);
            fetchUnreadCount();
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/mark-all/read');
            Swal.fire('Success', 'All notifications marked as read', 'success');
            fetchNotifications(1, 'all');
            fetchUnreadCount();
        } catch (err) {
            console.error('Error marking all as read:', err);
            Swal.fire('Error', 'Failed to mark all as read', 'error');
        }
    };

    // Delete notification
    const deleteNotification = async (notificationId: string) => {
        try {
            await api.delete(`/notifications/${notificationId}`);
            fetchNotifications(page, filter);
            fetchUnreadCount();
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    };

    // Get icon class based on notification type
    const getIconClass = (notif: any) => {
        return notif.icon || 'bi-bell';
    };

    // Get badge color based on notification read status
    const getBadgeColor = (isRead: boolean) => {
        return isRead ? 'secondary' : 'primary';
    };

    // Format timestamp
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString();
    };

    return (
        <AdminLayout title="Notifications Management">
            <Container fluid className="py-4">
                <Row className="mb-4">
                    <Col md={6}>
                        {/* Title already in layout, but we can add stats here if needed */}
                        <div className="btn-group" role="group">
                            <Button
                                variant={filter === 'all' ? 'primary' : 'outline-primary'}
                                size="sm"
                                onClick={() => setFilter('all')}
                            >
                                All
                            </Button>
                            <Button
                                variant={filter === 'unread' ? 'primary' : 'outline-primary'}
                                size="sm"
                                onClick={() => setFilter('unread')}
                            >
                                Unread {unreadCount > 0 && `(${unreadCount})`}
                            </Button>
                            <Button
                                variant={filter === 'read' ? 'primary' : 'outline-primary'}
                                size="sm"
                                onClick={() => setFilter('read')}
                            >
                                Read
                            </Button>
                        </div>
                    </Col>
                    <Col md={6} className="text-end">
                        {unreadCount > 0 && (
                            <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={markAllAsRead}
                            >
                                <i className="bi bi-check2-all me-2"></i>
                                Mark All as Read
                            </Button>
                        )}
                    </Col>
                </Row>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-5">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                    </div>
                )}

                {/* Notifications List */}
                {!loading && notifications.length === 0 && (
                    <Card className="text-center py-5 border-0 bg-light">
                        <Card.Body>
                            <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                            <p className="text-muted mt-3 mb-0">
                                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                            </p>
                        </Card.Body>
                    </Card>
                )}

                {/* Notifications Grid */}
                {!loading && notifications.length > 0 && (
                    <>
                        <div className="notifications-list">
                            {notifications.map((notif) => (
                                <Card
                                    key={notif._id}
                                    className={`notification-card mb-3 border-0 shadow-sm ${!notif.read ? 'border-start border-4 border-primary' : ''}`}
                                >
                                    <Card.Body className="d-flex align-items-start gap-3">
                                        {/* Icon */}
                                        <div className="notification-icon bg-light rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                                            <i className={`bi ${getIconClass(notif)} text-primary`}></i>
                                        </div>

                                        {/* Content */}
                                        <div className="notification-content flex-grow-1">
                                            <div className="d-flex justify-content-between align-items-start mb-1">
                                                <div>
                                                    <h6 className="mb-1 fw-bold text-dark">{notif.title}</h6>
                                                    {notif.body && (
                                                        <p className="mb-1 text-muted small">{notif.body}</p>
                                                    )}
                                                </div>
                                                <Badge
                                                    bg={getBadgeColor(notif.read)}
                                                    className="ms-2 flex-shrink-0"
                                                >
                                                    {notif.read ? 'Read' : 'Unread'}
                                                </Badge>
                                            </div>

                                            {/* Meta information */}
                                            <div className="notification-meta small text-muted mb-1">
                                                {notif.senderId && (
                                                    <span className="me-3 fw-medium text-dark">
                                                        <img
                                                            src={notif.senderId.avatar || "https://ui-avatars.com/api/?name=" + notif.senderId.name}
                                                            alt={notif.senderId.name}
                                                            className="rounded-circle me-1"
                                                            style={{ width: 16, height: 16, objectFit: 'cover' }}
                                                        />
                                                        {notif.senderId.name}
                                                    </span>
                                                )}
                                                {notif.meta && notif.meta.taskId && (
                                                    <span className="me-3">
                                                        <i className="bi bi-check2-square me-1"></i>
                                                        Task ID: {notif.meta.taskId.title ? notif.meta.taskId.title : notif.meta.taskId}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Timestamp */}
                                            <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                                                {formatTime(notif.createdAt)}
                                            </small>
                                        </div>

                                        {/* Actions */}
                                        <div className="notification-actions d-flex flex-column gap-1">
                                            {!notif.read && (
                                                <Button
                                                    variant="light"
                                                    size="sm"
                                                    title="Mark as read"
                                                    onClick={() => markAsRead(notif._id)}
                                                    className="border-0 text-success"
                                                >
                                                    <i className="bi bi-check-lg"></i>
                                                </Button>
                                            )}
                                            <Button
                                                variant="light"
                                                size="sm"
                                                title="Delete"
                                                onClick={() => deleteNotification(notif._id)}
                                                className="border-0 text-danger"
                                            >
                                                <i className="bi bi-trash"></i>
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="d-flex justify-content-center mt-4">
                                <Pagination>
                                    <Pagination.First
                                        onClick={() => fetchNotifications(1, filter)}
                                        disabled={page === 1}
                                    />
                                    <Pagination.Prev
                                        onClick={() => fetchNotifications(page - 1, filter)}
                                        disabled={page === 1}
                                    />

                                    {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                                        const pageNum = Math.max(1, page - 2) + idx;
                                        if (pageNum > totalPages) return null;
                                        return (
                                            <Pagination.Item
                                                key={pageNum}
                                                active={pageNum === page}
                                                onClick={() => fetchNotifications(pageNum, filter)}
                                            >
                                                {pageNum}
                                            </Pagination.Item>
                                        );
                                    })}

                                    <Pagination.Next
                                        onClick={() => fetchNotifications(page + 1, filter)}
                                        disabled={page === totalPages}
                                    />
                                    <Pagination.Last
                                        onClick={() => fetchNotifications(totalPages, filter)}
                                        disabled={page === totalPages}
                                    />
                                </Pagination>
                            </div>
                        )}
                    </>
                )}
            </Container>
        </AdminLayout>
    );
}
