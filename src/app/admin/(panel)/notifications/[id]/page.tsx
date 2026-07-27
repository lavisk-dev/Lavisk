import { notFound } from "next/navigation";
import { NotificationEngine } from "@/lib/services/notification-engine.service";
import { AdminNotificationDetail } from "@/components/admin/notifications/admin-notification-detail";

export default async function AdminNotificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const notification = await NotificationEngine.getById(id);
  if (!notification) notFound();

  return <AdminNotificationDetail notification={notification} />;
}