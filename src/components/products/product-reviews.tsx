"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Review } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatDate, cn } from "@/lib/utils";

const formSchema = z.object({
  customerName: z.string().min(2, "Please enter your name"),
  comment: z.string().min(3, "Please write a short review").max(500),
});
type FormValues = z.infer<typeof formSchema>;

export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  useEffect(() => {
    fetch(`/api/reviews?productId=${productId}`)
      .then((r) => r.json())
      .then((res) => res.success && setReviews(res.data))
      .catch(() => {});
  }, [productId]);

  const onSubmit = async (values: FormValues) => {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, rating, ...values }),
    });
    if (res.ok) {
      setSubmitted(true);
      reset();
      setRating(5);
    }
  };

  return (
    <section className="mt-16">
      <h2 className="font-display text-3xl font-bold tracking-[-0.02em]">Loved by gifters</h2>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {reviews.length === 0 ? (
            <p className="rounded-3xl bg-white px-6 py-10 text-center text-muted shadow-soft">
              Be the first to review this gift.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-3xl bg-white p-6 shadow-soft">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">{review.customerName}</span>
                    <span className="text-xs text-muted">{formatDate(review.createdAt)}</span>
                  </div>
                  <div className="mt-1.5 flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-4 w-4 text-brand-light",
                          i < review.rating ? "fill-brand-light" : "opacity-30"
                        )}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-soft">
          {submitted ? (
            <div className="flex h-full flex-col items-center justify-center py-8 text-center">
              <div className="mb-2 text-3xl">🎀</div>
              <p className="font-display text-lg font-bold">Thank you!</p>
              <p className="mt-1 text-sm text-muted">
                Your review is in — it&apos;ll appear once approved.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <h3 className="font-display text-lg font-bold">Write a review</h3>

              <div className="flex flex-col gap-1.5">
                <Label>Rating</Label>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRating(i + 1)}
                      aria-label={`${i + 1} star`}
                    >
                      <Star
                        className={cn(
                          "h-6 w-6 text-brand-light transition",
                          i < rating ? "fill-brand-light" : "opacity-30"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="customerName">Your name</Label>
                <Input id="customerName" {...register("customerName")} placeholder="Jamie" />
                {errors.customerName && (
                  <span className="text-xs text-destructive">{errors.customerName.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="comment">Review</Label>
                <Textarea
                  id="comment"
                  {...register("comment")}
                  placeholder="What did you love about it?"
                />
                {errors.comment && (
                  <span className="text-xs text-destructive">{errors.comment.message}</span>
                )}
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending…" : "Submit review"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
