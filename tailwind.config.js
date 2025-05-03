/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Include all files in the "app" directory (Next.js 13+)
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // Include all files in the "pages" directory (for older Next.js projects)
    "./pages/**/*.{js,ts,jsx,tsx}",
    // Include all files in the "components" directory
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
