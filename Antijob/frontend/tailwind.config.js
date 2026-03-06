/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/AuthPage.jsx',
  ],
  // IMPORTANT: preflight disabled so Tailwind reset does NOT break
  // existing dashboard CSS in index.css
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          500: '#4f46e5',
          600: '#4338ca',
          700: '#3730a3',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#0f172a',
        },
        navy: {
          DEFAULT: '#1a2b4a',
          dark:    '#0f1c36',
          light:   '#243559',
        }
      },
      boxShadow: {
        'card':    '0 0 0 1px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.08)',
        'card-lg': '0 0 0 1px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.06), 0 32px 64px rgba(0,0,0,0.08)',
        'btn':     '0 4px 12px rgba(26,43,74,0.25)',
        'btn-lg':  '0 8px 24px rgba(26,43,74,0.35)',
      },
      animation: {
        'fade-up':   'fadeUp 0.55s cubic-bezier(0.4,0,0.2,1) both',
        'fade-in':   'fadeIn 0.4s ease both',
        'slide-in':  'slideIn 0.45s cubic-bezier(0.4,0,0.2,1) both',
        'spin-slow': 'spin 1.2s linear infinite',
      },
      keyframes: {
        fadeUp:  { from: { opacity:'0', transform:'translateY(20px)' }, to: { opacity:'1', transform:'none' } },
        fadeIn:  { from: { opacity:'0' }, to: { opacity:'1' } },
        slideIn: { from: { opacity:'0', transform:'translateX(16px)' }, to: { opacity:'1', transform:'none' } },
      },
    },
  },
  plugins: [],
}
