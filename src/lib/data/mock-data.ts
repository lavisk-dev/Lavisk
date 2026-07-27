import type { Category, Product, Review, Banner, Coupon, Order, Customer, Collection } from "@/lib/types";

// ------------------------------------------------------------------
// Content below mirrors the values baked into the source design file
// (Lavisk Home.dc.html) so the storefront looks identical out of the
// box. Swap this module out for live Supabase data once configured —
// the service layer already reads from Supabase first and falls back
// to this file only when no connection is available.
// ------------------------------------------------------------------

export const mockCollections: Collection[] = [
  {
    id: "col_valentine", name: "Valentine's Day", slug: "valentines-day",
    description: "Say it with roses, chocolates, and a whole lot of heart.",
    bannerImage: null, thumbnailImage: null, isActive: true, sortOrder: 0,
    seoTitle: "Valentine's Day Gifts", seoDescription: "Shop romantic Valentine's Day gifts.",
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "col_corporate", name: "Corporate Gifting", slug: "corporate-gifting",
    description: "Premium gifts that say thank you, congratulations, or welcome.",
    bannerImage: null, thumbnailImage: null, isActive: true, sortOrder: 1,
    seoTitle: "Corporate Gifts", seoDescription: "Premium corporate gifting solutions.",
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "col_luxury", name: "Luxury Collection", slug: "luxury",
    description: "The finest curated gifts for life's most extraordinary moments.",
    bannerImage: null, thumbnailImage: null, isActive: true, sortOrder: 2,
    seoTitle: "Luxury Gift Collection", seoDescription: "Explore our luxury curated gift collection.",
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "col_new_arrivals", name: "New Arrivals", slug: "new-arrivals",
    description: "Freshly curated — the latest additions to the Lavisk family.",
    bannerImage: null, thumbnailImage: null, isActive: true, sortOrder: 3,
    seoTitle: "New Arrivals", seoDescription: "Shop our newest gift arrivals.",
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export const mockCategories: Category[] = [
  { id: "cat_birthday", name: "Birthday", slug: "birthday", count: 64, gradientFrom: "#FFE9EF", gradientTo: "#FFDCE6", blobColor: "#FFB6C9", imageUrl: "/images/cake.png" },
  { id: "cat_anniversary", name: "Anniversary", slug: "anniversary", count: 41, gradientFrom: "#FFEBDF", gradientTo: "#FFD3B0", blobColor: "#FFD3B0" },
  { id: "cat_wedding", name: "Wedding", slug: "wedding", count: 38, gradientFrom: "#F3ECFF", gradientTo: "#E7D6FF", blobColor: "#E7D6FF" },
  { id: "cat_baby_shower", name: "Baby Shower", slug: "baby-shower", count: 29, gradientFrom: "#FFF0F3", gradientTo: "#FFE0E9", blobColor: "#FF8FA3" },
  { id: "cat_just_because", name: "Just Because", slug: "just-because", count: 52, gradientFrom: "#FFE9EF", gradientTo: "#FFCFDD", blobColor: "#FF8FA3" },
  { id: "cat_flowers", name: "Flowers", slug: "flowers", count: 47, gradientFrom: "#FFEDE4", gradientTo: "#FFDAC4", blobColor: "#FFD3B0" },
  { id: "cat_chocolate", name: "Chocolate", slug: "chocolate", count: 33, gradientFrom: "#FBEFE9", gradientTo: "#F6DFD3", blobColor: "#FFB6C9" },
  { id: "cat_personalized", name: "Personalized", slug: "personalized", count: 58, gradientFrom: "#F6ECFF", gradientTo: "#E7D6FF", blobColor: "#E7D6FF" },
];

export const mockProducts: Product[] = [
  {
    id: "p1", slug: "the-bloom-box", name: "The Bloom Box",
    description: "Fresh peonies + hand-tied ribbon",
    story: "Seasonal peonies and garden roses, arranged the morning they ship and finished with a silk ribbon by hand.",
    price: 649, compareAtPrice: null, tag: "Bestseller", categorySlug: "flowers",
    gradientFrom: "#FFB6C9", gradientTo: "#FF8FA3", images: [{ url: "/hero/gifted-open.png", publicId: "hero/gifted-open", alt: "Open pink gift box with ribbon" }], rating: 4.9, reviewCount: 214,
    stock: 42, isActive: true, isFeatured: true, isTrending: false, createdAt: "2026-01-04T00:00:00.000Z",
  },
  {
    id: "p2", slug: "sweet-nothings", name: "Sweet Nothings",
    description: "Artisan chocolate collection",
    story: "Twelve single-origin truffles from a small-batch chocolatier, nestled in a keepsake blush box.",
    price: 499, compareAtPrice: null, tag: "New", categorySlug: "chocolate",
    gradientFrom: "#FFD3B0", gradientTo: "#FFB6C9", images: [{ url: "/hero/gifted-closed.png", publicId: "hero/gifted-closed", alt: "Closed pink gift box with satin bow" }], rating: 4.8, reviewCount: 176,
    stock: 65, isActive: true, isFeatured: true, isTrending: true, createdAt: "2026-02-11T00:00:00.000Z",
  },
  {
    id: "p3", slug: "cuddle-co-bear", name: "Cuddle Co. Bear",
    description: "Plush teddy holding a rose",
    story: "Impossibly soft, ethically made, and holding a velvet rose that never wilts. A hug that stays.",
    price: 399, compareAtPrice: 449, tag: "Loved", categorySlug: "just-because",
    gradientFrom: "#F6DFD3", gradientTo: "#FFD3B0", images: [{ url: "/images/cake.png", publicId: "images/cake", alt: "Birthday cake on pink stand" }], rating: 5.0, reviewCount: 312,
    stock: 88, isActive: true, isFeatured: true, isTrending: false, createdAt: "2025-11-20T00:00:00.000Z",
  },
  {
    id: "p4", slug: "the-spa-ritual", name: "The Spa Ritual",
    description: "Candle, bath soak & silk mask",
    story: "A slow-evening in a box: soy candle, mineral bath soak and a pure silk eye mask for the deepest reset.",
    price: 749, compareAtPrice: null, tag: "Luxe", categorySlug: "just-because",
    gradientFrom: "#E7D6FF", gradientTo: "#FFB6C9", images: [{ url: "/hero/gifted-blossom.png", publicId: "hero/gifted-blossom", alt: "Gift box with pink roses" }], rating: 4.9, reviewCount: 98,
    stock: 24, isActive: true, isFeatured: true, isTrending: false, createdAt: "2026-03-02T00:00:00.000Z",
  },
  {
    id: "p5", slug: "golden-hour", name: "Golden Hour",
    description: "Champagne & two coupes",
    story: "A chilled bottle of brut and two hand-blown coupes — for the moments that deserve a proper toast.",
    price: 899, compareAtPrice: null, tag: "Celebrate", categorySlug: "anniversary",
    gradientFrom: "#FFD3B0", gradientTo: "#FF8FA3", images: [{ url: "/hero/gifted-closed.png", publicId: "hero/gifted-closed", alt: "Closed pink gift box with satin bow" }], rating: 4.7, reviewCount: 141,
    stock: 30, isActive: true, isFeatured: true, isTrending: true, createdAt: "2026-01-28T00:00:00.000Z",
  },
  {
    id: "p6", slug: "little-letters", name: "Little Letters",
    description: "Personalized name necklace",
    story: "A dainty 18k-gold-plated name necklace, engraved to order and delivered in a velvet pouch.",
    price: 599, compareAtPrice: null, tag: "Personalized", categorySlug: "personalized",
    gradientFrom: "#FFCFDD", gradientTo: "#E7D6FF", images: [{ url: "/images/cake.png", publicId: "images/cake", alt: "Birthday cake on pink stand" }], rating: 4.9, reviewCount: 203,
    stock: 51, isActive: true, isFeatured: true, isTrending: false, createdAt: "2026-02-19T00:00:00.000Z",
  },
  {
    id: "p7", slug: "petal-post-card", name: "Petal Post Card",
    description: "Pressed-flower greeting card",
    story: "A hand-pressed botanical card with a keepsake envelope — the smallest gift that still says everything.",
    price: 249, compareAtPrice: null, tag: "Trending", categorySlug: "flowers",
    gradientFrom: "#FFB6C9", gradientTo: "#FFD3B0", images: [{ url: "/hero/gifted-open.png", publicId: "hero/gifted-open", alt: "Open pink gift box with ribbon" }], rating: 4.9, reviewCount: 88,
    stock: 120, isActive: true, isFeatured: false, isTrending: true, createdAt: "2026-04-01T00:00:00.000Z",
  },
  {
    id: "p8", slug: "ribbon-roses", name: "Ribbon Roses",
    description: "Everlasting silk rose bundle",
    story: "A hand-tied bundle of silk roses that keep their bloom well past the last petal of a real one.",
    price: 349, compareAtPrice: null, tag: "Trending", categorySlug: "flowers",
    gradientFrom: "#FF8FA3", gradientTo: "#FFB6C9", images: [{ url: "/hero/gifted-blossom.png", publicId: "hero/gifted-blossom", alt: "Gift box with pink roses" }], rating: 4.8, reviewCount: 64,
    stock: 70, isActive: true, isFeatured: false, isTrending: true, createdAt: "2026-03-18T00:00:00.000Z",
  },
  {
    id: "p9", slug: "cocoa-cloud", name: "Cocoa Cloud",
    description: "Whipped hot cocoa gift jar",
    story: "Small-batch whipped cocoa mix in a reusable glass jar, topped with a hand-tied gingham lid.",
    price: 299, compareAtPrice: null, tag: "Trending", categorySlug: "chocolate",
    gradientFrom: "#F6DFD3", gradientTo: "#FFB6C9", images: [{ url: "/images/cake.png", publicId: "images/cake", alt: "Birthday cake on pink stand" }], rating: 5.0, reviewCount: 51,
    stock: 95, isActive: true, isFeatured: false, isTrending: true, createdAt: "2026-04-10T00:00:00.000Z",
  },
  {
    id: "p10", slug: "lilac-dreams", name: "Lilac Dreams",
    description: "Dried lilac & eucalyptus bundle",
    story: "A dried lilac and eucalyptus bundle that keeps the scent and the color for months on end.",
    price: 449, compareAtPrice: null, tag: "Trending", categorySlug: "flowers",
    gradientFrom: "#E7D6FF", gradientTo: "#FFCFDD", images: [{ url: "/hero/gifted-open.png", publicId: "hero/gifted-open", alt: "Open pink gift box with ribbon" }], rating: 4.9, reviewCount: 47,
    stock: 40, isActive: true, isFeatured: false, isTrending: true, createdAt: "2026-04-14T00:00:00.000Z",
  },
  {
    id: "p11", slug: "sunset-bundle", name: "Sunset Bundle",
    description: "Peach & rose stem bouquet",
    story: "Peach ranunculus and blush roses gathered into an easy, sun-warmed bouquet.",
    price: 549, compareAtPrice: null, tag: "Trending", categorySlug: "flowers",
    gradientFrom: "#FFD3B0", gradientTo: "#FF8FA3", images: [{ url: "/hero/gifted-closed.png", publicId: "hero/gifted-closed", alt: "Closed pink gift box with satin bow" }], rating: 4.7, reviewCount: 39,
    stock: 33, isActive: true, isFeatured: false, isTrending: true, createdAt: "2026-04-15T00:00:00.000Z",
  },
];

export const mockReviews: Review[] = [
  { id: "r1", productId: "p1", customerName: "Anjali R.", rating: 5, comment: "Arrived so fresh and the ribbon detail is gorgeous.", createdAt: "2026-05-01T00:00:00.000Z", isApproved: true },
  { id: "r2", productId: "p1", customerName: "Marcus T.", rating: 5, comment: "My wife's new favorite florist, hands down.", createdAt: "2026-05-10T00:00:00.000Z", isApproved: true },
  { id: "r3", productId: "p3", customerName: "Priya K.", rating: 5, comment: "Softest bear I've ever felt, worth every penny.", createdAt: "2026-04-22T00:00:00.000Z", isApproved: true },
];

export const mockBanners: Banner[] = [
  { id: "b1", title: "Say it with a GIFTED", subtitle: "Wrapped with a Little Extra Love", isActive: true, sortOrder: 0, ctaLabel: "Shop the Collection", ctaHref: "/shop" },
  { id: "b2", title: "This season's UNWRAP", subtitle: "Joy, Tied Up With a Bow", isActive: true, sortOrder: 1, ctaLabel: "Shop the Collection", ctaHref: "/shop" },
  { id: "b3", title: "For the ones who CHERISH", subtitle: "Make Every Day Feel Like a Birthday", isActive: true, sortOrder: 2, ctaLabel: "Shop the Collection", ctaHref: "/shop" },
];

export const mockCoupons: Coupon[] = [
  { id: "c1", code: "WELCOME10", type: "percentage", value: 10, minOrderValue: 0, isActive: true, usedCount: 128, usageLimit: 1000 },
  { id: "c2", code: "FREESHIP", type: "flat", value: 99, minOrderValue: 299, isActive: true, usedCount: 54, usageLimit: 500 },
];

export const mockOrders: Order[] = [
  {
    id: "o1", orderNumber: "GFT-A1B2C3-9F3K", customerName: "Sara Malhotra", customerEmail: "sara@example.com", customerPhone: "+91 98765 43210",
    shippingAddress: { fullName: "Sara Malhotra", phone: "+91 98765 43210", line1: "12 Lotus Lane", city: "Chennai", state: "Tamil Nadu", postalCode: "600001", country: "India" },
    items: [{ productId: "p1", name: "The Bloom Box", price: 649, quantity: 1 }],
    subtotal: 649, discount: 0, tax: 0, shipping: 0, total: 649, status: "delivered", paymentProvider: "razorpay",
    paymentOrderId: "order_mock1", paymentId: "pay_mock1", createdAt: "2026-06-02T10:20:00.000Z", updatedAt: "2026-06-05T09:00:00.000Z",
  },
  {
    id: "o2", orderNumber: "GFT-D4E5F6-2M9L", customerName: "Rohan Iyer", customerEmail: "rohan@example.com", customerPhone: "+91 91234 56780",
    shippingAddress: { fullName: "Rohan Iyer", phone: "+91 91234 56780", line1: "44 Palm Grove", city: "Madurai", state: "Tamil Nadu", postalCode: "625001", country: "India" },
    items: [{ productId: "p5", name: "Golden Hour", price: 899, quantity: 1 }, { productId: "p9", name: "Cocoa Cloud", price: 299, quantity: 2 }],
    subtotal: 1497, discount: 149.7, tax: 0, shipping: 0, total: 1347.3, status: "processing", paymentProvider: "razorpay",
    paymentOrderId: "order_mock2", paymentId: "pay_mock2", couponCode: "WELCOME10", createdAt: "2026-07-01T14:12:00.000Z", updatedAt: "2026-07-01T14:12:00.000Z",
  },
];

export const mockCustomers: Customer[] = [
  { id: "cu1", name: "Sara Malhotra", email: "sara@example.com", phone: "+91 98765 43210", totalOrders: 3, totalSpent: 2247, createdAt: "2026-01-14T00:00:00.000Z" },
  { id: "cu2", name: "Rohan Iyer", email: "rohan@example.com", phone: "+91 91234 56780", totalOrders: 1, totalSpent: 1347.3, createdAt: "2026-07-01T00:00:00.000Z" },
];