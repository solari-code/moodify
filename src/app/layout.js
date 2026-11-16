import localFont from "next/font/local";
import "./globals.css";

import Nav from "@/components/nav/Nav";
import Footer from "@/components/nav/Footer";

// Body text: Figtree, a friendly, open sans-serif.
const fontSans = localFont({
  src: "./fonts/FigtreeVF-latin.woff2",
  variable: "--font-sans",
  weight: "300 900",
  display: "swap",
});
// Headings: Fraunces with its "soft" axis (rounded terminals), see globals.css.
const fontHeading = localFont({
  src: "./fonts/FrauncesSoftVF-latin.woff2",
  variable: "--font-heading",
  weight: "100 900",
  display: "swap",
});

export const metadata = {
  // pages below the root can set a short title, e.g. "Dashboard" -> "Dashboard – Moodify"
  title: { default: "Moodify", template: "%s – Moodify" },
  description: "Log how you feel each day, tick off your habits and see how both change over time.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${fontSans.variable} ${fontHeading.variable} font-sans antialiased`}
      >
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
