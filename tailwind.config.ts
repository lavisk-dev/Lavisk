import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        // Brand palette — extracted 1:1 from the source design file
        brand: {
          DEFAULT: "#FF4C82",
          hover: "#e23c6f",
          mid: "#FF6E97",
          light: "#FF8FA3",
          pale: "#FFB6C9",
          blush: "#FFDCE6",
          mist: "#FFE9EF",
        },
        apricot: {
          DEFAULT: "#FFD3B0",
          soft: "#FFEBDF",
          deep: "#F6DFD3",
        },
        lilac: {
          DEFAULT: "#E7D6FF",
          soft: "#F3ECFF",
        },
        ink: "#241016",
        muted: "#7A5560",
        bg: "#FFF5F7",
        border: "#FFDCE6",
        input: "#FFDCE6",
        ring: "#FF4C82",
        background: "#FFF5F7",
        foreground: "#241016",
        primary: {
          DEFAULT: "#FF4C82",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#FFDCE6",
          foreground: "#241016",
        },
        destructive: {
          DEFAULT: "#D92D4E",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#241016",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "1.75rem",
        md: "1.25rem",
        sm: "0.85rem",
      },
      boxShadow: {
        soft: "0 20px 50px -30px rgba(255,76,130,.4)",
        card: "0 22px 54px -34px rgba(255,76,130,.45)",
        pop: "0 40px 90px -40px rgba(255,76,130,.6)",
      },
      keyframes: {
        floatY: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        drift: {
          "0%": { transform: "translate(0,0)" },
          "50%": { transform: "translate(34px,-26px)" },
          "100%": { transform: "translate(0,0)" },
        },
        drift2: {
          "0%": { transform: "translate(0,0)" },
          "50%": { transform: "translate(-40px,20px)" },
          "100%": { transform: "translate(0,0)" },
        },
        blobMorph: {
          "0%,100%": { borderRadius: "42% 58% 63% 37%/46% 44% 56% 54%" },
          "33%": { borderRadius: "60% 40% 42% 58%/54% 50% 50% 46%" },
          "66%": { borderRadius: "38% 62% 55% 45%/40% 58% 42% 60%" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        sparkle: {
          "0%,100%": { opacity: "0.15", transform: "scale(.7)" },
          "50%": { opacity: "0.85", transform: "scale(1.25)" },
        },
        meshShift: {
          "0%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(-5%,4%) scale(1.12)" },
          "100%": { transform: "translate(0,0) scale(1)" },
        },
        ctaPulse: {
          "0%,100%": { boxShadow: "0 14px 40px -10px rgba(255,76,130,.55)" },
          "50%": { boxShadow: "0 14px 54px -6px rgba(255,76,130,.8)" },
        },
        ribbon: {
          "0%,100%": { transform: "rotate(-4deg)" },
          "50%": { transform: "rotate(4deg)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        wordDrift: {
          "0%,100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,-6px,0)" },
        },
        letterIn: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        floatY: "floatY 8s ease-in-out infinite",
        drift: "drift 24s ease-in-out infinite",
        drift2: "drift2 30s ease-in-out infinite",
        blobMorph: "blobMorph 18s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
        sparkle: "sparkle 6s ease-in-out infinite",
        meshShift: "meshShift 26s ease-in-out infinite",
        ctaPulse: "ctaPulse 3.4s ease-in-out infinite",
        ribbon: "ribbon 5s ease-in-out infinite",
        "accordion-down": "accordion-down 0.3s ease-out",
        "accordion-up": "accordion-up 0.3s ease-out",
        wordDrift: "wordDrift 9s ease-in-out infinite",
        letterIn: "letterIn 0.7s cubic-bezier(0.22, 0.61, 0.36, 1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
