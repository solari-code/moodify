import Link from "next/link";
import { auth } from "@/../auth";
import { Button } from "@/components/ui/button";
import { CalendarDays, ChartLine, Flame, Grid3x3, ListChecks, Smile, ArrowRight, Sparkles } from "lucide-react";
import ButtonSignIn from "@/components/nav/ButtonSignIn";
import CheckInPreview from "@/components/landing/CheckInPreview";
import LandingInsights from "@/components/landing/LandingInsights";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Moodify – Track your mood and habits",
  description: "Check in with yourself each day: log your mood, tick off your habits and see how both change over time.",
};

const steps = [
  {
    icon: Smile,
    tone: "bg-lavender text-lavender-foreground",
    title: "Check in with yourself",
    text: "Pick how the day felt on a scale from 0 to 10. It takes a few seconds.",
  },
  {
    icon: ListChecks,
    tone: "bg-secondary text-secondary-foreground",
    title: "Tick off your habits",
    text: "Mark the small things you did for yourself: a walk, a few pages, an early night.",
  },
  {
    icon: Sparkles,
    tone: "bg-peach text-peach-foreground",
    title: "See your patterns",
    text: "Over the weeks, the chart and heatmap show what lifts your mood.",
  },
];

const features = [
  { icon: Smile, title: "Mood check-in", text: "A calm 0–10 scale with one emoji per step. Quick enough for every evening." },
  { icon: ChartLine, title: "Mood over time", text: "Your daily mood and its 7-day average, from the last week to the whole year." },
  { icon: ListChecks, title: "Your own habits", text: "Add the habits you care about and tick them off next to your mood." },
  { icon: Grid3x3, title: "Habit heatmap", text: "A year of habits at a glance: the darker the day, the more you did." },
  { icon: Flame, title: "Streaks", text: "See how many days in a row you kept each habit, without pressure." },
  { icon: CalendarDays, title: "Look back anytime", text: "Open any past day to remember how it went or fill in a day you missed." },
];

// Soft colored shapes behind a section (decoration only).
function Glow({ className }) {
  return <div aria-hidden="true" className={cn("pointer-events-none absolute rounded-full blur-3xl", className)} />;
}

// "Open your dashboard" when signed in, otherwise the sign-in button.
function PrimaryAction({ signedIn, variant, children }) {
  return signedIn ? (
    <Button asChild size="lg" variant={variant}>
      <Link href="/dashboard">
        Open your dashboard
        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
      </Link>
    </Button>
  ) : (
    <ButtonSignIn size="lg" variant={variant}>{children}</ButtonSignIn>
  );
}

export default async function Home() {
  const session = await auth();
  const signedIn = !!session?.user;

  return (
    <div className="pt-16">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <Glow className="-left-24 top-10 h-72 w-72 bg-lavender-strong/25" />
        <Glow className="right-0 top-0 h-80 w-80 bg-peach-strong/20" />
        <Glow className="bottom-0 left-1/3 h-64 w-64 bg-primary/10" />

        <div className="container relative mx-auto max-w-6xl grid items-center gap-12 px-4 py-16 md:py-24 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-7 text-center lg:text-left">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/70 px-3 py-1 text-sm font-medium text-secondary-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
              Mood &amp; habit tracker
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              How was your day, <span className="text-primary">really?</span>
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground lg:mx-0">
              Moodify is a calm place to check in with yourself. Log your mood in a few seconds,
              tick off the habits that matter to you, and discover what makes your good days good.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <PrimaryAction signedIn={signedIn}>
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </PrimaryAction>
              <Button asChild size="lg" variant="ghost">
                <Link href="#how-it-works">How it works</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <CheckInPreview />
            <p className="absolute -bottom-4 -left-2 hidden items-center gap-1.5 rounded-full bg-peach px-3 py-1.5 text-sm font-semibold text-peach-foreground shadow-soft sm:flex" aria-hidden="true">
              <Flame className="h-4 w-4" /> 12-day streak
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="scroll-mt-20 border-y border-border/60 bg-card/60">
        <div className="container mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="mx-auto mb-12 max-w-2xl space-y-3 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">A minute a day is enough</h2>
            <p className="text-muted-foreground">No journaling marathon, no pressure. Just a short, honest check-in.</p>
          </div>
          <ol className="grid gap-6 md:grid-cols-3">
            {steps.map(({ icon: Icon, tone, title, text }, index) => (
              <li key={title} className="relative rounded-xl border bg-card p-6 shadow-soft">
                <span className="absolute right-5 top-4 font-heading text-4xl font-semibold text-muted-foreground/25" aria-hidden="true">
                  {index + 1}
                </span>
                <span className={cn("mb-4 flex h-11 w-11 items-center justify-center rounded-xl", tone)}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mb-1 text-xl font-semibold">{title}</h3>
                <p className="text-muted-foreground">{text}</p>
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
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Watch your mood find its rhythm</h2>
            <p className="text-muted-foreground">
              Every check-in adds a point. Over time you see your ups and downs, and which habits
              come with your better days. Here with a few months of sample data.
            </p>
          </div>
          <LandingInsights />
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-t border-border/60 bg-card/60">
        <div className="container mx-auto max-w-6xl px-4 py-16 md:py-20">
          <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight sm:text-4xl">Everything in one calm place</h2>
          <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="space-y-1">
                  <h3 className="font-sans text-base font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{text}</p>
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
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Start with today</h2>
            <p className="text-primary-foreground">
              It takes less than a minute. After a few weeks you&apos;ll start to see which habits lift your mood.
            </p>
            <PrimaryAction signedIn={signedIn} variant="secondary" />
          </div>
        </div>
      </section>
    </div>
  );
}
