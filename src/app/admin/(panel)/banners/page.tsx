import { BannerService } from "@/lib/services/banner.service";
import { AdminBannersManager } from "@/components/admin/banners/admin-banners-manager";

export default async function AdminBannersPage() {
  const banners = await BannerService.listAll();
  return <AdminBannersManager initialBanners={banners} />;
}
