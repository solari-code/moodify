import "./globals.css";

import Nav from "@/components/nav/Nav";
import Footer from "@/components/nav/Footer";
import { I18nProvider } from "@/i18n/client";
import { getLocale, getMessages, getTranslations } from "@/i18n/server";
import { fontHeading, fontSans } from "./fonts";

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
    <html lang={locale}>
      <body
        className={`${fontSans.variable} ${fontHeading.variable} font-sans antialiased`}
      >
        <I18nProvider locale={locale} messages={messages}>
          <Nav />
          <main>{children}</main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
