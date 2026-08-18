/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Light / off-white paper background
        paper: "#F6FAFD",
        // Dark navy — used for text, outlines and character details
        ink: {
          DEFAULT: "#16213E",
          soft: "#33415C",
          faint: "#64748B",
        },
        // Blue / cyan primary accent
        accent: {
          DEFAULT: "#0EA5E9",
          deep: "#0284C7",
          bright: "#38BDF8",
          tint: "#E0F2FE",
        },
        card: "#FFFFFF",
        neutralSoft: "#E8EEF5",
        // Character palette
        skin: "#F6C9A0",
        skinShadow: "#E9B287",
        hair: "#1B2A4E",
        shirt: "#38BDF8",
        shirtDark: "#0EA5E9",
      },
      fontFamily: {
        display: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(22, 33, 62, 0.04), 0 18px 40px -18px rgba(22, 33, 62, 0.18)",
        lift: "0 2px 4px rgba(14, 165, 233, 0.06), 0 26px 50px -20px rgba(14, 165, 233, 0.38)",
        soft: "0 1px 2px rgba(22, 33, 62, 0.04), 0 10px 24px -12px rgba(22, 33, 62, 0.14)",
        pop: "0 12px 24px -10px rgba(2, 132, 199, 0.45)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        bob: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        wave: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(14deg)" },
          "50%": { transform: "rotate(-8deg)" },
          "75%": { transform: "rotate(14deg)" },
        },
        celebrate: {
          "0%, 100%": { transform: "rotate(-16deg)" },
          "50%": { transform: "rotate(16deg)" },
        },
        blink: {
          "0%, 90%, 100%": { transform: "scaleY(1)" },
          "95%": { transform: "scaleY(0.1)" },
        },
        popIn: {
          "0%": { opacity: "0", transform: "scale(0.92) translateY(10px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        spinSlow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        sparkle: {
          "0%, 100%": { opacity: "0.25", transform: "scale(0.7)" },
          "50%": { opacity: "1", transform: "scale(1.1)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        floaty: "floaty 5s ease-in-out infinite",
        "floaty-slow": "floaty 7s ease-in-out infinite",
        bob: "bob 3.2s ease-in-out infinite",
        wave: "wave 1.4s ease-in-out infinite",
        celebrate: "celebrate 1.2s ease-in-out infinite",
        blink: "blink 5s ease-in-out infinite",
        "pop-in": "popIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-up": "fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "spin-slow": "spinSlow 22s linear infinite",
        sparkle: "sparkle 2.6s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
      },
    },
  },
  plugins: [],
};
