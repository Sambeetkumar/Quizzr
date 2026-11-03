/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgPrimary: 'var(--bg-primary)',
        bgSecondary: 'var(--bg-secondary)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        cardBg: 'var(--card-bg)',
        cardBorder: 'var(--card-border)',
        accentPrimary: '#6366f1',
        accentHover: '#4f46e5',
        success: '#10b981',
        error: '#ef4444',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
