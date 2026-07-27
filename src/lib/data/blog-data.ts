import type { BlogPost } from "@/lib/types";

// Editorial content that doubles as SEO/AEO/GEO surface area — each
// post ships with a summary, keywords, and (where relevant) FAQ entries
// that we lift into JSON-LD on the post page.
export const mockBlogPosts: BlogPost[] = [
  {
    id: "blog_gift_etiquette",
    slug: "modern-gift-etiquette",
    title: "The new rules of modern gift-giving",
    excerpt:
      "A short field guide to giving well in 2026 — from thoughtful timing to what to skip on a first-visit gift.",
    content: `
Gifts are quiet language. The rules for speaking that language well have shifted, and most of them boil down to one idea: **give with intention, not obligation.**

## Give small, give often
The best-received gifts in 2026 are lower-cost, higher-frequency, and personal. A hand-tied flower bundle mid-week beats a large hamper on a birthday — because it wasn't expected. Unexpected is the whole point.

## Skip the generic
Anything the recipient could reasonably buy for themselves at 11pm on a phone isn't a gift, it's a delivery. Look for made-to-order pieces, single-origin edibles, or anything with a story you can tell in a sentence.

## Wrap like it matters
A hand-tied ribbon takes forty seconds and changes the entire encounter with the object. Never send a gift in the shipping box it arrived in.

## Include a note
Two sentences, handwritten if possible. Say what the person means to you and why the gift reminded you of them. If you can't write those two sentences, reconsider the gift.

## First visits: keep it edible or floral
When you don't know a host well, choose something they will use up — a small box of chocolate, a fresh bouquet, a jar of honey. It signals warmth without asking them to display anything.

## The five-second rule
Before you send: imagine the recipient opening it in five seconds. Do their eyes go bright? If not, keep looking.
    `.trim(),
    authorName: "Anjali Ravindran",
    authorRole: "Head of Gifting",
    category: "Etiquette",
    readingMinutes: 4,
    coverColorFrom: "#FFB6C9",
    coverColorTo: "#FF8FA3",
    coverEmoji: "🎀",
    isPublished: true,
    publishedAt: "2026-04-12T09:00:00.000Z",
    updatedAt: "2026-05-02T09:00:00.000Z",
    keywords: ["gift etiquette", "how to give a gift", "gifting rules", "thoughtful gifts", "gift ideas 2026"],
    faq: [
      {
        question: "What is a good rule of thumb for choosing a gift?",
        answer:
          "Give something the recipient wouldn't easily buy for themselves, wrap it thoughtfully, and include a two-sentence handwritten note explaining why the gift reminded you of them.",
      },
      {
        question: "What should I bring on a first visit to someone's home?",
        answer:
          "Choose something the host will use up — a small box of chocolate, a fresh flower bundle, or a jar of local honey. Consumable and floral gifts signal warmth without obligating the host to display them.",
      },
      {
        question: "How much should I spend on a gift?",
        answer:
          "Frequency and specificity beat price. A well-chosen $30 gift with a note lands better than a $150 generic one. Aim for something that shows you paid attention, not that you paid.",
      },
    ],
  },
  {
    id: "blog_bloom_care",
    slug: "how-to-make-fresh-flowers-last-longer",
    title: "How to make fresh flowers last two weeks",
    excerpt:
      "The florist's own routine — the water, the trim, the temperature — for stems that stay open twice as long.",
    content: `
Most fresh flowers give up after five days because they've been quietly dying since they were cut. A short daily routine can push a Bloom Box arrangement to twelve or fourteen days of open, unwilted color.

## Water: change it, don't top it up
Bacteria in stagnant water is the number-one killer of cut flowers. Empty the vase completely every second day, rinse it, and refill with fresh cool water. If you can, use filtered or bottled water — the chlorine in tap accelerates decay.

## Trim on the diagonal, underwater
Every stem needs a fresh 1-inch cut every second day, on a 45° angle, held under running water so no air bubble enters the stem. Air locks are why the head droops overnight.

## Cool room, no direct sun, no fruit bowl
Flowers last longest at 18–20°C. Direct sun cooks the petals and ripening fruit (bananas especially) releases ethylene gas, which will drop a bouquet in a day. Keep them away from both.

## Remove anything below the water line
Any leaf touching the water rots and becomes bacterial food. Strip them off — the arrangement looks cleaner too.

## Roses: the paper trick
If a rose head droops, wrap the top half of the flower snugly in newspaper, plunge the stem into deep cool water for two hours, and it will usually stand again.

## Peonies: the shake test
Peonies open on their own time. If yours are still tight after three days, shake them gently — the movement often triggers them to bloom within a few hours.
    `.trim(),
    authorName: "Priya Menon",
    authorRole: "Lead Florist",
    category: "Care",
    readingMinutes: 5,
    coverColorFrom: "#FFCFDD",
    coverColorTo: "#FFB6C9",
    coverEmoji: "🌸",
    isPublished: true,
    publishedAt: "2026-04-28T09:00:00.000Z",
    updatedAt: "2026-04-28T09:00:00.000Z",
    keywords: [
      "how to keep flowers fresh",
      "make cut flowers last longer",
      "flower care tips",
      "fresh flower delivery",
      "peony care",
    ],
    faq: [
      {
        question: "How often should I change the water in a flower vase?",
        answer:
          "Empty the vase completely every second day, rinse it out, and refill with fresh cool water. Bacteria in stagnant water is the main reason cut flowers wilt early.",
      },
      {
        question: "Why do my flowers droop even when the water looks fine?",
        answer:
          "An air lock inside the stem is the usual cause. Give each stem a fresh 1-inch cut on a 45° angle while holding it under running water, then place it straight back into cool water.",
      },
      {
        question: "How long do fresh flowers last?",
        answer:
          "Most cut flowers last 5–7 days with no maintenance and 10–14 days with a full routine of daily stem trims, water changes every second day, cool room temperature, and no direct sun.",
      },
    ],
  },
  {
    id: "blog_chocolate_pairing",
    slug: "chocolate-and-wine-pairing-guide",
    title: "A very short guide to pairing chocolate with wine",
    excerpt:
      "One rule: match intensity, not sweetness. And three pairings that work every time.",
    content: `
Chocolate and wine are famously easy to get wrong. Most pairings fail because people match the sweetness — sweet chocolate with sweet wine — when they should be matching intensity.

## The one rule that matters
Wine should be at least as sweet as the food it's served with, and at least as intense. A delicate white next to a 70% single-origin will taste thin and sour. A rich vintage port next to a milk chocolate will steamroll it.

## Three pairings that always work

### Milk chocolate + tawny port
The caramel and butterscotch notes in a good tawny match the milk-cocoa profile perfectly. Serve slightly chilled.

### 70% dark chocolate + Zinfandel
Zinfandel is one of the few red wines with enough fruit and structure to stand next to real dark chocolate. Look for one with jammy raspberry notes.

### White chocolate + late-harvest Riesling
The high acidity of a late-harvest Riesling cuts the fat in white chocolate, and its stone-fruit sweetness echoes the vanilla. This is the pairing most people find surprising.

## What to avoid
- Dry sparkling wine with any chocolate — the acidity turns metallic
- Cabernet Sauvignon with milk chocolate — the tannins fight the milk fat
- Anything at fridge temperature — cold mutes both wine and cocoa
    `.trim(),
    authorName: "Marcus Fields",
    authorRole: "Guest Contributor",
    category: "Pairing",
    readingMinutes: 3,
    coverColorFrom: "#F6DFD3",
    coverColorTo: "#FFD3B0",
    coverEmoji: "🍫",
    isPublished: true,
    publishedAt: "2026-05-05T09:00:00.000Z",
    updatedAt: "2026-05-05T09:00:00.000Z",
    keywords: ["chocolate wine pairing", "dessert wine guide", "port and chocolate", "wine tasting"],
  },
  {
    id: "blog_last_minute",
    slug: "last-minute-gifts-that-dont-look-last-minute",
    title: "Last-minute gifts that don't look last-minute",
    excerpt:
      "Same-day delivery is a superpower — as long as you know what to order. Six choices that never look rushed.",
    content: `
The trick to a last-minute gift is choosing something that couldn't have arrived any other way. Nothing screams "I forgot" like a generic hamper. Nothing quietly says "I planned this" like fresh flowers.

## The six safe bets

**Fresh-cut flowers.** Nothing beats them for making a rushed gift feel intentional. Flowers are supposed to be picked and delivered on the same day.

**A single-origin chocolate box.** Small, elegant, universally loved. Skip anything with more than eight pieces — smaller boxes look more considered.

**A candle in a keepable vessel.** The vessel gives the gift a second life after the wax is gone, which reads as thoughtful even when it wasn't.

**A pressed-flower card.** For under $25 you can send something that looks handmade. Include a real handwritten note.

**A gift-wrapped bottle.** Champagne, olive oil, or hot sauce — anything the recipient will actually use and that comes in a bottle worth keeping.

**A named-charm necklace.** If you can order early enough for engraving, do — a personalized piece rarely reads as last-minute even when it is.

## What to skip
Skip anything that requires assembly, anything the recipient has to figure out (mystery boxes, subscription-first gifts), and anything that comes in obviously-branded packaging. If the box says "SAME DAY DELIVERY" on the outside, wrap it before you hand it over.
    `.trim(),
    authorName: "Karthikeyan V",
    authorRole: "Founder",
    category: "Ideas",
    readingMinutes: 3,
    coverColorFrom: "#E7D6FF",
    coverColorTo: "#FFCFDD",
    coverEmoji: "⏱️",
    isPublished: true,
    publishedAt: "2026-05-14T09:00:00.000Z",
    updatedAt: "2026-05-14T09:00:00.000Z",
    keywords: [
      "last minute gift ideas",
      "same day gift delivery",
      "quick gift ideas",
      "thoughtful last minute gifts",
    ],
    faq: [
      {
        question: "What is a good last-minute gift that doesn't look rushed?",
        answer:
          "Fresh-cut flowers delivered same-day, a small single-origin chocolate box, or a candle in a keepable vessel. All three are naturally same-day gifts, so they don't read as forgotten.",
      },
      {
        question: "Does Lavisk offer same-day delivery?",
        answer:
          "Yes, same-day delivery is available on selected products in most metro areas when ordered before the daily cut-off. Check the product page for delivery windows in your area.",
      },
    ],
  },
  {
    id: "blog_corporate",
    slug: "corporate-gifting-that-actually-lands",
    title: "Corporate gifting that actually lands",
    excerpt:
      "Why bulk hampers underperform, and the small-run alternative that works for teams of any size.",
    content: `
Most corporate gifting programs are underspending on curation and overspending on scale. The result: identical hampers that end up in the office kitchen or, worse, in the trash.

## The core problem
Bulk gifting treats every recipient as identical. Real gift impact comes from *feeling seen* — the recipient thinking "someone actually thought about me." A hamper of the same six items sent to 200 people cannot generate that feeling.

## The small-run alternative

### Pick 3–5 curated boxes at different price bands
Rather than one hamper for everyone, offer 3–5 small curated boxes at different price bands ($40, $80, $150). Recipients pick their own.

### Personalize the note, not the item
Custom-branded items rarely age well and often look cheap. Instead, spend the personalization budget on a printed note with the recipient's name and one specific detail — team, milestone, or shared moment.

### Ship as they're earned, not on a calendar
The best-performing corporate gifting programs decouple gifts from birthdays and Diwali. Send when someone finishes a hard project, closes a difficult account, or hits a work anniversary that isn't a round number. Timing that feels earned lands harder than timing that feels expected.

### Include a way to redeem
For distributed teams, a redeem-your-own link works better than a physical box shipped to a home you may not have permission to ship to. The recipient chooses the address, product, and delivery date.

## The math
A single well-chosen $60 gift beats a $30 hamper sent twice — recipient satisfaction more than doubles for the same net spend, based on internal Lavisk post-purchase surveys across our corporate clients.
    `.trim(),
    authorName: "Karthikeyan V",
    authorRole: "Founder",
    category: "Corporate",
    readingMinutes: 6,
    coverColorFrom: "#FFEBDF",
    coverColorTo: "#FFD3B0",
    coverEmoji: "💼",
    isPublished: true,
    publishedAt: "2026-05-22T09:00:00.000Z",
    updatedAt: "2026-06-01T09:00:00.000Z",
    keywords: [
      "corporate gifting",
      "employee gifts",
      "client gift ideas",
      "bulk gift ordering",
      "b2b gifting",
    ],
    faq: [
      {
        question: "Does Lavisk offer corporate gifting?",
        answer:
          "Yes. We work with teams on curated multi-tier boxes, personalized notes, and redeem-your-own gift links. Contact the corporate gifting desk via the contact page for a quote.",
      },
      {
        question: "What is the minimum order for corporate gifting?",
        answer:
          "Corporate programs typically start at 25 units. Below that, our regular retail catalog with bulk-note personalization is usually a better fit.",
      },
    ],
  },
  {
    id: "blog_note",
    slug: "how-to-write-a-gift-note",
    title: "How to write a gift note that doesn't sound generic",
    excerpt:
      "A four-line template that beats every 'thinking of you' card, plus three prompts to fill it with.",
    content: `
The card is often the part of the gift the recipient keeps longest — and the part that's the most often blanked. Here's a four-line template that never falls flat.

## The template

**Line 1 — Address them warmly by name.**
_"Dear Priya,"_ is warmer than "Hi Priya," and both are warmer than nothing.

**Line 2 — State what the gift is, in your own words.**
_"A very small box of the sweetest strawberries I've eaten this year."_

**Line 3 — Say why it made you think of them.**
_"I remembered you saying you needed a slow Sunday, and these felt like Sunday food."_

**Line 4 — Close with something that isn't 'love'.**
_"Cheering you on from over here — K."_ Sign-offs like "Cheering you on," "With so much love," or "See you soon" hit harder than defaults.

## Three prompts if you're stuck

1. **What did you last talk about?** Reference it. Specificity is love.
2. **What are they proud of right now?** Congratulate them on it, even in a small way.
3. **What is the smallest kind thing they've done for you recently?** Thank them for it explicitly.

## The one thing not to do
Don't apologize for the size of the gift or the length of the note. It signals that the gift is small — even if it isn't. Just send it.
    `.trim(),
    authorName: "Anjali Ravindran",
    authorRole: "Head of Gifting",
    category: "Etiquette",
    readingMinutes: 3,
    coverColorFrom: "#FFF0F3",
    coverColorTo: "#FFCFDD",
    coverEmoji: "✍️",
    isPublished: true,
    publishedAt: "2026-06-08T09:00:00.000Z",
    updatedAt: "2026-06-08T09:00:00.000Z",
    keywords: [
      "how to write a gift note",
      "gift card message ideas",
      "thoughtful gift messages",
      "handwritten note template",
    ],
  },
];
