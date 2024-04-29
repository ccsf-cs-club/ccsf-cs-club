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
};

