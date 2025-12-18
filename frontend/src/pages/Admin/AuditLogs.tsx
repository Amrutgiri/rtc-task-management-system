import AdminLayout from '../../components/Admin/AdminLayout';
import AuditLogsContent from './AuditLogsContent';

export default function AuditLogs() {
    return (
        <AdminLayout title="Audit Trail">
            <AuditLogsContent />
        </AdminLayout>
    );
}
