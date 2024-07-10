import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: ['selector', '[data-theme="dark"]'],
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}'
    ],
    theme: {
        extend: {
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
            }
        },
        fontSize: {
            sm: '0.8rem',
            base: '1rem',
            '1.2': '1.2rem',
            '1.5': '1.5rem',
            '1.8': '1.8rem',
            lg: '2rem'
        }
    }
}
export default config
