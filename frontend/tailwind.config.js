/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F8FC',
        canvasdim: '#EEF0FA',
        ink: '#1B1B2F',
        signal: {
          DEFAULT: '#6C5CE7',
          dark: '#5849C4',
          light: '#EDEAFD',
        },
        teal: {
          DEFAULT: '#17C3B2',
          light: '#E3FBF8',
        },
        amber: {
          DEFAULT: '#FFB627',
          light: '#FFF3DC',
        },
        slate: {
          DEFAULT: '#5A5C73',
          light: '#8B8DA3',
        },
        line: '#E4E5F1',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        soft: '0 2px 12px rgba(27, 27, 47, 0.06)',
        card: '0 4px 24px rgba(27, 27, 47, 0.08)',
        glow: '0 0 0 4px rgba(108, 92, 231, 0.15)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'sketch-fade': {
          '0%, 40%': { opacity: '1' },
          '50%, 90%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'clean-fade': {
          '0%, 40%': { opacity: '0' },
          '50%, 90%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'cursor-drift': {
          '0%': { transform: 'translate(0px, 0px)' },
          '50%': { transform: 'translate(6px, -4px)' },
          '100%': { transform: 'translate(0px, 0px)' },
        },
      },
      animation: {
        'sketch-fade': 'sketch-fade 6s ease-in-out infinite',
        'clean-fade': 'clean-fade 6s ease-in-out infinite',
        'cursor-drift': 'cursor-drift 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
