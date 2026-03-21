/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                pastel: {
                    pink: 'var(--pastel-pink)',
                    'pink-dark': 'var(--pastel-pink-dark)',
                    green: 'var(--pastel-green)',
                    'green-dark': 'var(--pastel-green-dark)',
                    mint: 'var(--pastel-mint)',
                    'mint-dark': 'var(--pastel-mint-dark)',
                    peach: 'var(--pastel-peach)',
                    'peach-dark': 'var(--pastel-peach-dark)',
                    lavender: 'var(--pastel-lavender)',
                    'lavender-dark': 'var(--pastel-lavender-dark)',
                    blue: 'var(--pastel-blue)',
                    'blue-dark': 'var(--pastel-blue-dark)',
                    cream: 'var(--pastel-cream)',
                    'cream-dark': 'var(--pastel-cream-dark)',
                },
                surface: {
                    DEFAULT: 'var(--surface)',
                    card: 'var(--surface-card)',
                    hover: 'var(--surface-hover)',
                    border: 'var(--surface-border)',
                    muted: 'var(--surface-muted)',
                },
                text: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    muted: 'var(--text-muted)',
                    light: 'var(--text-light)',
                },
                accent: {
                    DEFAULT: 'var(--accent)',
                    warm: 'var(--accent-warm)',
                    coral: 'var(--accent-coral)',
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
                'soft': 'var(--shadow-soft)',
                'card': 'var(--shadow-card)',
                'elevated': 'var(--shadow-elevated)',
                'button': 'var(--shadow-button)',
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
