import "./globals.css";

import Nav from "@/components/nav/Nav";
import Footer from "@/components/nav/Footer";
import { LeaveGuardProvider } from "@/components/LeaveGuard";
import { I18nProvider } from "@/i18n/client";
import { getLocale, getMessages, getTranslations } from "@/i18n/server";
import { appearanceScript } from "@/lib/appearance";
import { fontHeading, fontSans } from "./fonts";

// Applies the dashboard's theme and color mode before the first paint (see src/lib/appearance.js).
const APPEARANCE_SCRIPT = appearanceScript();

export async function generateMetadata() {
  const t = await getTranslations("metadata.default");

  return {
    // pages below the root can set a short title, e.g. "Dashboard" -> "Dashboard – Moodify"
    title: { default: t("title"), template: `%s – ${t("title")}` },
    description: t("description"),
  };
}

export default async function RootLayout({ children }) {
  // the language of this request (switcher choice, browser languages or English)
  const locale = await getLocale();
  const messages = await getMessages(locale);

  return (
    // suppressHydrationWarning: the appearance script may set data-theme and
    // the `dark` class on <html> before React hydrates (this affects <html>'s
    // own attributes only)
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_SCRIPT }} />
      </head>
      <body
        className={`${fontSans.variable} ${fontHeading.variable} font-sans antialiased`}
      >
        <I18nProvider locale={locale} messages={messages}>
          {/* asks before links or signing out would drop unsaved changes */}
          <LeaveGuardProvider>
            <Nav />
            <main>{children}</main>
            <Footer />
          </LeaveGuardProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
