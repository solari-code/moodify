import localFont from "next/font/local";

// The app's fonts, shared by the root layout and global-error.jsx (which
// replaces the layout when it fails, so it sets them up itself).

// Body text: Figtree, a friendly, open sans-serif.
export const fontSans = localFont({
  src: "./fonts/FigtreeVF-latin.woff2",
  variable: "--font-sans",
  weight: "300 900",
  display: "swap",
});
// Headings: Fraunces with its "soft" axis (rounded terminals), see globals.css.
export const fontHeading = localFont({
  src: "./fonts/FrauncesSoftVF-latin.woff2",
  variable: "--font-heading",
  weight: "100 900",
  display: "swap",
});
