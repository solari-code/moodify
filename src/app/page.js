import Link from "next/link";
import { auth } from "@/../auth";
import { Button } from "@/components/ui/button";
import { CalendarDays, ChartLine, Flame, Grid3x3, ListChecks, Smile, ArrowRight, Sparkles } from "lucide-react";
import ButtonSignIn from "@/components/nav/ButtonSignIn";
import CheckInPreview from "@/components/landing/CheckInPreview";
import LandingInsights from "@/components/landing/LandingInsights";
import SignInErrorNotice from "@/components/landing/SignInErrorNotice";
import { cn } from "@/lib/utils";
import { getFormatter, getTranslations } from "@/i18n/server";

export async function generateMetadata() {
  const t = await getTranslations("metadata.home");
  return { title: t("title"), description: t("description") };
}

// "How it works": icon, colors and the key of its texts (landing.steps.<key>)
const steps = [
  { key: "checkIn", icon: Smile, tone: "bg-lavender text-lavender-foreground" },
  { key: "habits", icon: ListChecks, tone: "bg-secondary text-secondary-foreground" },
  { key: "patterns", icon: Sparkles, tone: "bg-peach text-peach-foreground" },
];

// Features: icon and the key of its texts (landing.features.<key>)
const features = [
  { key: "moodCheckIn", icon: Smile },
  { key: "moodOverTime", icon: ChartLine },
  { key: "ownHabits", icon: ListChecks },
  { key: "heatmap", icon: Grid3x3 },
  { key: "streaks", icon: Flame },
  { key: "lookBack", icon: CalendarDays },
];

// The streak shown next to the check-in preview (same as its first habit).
const PREVIEW_STREAK = 12;

// Soft colored shapes behind a section (decoration only).
function Glow({ className }) {
  return <div aria-hidden="true" className={cn("pointer-events-none absolute rounded-full blur-3xl", className)} />;
}

// "Open your dashboard" when signed in, otherwise the sign-in button.
async function PrimaryAction({ signedIn, variant, children }) {
  const t = await getTranslations("landing.hero");

  return signedIn ? (
    <Button asChild size="lg" variant={variant}>
      <Link href="/dashboard">
        {t("openDashboard")}
        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
      </Link>
    </Button>
  ) : (
    <ButtonSignIn size="lg" variant={variant}>{children}</ButtonSignIn>
  );
}

// searchParams.error: set by Auth.js when a sign-in failed (see auth.js)
export default async function Home({ searchParams }) {
  const { error } = await searchParams;
  const session = await auth();
  const signedIn = !!session?.user;
  const t = await getTranslations();
  const format = await getFormatter();

  return (
    <div className="pt-16">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <Glow className="-left-24 top-10 h-72 w-72 bg-lavender-strong/25" />
        <Glow className="right-0 top-0 h-80 w-80 bg-peach-strong/20" />
        <Glow className="bottom-0 left-1/3 h-64 w-64 bg-primary/10" />

        {/* a failed sign-in (only when signed out: after a later sign-in it's outdated) */}
        {error && !signedIn && <SignInErrorNotice error={error} />}

        <div className="container relative mx-auto max-w-6xl grid items-center gap-12 px-4 py-16 md:py-24 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-7 text-center lg:text-left">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/70 px-3 py-1 text-sm font-medium text-secondary-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
              {t("landing.hero.badge")}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {t.rich("landing.hero.title", { accent: (chunks) => <span className="text-primary">{chunks}</span> })}
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground lg:mx-0">
              {t("landing.hero.intro")}
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <PrimaryAction signedIn={signedIn}>
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </PrimaryAction>
              <Button asChild size="lg" variant="ghost">
                <Link href="#how-it-works">{t("common.howItWorks")}</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <CheckInPreview />
            <p className="absolute -bottom-4 -left-2 hidden items-center gap-1.5 rounded-full bg-peach px-3 py-1.5 text-sm font-semibold text-peach-foreground shadow-soft sm:flex" aria-hidden="true">
              <Flame className="h-4 w-4" /> {t("checkIn.streak", { count: PREVIEW_STREAK })}
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="scroll-mt-20 border-y border-border/60 bg-card/60">
        <div className="container mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="mx-auto mb-12 max-w-2xl space-y-3 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("landing.steps.title")}</h2>
            <p className="text-muted-foreground">{t("landing.steps.intro")}</p>
          </div>
          <ol className="grid gap-6 md:grid-cols-3">
            {steps.map(({ key, icon: Icon, tone }, index) => (
              <li key={key} className="relative rounded-xl border bg-card p-6 shadow-soft">
                <span className="absolute right-5 top-4 font-heading text-4xl font-semibold text-muted-foreground/25" aria-hidden="true">
                  {format.number(index + 1)}
                </span>
                <span className={cn("mb-4 flex h-11 w-11 items-center justify-center rounded-xl", tone)}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mb-1 text-xl font-semibold">{t(`landing.steps.${key}.title`)}</h3>
                <p className="text-muted-foreground">{t(`landing.steps.${key}.text`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* INSIGHTS: the real chart and heatmap with sample data */}
      <section className="relative overflow-hidden">
        <Glow className="-right-32 top-24 h-80 w-80 bg-lavender-strong/15" />
        <div className="container relative mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="mx-auto mb-10 max-w-2xl space-y-3 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("landing.insights.title")}</h2>
            <p className="text-muted-foreground">{t("landing.insights.intro")}</p>
          </div>
          <LandingInsights />
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-t border-border/60 bg-card/60">
        <div className="container mx-auto max-w-6xl px-4 py-16 md:py-20">
          <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight sm:text-4xl">{t("landing.features.title")}</h2>
          <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ key, icon: Icon }) => (
              <li key={key} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="space-y-1">
                  <h3 className="font-sans text-base font-semibold">{t(`landing.features.${key}.title`)}</h3>
                  <p className="text-sm text-muted-foreground">{t(`landing.features.${key}.text`)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-14 text-center text-primary-foreground shadow-soft-lg">
          <Glow className="-left-16 -top-16 h-64 w-64 bg-lavender-strong/40" />
          <Glow className="-bottom-20 -right-10 h-64 w-64 bg-peach-strong/40" />
          <div className="relative mx-auto max-w-xl space-y-6">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("landing.cta.title")}</h2>
            <p className="text-primary-foreground">{t("landing.cta.text")}</p>
            <PrimaryAction signedIn={signedIn} variant="secondary" />
          </div>
        </div>
      </section>
    </div>
  );
}
