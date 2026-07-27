import { describe, it, expect } from "vitest";
import {
  checkoutSchema,
  contactSchema,
  reviewSchema,
  couponValidateSchema,
  productSchema,
  addressSchema,
} from "@/lib/utils/validation";

describe("addressSchema", () => {
  it("validates a correct address", () => {
    const result = addressSchema.safeParse({
      fullName: "Jamie Rivera",
      phone: "+91 98765 43210",
      line1: "12 Lotus Lane",
      city: "Chennai",
      state: "Tamil Nadu",
      postalCode: "600001",
      country: "India",
    });
    expect(result.success).toBe(true);
  });

  it("rejects address with short name", () => {
    const result = addressSchema.safeParse({
      fullName: "J",
      phone: "+91 98765 43210",
      line1: "12 Lotus Lane",
      city: "Chennai",
      state: "Tamil Nadu",
      postalCode: "600001",
      country: "India",
    });
    expect(result.success).toBe(false);
  });
});

describe("contactSchema", () => {
  it("validates a correct contact submission", () => {
    const result = contactSchema.safeParse({
      name: "Jamie",
      email: "jamie@example.com",
      subject: "Question about gift wrapping",
      message: "Do you offer gift wrapping?",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = contactSchema.safeParse({
      name: "Jamie",
      email: "not-an-email",
      subject: "Question",
      message: "Hello",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short message", () => {
    const result = contactSchema.safeParse({
      name: "Jamie",
      email: "jamie@example.com",
      subject: "Question",
      message: "Hi",
    });
    expect(result.success).toBe(false);
  });
});

describe("reviewSchema", () => {
  it("validates a correct review", () => {
    const result = reviewSchema.safeParse({
      productId: "p1",
      customerName: "Jamie",
      rating: 5,
      comment: "Amazing product!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects rating outside 1-5", () => {
    const result = reviewSchema.safeParse({
      productId: "p1",
      customerName: "Jamie",
      rating: 6,
      comment: "Good",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty comment", () => {
    const result = reviewSchema.safeParse({
      productId: "p1",
      customerName: "Jamie",
      rating: 3,
      comment: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("couponValidateSchema", () => {
  it("validates a correct request", () => {
    const result = couponValidateSchema.safeParse({ code: "WELCOME10", subtotal: 500 });
    expect(result.success).toBe(true);
  });

  it("rejects negative subtotal", () => {
    const result = couponValidateSchema.safeParse({ code: "WELCOME10", subtotal: -1 });
    expect(result.success).toBe(false);
  });
});

describe("checkoutSchema", () => {
  it("validates a complete checkout", () => {
    const result = checkoutSchema.safeParse({
      customerName: "Jamie Rivera",
      customerEmail: "jamie@example.com",
      customerPhone: "+91 98765 43210",
      shippingAddress: {
        fullName: "Jamie Rivera",
        phone: "+91 98765 43210",
        line1: "12 Lotus Lane",
        city: "Chennai",
        state: "Tamil Nadu",
        postalCode: "600001",
        country: "India",
      },
      items: [{ productId: "p1", quantity: 2 }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty cart", () => {
    const result = checkoutSchema.safeParse({
      customerName: "Jamie Rivera",
      customerEmail: "jamie@example.com",
      customerPhone: "+91 98765 43210",
      shippingAddress: {
        fullName: "Jamie Rivera",
        phone: "+91 98765 43210",
        line1: "12 Lotus Lane",
        city: "Chennai",
        state: "Tamil Nadu",
        postalCode: "600001",
        country: "India",
      },
      items: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("productSchema", () => {
  it("validates a minimal product", () => {
    const result = productSchema.safeParse({
      name: "Test Product",
      description: "A test product",
      price: 499,
      categorySlug: "flowers",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stock).toBe(0);
      expect(result.data.isActive).toBe(true);
    }
  });
});
