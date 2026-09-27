/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kisan: {
          50: '#eff2f0',
          100: '#d7e0da',
          200: '#b1c4ba',
          300: '#85a396',
          400: '#5c806f',
          500: '#436854',
          600: '#304639', // Target Dark Green
          700: '#25382d',
          800: '#1d2c23',
          900: '#16231b',
          950: '#0c140f',
        },
        earth: {
          50: '#fbf0cb', // Target Cream
          100: '#f3e3a9',
          200: '#e4cd7c',
          300: '#d2b154',
          400: '#bf9436',
          500: '#8a7652', // Target Muted Brown
          600: '#785a19', // Target Dark Amber
          700: '#5f4611',
          800: '#4f3912',
          900: '#413012',
          950: '#251a08',
        },
        hopeBlue: {
          50: '#f2f7fb',
          100: '#e1eef6',
          200: '#cadfec',
          300: '#a3c8de',
          400: '#76a8ca',
          500: '#548cb3', // Target Sky Blue
          600: '#417297',
          700: '#355b7a',
          800: '#2f4c65',
          900: '#2a4155',
          950: '#1b2a38',
        },
        amberGold: {
          500: '#f59e0b',
          600: '#d97706',
        }
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px rgba(0,0,0,1)',
        'brutal-sm': '2px 2px 0px 0px rgba(0,0,0,1)',
        'brutal-lg': '8px 8px 0px 0px rgba(0,0,0,1)',
        'brutal-hover': '2px 2px 0px 0px rgba(0,0,0,1)',
        'brutal-active': '0px 0px 0px 0px rgba(0,0,0,1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'mic-ripple': 'ripple 1.5s linear infinite',
        'bounce-subtle': 'bounceSubtle 2s infinite',
        'pop-in': 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(67, 151, 93, 0.7)' },
          '70%': { transform: 'scale(1.08)', boxShadow: '0 0 0 16px rgba(67, 151, 93, 0)' },
          '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(67, 151, 93, 0)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        },
        popIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
          '100%': { transform: 'translateY(0px)' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
