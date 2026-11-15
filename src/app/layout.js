import localFont from "next/font/local";
import "./globals.css";

import Nav from "@/components/nav/Nav";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Nav />
        <main>{children}</main>
        <footer></footer>
      </body>
    </html>
  );
}
