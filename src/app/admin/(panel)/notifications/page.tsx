import { NotificationEngine } from "@/lib/services/notification-engine.service";
import { AdminNotificationsDashboard } from "@/components/admin/notifications/admin-notifications-dashboard";

export default async function AdminNotificationsPage() {
  const { notifications, total } = await NotificationEngine.list({ pageSize: 200 });
  return <AdminNotificationsDashboard initialNotifications={notifications} total={total} />;
}