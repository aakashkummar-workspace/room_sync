/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                pastel: {
                    pink: '#FFE4E8',
                    'pink-dark': '#F4A5B8',
                    green: '#E8F5E9',
                    'green-dark': '#81C784',
                    mint: '#E0F2F1',
                    'mint-dark': '#80CBC4',
                    peach: '#FFF3E0',
                    'peach-dark': '#FFB74D',
                    lavender: '#F3E5F5',
                    'lavender-dark': '#CE93D8',
                    blue: '#E3F2FD',
                    'blue-dark': '#90CAF9',
                    cream: '#FFF8E1',
                    'cream-dark': '#FFD54F',
                },
                surface: {
                    DEFAULT: '#FAFAFA',
                    card: '#FFFFFF',
                    hover: '#F5F5F5',
                    border: '#F0F0F0',
                    muted: '#E8E8E8',
                },
                text: {
                    primary: '#1A1A2E',
                    secondary: '#6B7280',
                    muted: '#9CA3AF',
                    light: '#D1D5DB',
                },
                accent: {
                    DEFAULT: '#1A1A2E',
                    warm: '#E8A87C',
                    coral: '#E27D60',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem',
            },
            boxShadow: {
                'soft': '0 2px 15px rgba(0, 0, 0, 0.04)',
                'card': '0 4px 20px rgba(0, 0, 0, 0.06)',
                'elevated': '0 8px 30px rgba(0, 0, 0, 0.08)',
                'button': '0 2px 8px rgba(0, 0, 0, 0.1)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.4s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            }
        },
    },
    plugins: [],
}
