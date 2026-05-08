/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ios: {
          blue:   '#007AFF',
          green:  '#34C759',
          red:    '#FF3B30',
          orange: '#FF9500',
          gray:   '#8E8E93',
          gray2:  '#AEAEB2',
          gray3:  '#C7C7CC',
          gray4:  '#D1D1D6',
          gray5:  '#E5E5EA',
          gray6:  '#F2F2F7',
        },
      },
      fontFamily: {
        ios: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
