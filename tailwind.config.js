// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './components/ui/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    screens: {
      sm: '480px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      // Токены отступов
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      // Токены размера шрифта
      fontSize: {
        base: '1rem',     // 16px
        lg:   '1.125rem', // 18px
        xl:   '1.25rem',  // 20px
      },
      // Цветовая схема
      colors: {
        primary: {
          light: '#4f8df7',
          DEFAULT: '#1e6edc',
          dark: '#155aba',
          foreground: '#ffffff'
        },
        secondary: {
          light: '#f7c14f',
          DEFAULT: '#dc9e1e',
          dark: '#ba7c15',
          foreground: '#ffffff'
        },
        accent: {
          DEFAULT: '#f05d5e',
          foreground: '#ffffff'
        },
        neutral: {
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#bdbdbd',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121'
        },
        background: {
          light: '#ffffff',
          dark: '#111827'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        serif: ['Merriweather', 'ui-serif', 'Georgia'],
        mono: ['Fira Code', 'ui-monospace', 'SFMono-Regular'],
      },
      borderRadius: {
        lg: '1rem',
        xl: '1.5rem'
      },
      transitionDuration: {
        DEFAULT: '200ms'
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: .5 },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
