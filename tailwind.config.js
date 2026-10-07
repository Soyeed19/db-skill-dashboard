/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dbs: {
          green: {
            DEFAULT: '#007A3D', // Primary Logo Text
            dark: '#005C2E',
            light: '#E6F4EA',
          },
          cyan: {
            DEFAULT: '#00AEEF', // Logo "D" & Arc
            dark: '#0284C7',
            light: '#E0F2FE',
          },
          orange: {
            DEFAULT: '#F15A24', // Logo "B"
            dark: '#C2410C',
            light: '#FFF7ED',
          },
          growth: {
            DEFAULT: '#62B548', // Logo Top Emblem
            dark: '#15803D',
            light: '#DCFCE7',
          }
        }
      }
    }
  },
  plugins: [],
};
