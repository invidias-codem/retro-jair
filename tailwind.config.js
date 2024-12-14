/** @type {import('tailwindcss').Config} */
export const content = [
  "./src/**/*.{js,jsx,ts,tsx}",
];

export const theme = {
  extend: {
    fontFamily: {
      'retro': ['VT323', 'monospace'],
    },
    colors: {
      'neon-green': '#39FF14',
      'retro-yellow': '#FFFF00',
      'retro-red': '#FF0000',
    },
    boxShadow: {
      'neon': '0 0 5px #39FF14, 0 0 10px #39FF14, 0 0 15px #39FF14, 0 0 20px #39FF14',
    },
    keyframes: {
      blink: {
        '0%, 100%': { opacity: 1 },
        '50%': { opacity: 0 },
      }
    },
    animation: {
      blink: 'blink 1s linear infinite',
    }
  },
};

export const plugins = [];



