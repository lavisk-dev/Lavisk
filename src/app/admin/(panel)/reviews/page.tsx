import { ReviewService } from "@/lib/services/review.service";
import { AdminReviewsManager } from "@/components/admin/reviews/admin-reviews-manager";

export default async function AdminReviewsPage() {
  const reviews = await ReviewService.listAll();
  return <AdminReviewsManager initialReviews={reviews} />;
}
