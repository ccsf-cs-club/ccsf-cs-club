/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  
  theme: {
    extend: {
      boxShadow: {
        "custom-hover": "0 0 8px rgba(255, 255, 255, 0.6)", // Add this line
      },
    },
  },
  
  plugins: [require("daisyui")],

  // Add daisyUI config here
  daisyui: {
    themes: [
      {
        "ccsf-cyberpunk": {
          "primary": "#FF0055", // CCSF Red - Neonish
          "secondary": "#E0E0E0", // Off-white for accents
          "accent": "#8A2BE2", // BlueViolet - another accent (keeping this for now)
          "neutral": "#1A1A1A", // Dark background for neutral elements
          "base-100": "#0A0A0A", // Deep black background
          "info": "#F0F0F0", // Light gray/off-white
          "success": "#00FF00", // Lime Green (keeping this)
          "warning": "#FFD700", // Gold (keeping this)
          "error": "#FF4500", // OrangeRed (keeping this)
          
          // Optional: Add custom CSS variables for text and glow if needed
          "--text-color": "#FFFFFF", // Pure white for general text
        },
      },
      "dark", // Keep the default dark theme as an option
    ],
  },
};

