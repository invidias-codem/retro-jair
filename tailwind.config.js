/** @type {import('tailwindcss').Config} */
export const content = [
  "./src/**/*.{js,jsx,ts,tsx}",
  "./public/index.html"
];

export const theme = {
  extend: {
    fontFamily: {
      'retro': ['VT323', 'monospace'],
      sans: ['var(--font-family-sans)'],
      header: ['var(--font-family-header)'],
    },
    colors: {
      'neon-green': '#39FF14',
      'retro-yellow': '#FFFF00',
      'retro-red': '#FF0000',
      'brand-accent': 'var(--c-brand-accent)',
      'brand-line': 'var(--c-brand-line)',
      'brand-text-dark': 'var(--c-brand-text-dark)',
      'brand-text-muted': 'var(--c-brand-text-muted)',
      'link-hover': 'var(--c-text-link-hover)',
    },
    backgroundColor: {
      'app': 'var(--c-bg-app)',
      'header': 'var(--c-bg-header)',
      'sidebar': 'var(--c-bg-sidebar)',
      'sidebar-hover': 'var(--c-bg-sidebar-hover)',
    },
    borderRadius: {
      'DEFAULT': 'var(--radius)',
    },
    boxShadow: {
      'neon': '0 0 5px #39FF14, 0 0 10px #39FF14, 0 0 15px #39FF14, 0 0 20px #39FF14',
      'main': 'var(--shadow-main)',
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
