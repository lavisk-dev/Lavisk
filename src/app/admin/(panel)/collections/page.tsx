import { CollectionService } from "@/lib/services/collection.service";
import { AdminCollectionsManager } from "@/components/admin/collections/admin-collections-manager";

export default async function AdminCollectionsPage() {
  const collections = await CollectionService.list();
  return <AdminCollectionsManager initialCollections={collections} />;
}