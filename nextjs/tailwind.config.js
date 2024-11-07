/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./utils/**/*.{js,ts,jsx,tsx}"],
  plugins: [require("daisyui")],
  darkTheme: "dark",
  darkMode: ["selector", "[data-theme='dark']"],
  // DaisyUI theme colors
  daisyui: {
    themes: [
      {
        light: {
          primary: "#93BBFB",
          "primary-content": "#212638",
          secondary: "#DAE8FF",
          "secondary-content": "#212638",
          accent: "#93BBFB",
          "accent-content": "#212638",
          neutral: "#212638",
          "neutral-content": "#ffffff",
          "base-100": "#ffffff",
          "base-200": "#f4f8ff",
          "base-300": "#DAE8FF",
          "base-content": "#212638",
          info: "#93BBFB",
          success: "#34EEB6",
          warning: "#FFCF72",
          error: "#FF8863",

          "--rounded-btn": "9999rem",

          ".tooltip": {
            "--tooltip-tail": "6px",
          },
          ".link": {
            textUnderlineOffset: "2px",
          },
          ".link:hover": {
            opacity: "80%",
          },
        },
      },
      {
        dark: {
          primary: "#000000", // Pure black for a full blackout feel
          "primary-content": "#EDEDED", // Soft light gray for text against black
          secondary: "#0A0A0A", // Slightly lighter black for secondary content
          "secondary-content": "#EDEDED", // Light gray for readability
          accent: "#1E1E1E", // Very dark gray as accent for elements that need subtle highlighting
          "accent-content": "#F9F9F9", // Crisp white for high contrast where needed
          neutral: "#000000", // Full black for neutral base
          "neutral-content": "#EDEDED", // Light gray for text content
          "base-100": "#000000", // Pure black base for background
          "base-200": "#0A0A0A", // Slightly lighter black for card backgrounds
          "base-300": "#1A1A1A", // Dark gray for subtle borders
          "base-content": "#EDEDED", // Consistent light gray for text
          info: "#383838", // Dark gray for informational highlights
          success: "#37C991", // Rich green for success messages, adding vibrancy to the design
          warning: "#FFC66D", // Warm gold for warnings to maintain a luxe look
          error: "#FF6A6A", // Soft red for errors with a modern feel

          "--rounded-btn": "0", // Maintain sharp edges for a professional look

          ".tooltip": {
            "--tooltip-tail": "0", // No tail to maintain sharp, futuristic feel
            "--tooltip-color": "oklch(var(--p))",
          },
          ".link": {
            textUnderlineOffset: "2px",
            fontWeight: "bold",
          },
          ".link:hover": {
            opacity: "90%",
          },

          // Adding underglow effect for cards
          ".glow": {
            backgroundColor: "#0A0A0A", // Dark background for cards
            boxShadow: "0px 0px 20px 4px rgba(0, 200, 255, 0.15)", // Neon underglow for high-tech feel
            borderRadius: "0px", // No rounding for a sleek, sharp appearance
            padding: "16px", // Padding to give card contents space
            border: "1px solid #1A1A1A", // Thin border for card separation
          },

          ".glow:hover": {
            boxShadow: "0px 0px 25px 6px rgba(0, 200, 255, 0.30)", // Increase glow on hover for interactivity
          },
        },
      },
    ],
  },
  theme: {
    extend: {
      boxShadow: {
        center: "0 0 12px -2px rgb(0 0 0 / 0.05)",
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
};
