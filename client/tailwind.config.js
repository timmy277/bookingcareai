/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bookingcare: {
          blue: '#45c3d2',
          darkBlue: '#1b829b',
          yellow: '#fcd34d',
          orange: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}
