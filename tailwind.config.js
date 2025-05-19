export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      animation: {
        'scanline': 'scanline 2s linear infinite',
      },
      keyframes: {
        scanline: {
          '0%': { top: '10%', opacity: '0.8' },
          '50%': { top: '90%', opacity: '0.5' },
          '100%': { top: '10%', opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}