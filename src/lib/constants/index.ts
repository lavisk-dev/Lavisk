export const BRAND_NAME = "Lavisk";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const SITE_DESCRIPTION =
  "Thoughtfully wrapped gifts for the people who matter — delivered with a little extra love.";

export const NAV_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "Categories", href: "/categories" },
  { label: "Trending", href: "/shop?filter=trending" },
  { label: "Why Us", href: "/about#why" },
];

// Mobile drawer shows a wider surface than the design's 4-link hero
// nav — the drawer is where Journal, Wishlist etc. live so the pink
// hero stays uncluttered on desktop.
export const MOBILE_NAV_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "Categories", href: "/categories" },
  { label: "Trending", href: "/shop?filter=trending" },
  { label: "Journal", href: "/blog" },
  { label: "Why Us", href: "/about#why" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const FOOTER_LINKS = {
  shop: [
    { label: "Shop all", href: "/shop" },
    { label: "Occasions", href: "/categories" },
    { label: "Corporate gifting", href: "/contact" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Journal", href: "/blog" },
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "/about#faq" },
  ],
};

export const SOCIALS = [
  { label: "Instagram", handle: "Ig", href: "https://instagram.com" },
  { label: "Pinterest", handle: "Pn", href: "https://pinterest.com" },
  { label: "TikTok", handle: "Tk", href: "https://tiktok.com" },
];

export const HERO_SLIDES = [
  {
    word: "GIFTED",
    eyebrow: "Say it with a",
    subtitle: "Wrapped with a Little Extra Love",
    image: "/hero/gifted-closed.png",
    imageAlt: "A closed pink gift box tied with a satin bow",
  },
  {
    word: "UNWRAP",
    eyebrow: "This season's",
    subtitle: "Joy, Tied Up With a Bow",
    image: "/hero/gifted-open.png",
    imageAlt: "An open pink gift box with the lid off, filled with cream paper shred",
  },
  {
    word: "CHERISH",
    eyebrow: "For the ones who",
    subtitle: "Make Every Day Feel Like a Birthday",
    image: "/hero/gifted-blossom.png",
    imageAlt: "A pink gift box overflowing with pale-pink roses, carnations and baby's breath",
  },
];

export const WHY_US_FEATURES = [
  {
    icon: "truck",
    title: "Free Shipping",
    desc: "On every order over $50, always.",
    bg: "linear-gradient(150deg,#FFE9EF,#FFB6C9)",
  },
  {
    icon: "gift",
    title: "Gift Wrapping",
    desc: "Hand-tied, complimentary, gorgeous.",
    bg: "linear-gradient(150deg,#FFEBDF,#FFD3B0)",
  },
  {
    icon: "lock",
    title: "Secure Payments",
    desc: "Encrypted checkout you can trust.",
    bg: "linear-gradient(150deg,#F3ECFF,#E7D6FF)",
  },
  {
    icon: "sparkles",
    title: "Premium Quality",
    desc: "Curated, never mass-produced.",
    bg: "linear-gradient(150deg,#FFF0F3,#FF8FA3)",
  },
];

export const FREE_SHIPPING_THRESHOLD = 499;
export const FLAT_SHIPPING_FEE = 99;

export const CURRENCY = {
  code: "INR",
  symbol: "₹",
  toSmallestUnit: (amount: number) => Math.round(amount * 100),
};
