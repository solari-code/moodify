const { fontFamily } = require("tailwindcss/defaultTheme");

// The mood scale 0–10 as Tailwind colors: bg-mood-0 … bg-mood-10.
// Only for fixed values; for computed moods use moodColor() from src/lib/mood.js
// (Tailwind can't see class names that are built at runtime).
const moodColors = Object.fromEntries(
  Array.from({ length: 11 }, (_, mood) => [mood, `hsl(var(--mood-${mood}))`])
);

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['var(--font-sans)', ...fontFamily.sans],
  			// Color emoji fonts first: system fonts like DejaVu Sans (Linux) or
  			// Segoe UI Symbol (Windows) have black-and-white glyphs for some
  			// emojis and would otherwise win for those, mixing two styles.
  			emoji: ['"Apple Color Emoji"', '"Segoe UI Emoji"', '"Noto Color Emoji"', '"Twemoji Mozilla"', 'sans-serif'],
  			// Fraunces with its "soft" axis at the maximum: rounded serifs
  			heading: [
  				['var(--font-heading)', 'ui-serif', 'Georgia', 'serif'],
  				{ fontVariationSettings: '"SOFT" 100' }
  			]
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			lavender: {
  				DEFAULT: 'hsl(var(--lavender))',
  				foreground: 'hsl(var(--lavender-foreground))',
  				strong: 'hsl(var(--lavender-strong))'
  			},
  			peach: {
  				DEFAULT: 'hsl(var(--peach))',
  				foreground: 'hsl(var(--peach-foreground))',
  				strong: 'hsl(var(--peach-strong))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			mood: moodColors
  		},
  		borderRadius: {
  			xl: 'calc(var(--radius) + 4px)',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			// low, diffuse shadows tinted with the theme (--shadow)
  			soft: '0 1px 2px hsl(var(--shadow) / 0.04), 0 4px 16px -6px hsl(var(--shadow) / 0.08)',
  			'soft-lg': '0 2px 4px hsl(var(--shadow) / 0.04), 0 12px 32px -8px hsl(var(--shadow) / 0.14)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
