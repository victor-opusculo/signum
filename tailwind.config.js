/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/views/**/*.{ejs,js,html}", "./public/**/*.{html,js}"],
  theme: 
  {
    fontSize:
    {
        sm: '0.8rem',
        base: '1rem',
        xl: '1.5rem',
        '2xl': '1.8rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
        '5xl': '3.052rem'
    },
    extend: 
    {
        transitionProperty:
        {
            visibility: 'opacity, visiblity'
        },
        backgroundImage: 
        {
            'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            'gradient-conic':
              'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        },
        animation:
        {
            'enter-from-top': 'enter-from-top 1s ease'
        },
        keyframes:
        {
            'enter-from-top':
            {
                '0%': { transform: 'translateY(-80px)', opacity: 0 },
                '100%': { transform: 'translateY(0)', opacity: 1 }
            }
        }
    },
  },
  plugins: [],
}

