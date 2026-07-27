"use client";

import Link from "next/link";
import { useState } from "react";
import { Reveal } from "@/components/shared/reveal";
import { BRAND_NAME, FOOTER_LINKS, SOCIALS } from "@/lib/constants";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const subscribe = async () => {
    if (!email.trim()) return;
    // Reuse the contact endpoint as a lightweight newsletter opt-in.
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Newsletter signup",
          email,
          subject: "Newsletter",
          message: "Requested 10% off first gift.",
        }),
      });
    } catch {
      // Non-blocking — still show the confirmation.
    }
    setSubscribed(true);
  };

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-6 md:px-8">
      <Reveal className="relative mt-9 overflow-hidden rounded-[34px] bg-[linear-gradient(160deg,#FF4C82,#FF8FA3)] px-6 py-14 text-white md:px-12">
        <div className="pointer-events-none absolute -right-[6%] -top-[30%] h-[180%] w-2/5 animate-drift bg-[radial-gradient(circle,#FFD3B0,transparent_65%)] opacity-40 blur-[50px]" />

        <div className="relative z-[2] flex flex-wrap justify-between gap-10">
          <div className="max-w-sm">
            <div className="font-display text-3xl font-extrabold tracking-tight">
              {BRAND_NAME}
              <span className="text-brand-blush">.</span>
            </div>
            <p className="mt-3.5 text-[15px] leading-relaxed opacity-90">
              Thoughtfully wrapped gifts for the people who matter. Delivered with a little extra love.
            </p>
            <div className="mt-6 flex gap-3">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.18] font-bold text-white transition duration-300 hover:scale-110 hover:bg-white/25"
                >
                  {social.handle}
                </a>
              ))}
            </div>
          </div>

          <div className="min-w-[280px]">
            <div className="mb-3 text-[17px] font-bold">Get 10% off your first gift</div>
            <div className="flex gap-2.5 rounded-full border border-white/30 bg-white/[0.16] py-1.5 pl-5 pr-1.5 transition focus-within:bg-white/25">
              <input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email address"
                className="flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/70"
              />
              <button
                onClick={subscribe}
                className="rounded-full bg-white px-6 py-3 font-bold text-brand transition hover:bg-white/90"
              >
                {subscribed ? "Sent ✓" : "Join"}
              </button>
            </div>

            <div className="mt-8 flex gap-10 text-sm">
              <div className="flex flex-col gap-2.5 opacity-90">
                {FOOTER_LINKS.shop.map((l) => (
                  <Link key={l.href} href={l.href} className="text-white hover:text-brand-blush">
                    {l.label}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-2.5 opacity-90">
                {FOOTER_LINKS.company.map((l) => (
                  <Link key={l.href} href={l.href} className="text-white hover:text-brand-blush">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-[2] mt-10 border-t border-white/25 pt-5 text-[13px] opacity-80">
          © {new Date().getFullYear()} {BRAND_NAME}. Wrapped with love.
        </div>
      </Reveal>
    </div>
  );
}
