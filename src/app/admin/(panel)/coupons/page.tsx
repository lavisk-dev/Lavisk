import { CouponService } from "@/lib/services/coupon.service";
import { AdminCouponsManager } from "@/components/admin/coupons/admin-coupons-manager";

export default async function AdminCouponsPage() {
  const coupons = await CouponService.list();
  return <AdminCouponsManager initialCoupons={coupons} />;
}
