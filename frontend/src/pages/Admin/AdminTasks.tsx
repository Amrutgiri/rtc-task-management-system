import AdminLayout from '../../components/Admin/AdminLayout';
import AdminTasksContent from './AdminTasksContent';

export default function AdminTasks() {
    return (
        <AdminLayout title="Task Management">
            <AdminTasksContent />
        </AdminLayout>
    );
}
