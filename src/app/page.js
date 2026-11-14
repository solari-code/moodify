import Link from "next/link";
import { auth } from "@/../auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ListChecks, LineChart, Flame, Smile, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Moodify – Track your mood and habits",
  description: "Log how you feel each day, tick off your habits and see how both change over time.",
};

// A few points of the 0–10 mood scale, the same emojis as the day tracker
const moodScale = [
  { value: 0, emoji: "😭" },
  { value: 3, emoji: "😞" },
  { value: 5, emoji: "🙂" },
  { value: 7, emoji: "😄" },
  { value: 10, emoji: "😍" },
];

const steps = [
  {
    title: "Pick a day",
    text: "Choose today or any day in the past from the calendar.",
  },
  {
    title: "Log your mood",
    text: "Move the slider from 0 to 10 to say how the day felt.",
  },
  {
    title: "Tick off your habits",
    text: "Mark the habits you kept, like a walk, reading or no phone after 10.",
  },
];

const features = [
  {
    icon: Smile,
    title: "Mood on a 0–10 scale",
    text: "One slider, one emoji. Quick enough to do every evening.",
  },
  {
    icon: ListChecks,
    title: "Your own habits",
    text: "Add the habits you care about and remove the ones you dropped.",
  },
  {
    icon: CalendarDays,
    title: "Calendar",
    text: "Jump to any past day to look back or fill in a day you missed.",
  },
  {
    icon: LineChart,
    title: "Overview",
    text: "Average mood per week, month or year, and your habit streaks.",
  },
];

// Example habits for the preview card
const previewHabits = [
  { name: "Morning walk", done: true },
  { name: "Read 20 pages", done: true },
  { name: "No phone after 10 pm", done: false },
];

export default async function Home() {
  const session = await auth();
  const signedIn = !!session?.user;

  const primaryAction = signedIn
    ? { href: "/dashboard", label: "Open your dashboard" }
    : { href: "/api/auth/signin", label: "Sign in with GitHub" };

  return (
    <div className="pt-16 font-[family-name:var(--font-geist-sans)]">
      {/* HERO */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="space-y-6 text-center md:text-left">
            <Badge variant="secondary" className="text-sm">
              Mood &amp; habit tracker
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              How was your day, really?
            </h1>
            <p className="text-lg text-muted-foreground">
              Moodify helps you notice what makes your days better. Log your mood in a few seconds,
              tick off your habits, and see how both change over time.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row md:justify-start">
              <Button asChild size="lg">
                <Link href={primaryAction.href}>
                  {primaryAction.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="#how-it-works">How it works</Link>
              </Button>
            </div>
          </div>

          {/* PREVIEW CARD */}
          <Card className="mx-auto w-full max-w-sm shadow-lg">
            <CardHeader className="text-center">
              <CardTitle>Log your Day</CardTitle>
              <CardDescription>Example entry</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-medium">How are you?</p>
                <div className="flex justify-between text-2xl" aria-hidden="true">
                  {moodScale.map((point) => (
                    <span
                      key={point.value}
                      className={point.value === 7 ? "scale-125" : "opacity-40"}
                    >
                      {point.emoji}
                    </span>
                  ))}
                </div>
                <p className="text-center font-semibold">7 😄</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Habits</p>
                {previewHabits.map((habit) => (
                  <div key={habit.name} className="flex items-center justify-between text-sm">
                    <span className={habit.done ? "" : "text-muted-foreground"}>{habit.name}</span>
                    <span
                      className={`h-5 w-9 rounded-full p-0.5 ${habit.done ? "bg-primary" : "bg-input"}`}
                      aria-label={habit.done ? "done" : "not done"}
                    >
                      <span
                        className={`block h-4 w-4 rounded-full bg-background transition-transform ${habit.done ? "translate-x-4" : ""}`}
                      />
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>Morning walk: 12 days in a row</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="scroll-mt-20 border-y bg-muted/40">
        <div className="container mx-auto px-4 py-16">
          <h2 className="mb-10 text-center text-3xl font-bold tracking-tight">How it works</h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-4 md:flex-col md:text-center">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground md:mx-auto">
                  {index + 1}
                </span>
                <div className="space-y-1">
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-10 text-center text-3xl font-bold tracking-tight">Everything in one place</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <CardHeader>
                <Icon className="mb-2 h-6 w-6 text-primary" />
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{text}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="border-t">
        <div className="container mx-auto space-y-6 px-4 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Start with today</h2>
          <p className="mx-auto max-w-xl text-muted-foreground">
            It takes less than a minute. After a few weeks you&apos;ll start to see which habits lift your mood.
          </p>
          <Button asChild size="lg">
            <Link href={primaryAction.href}>{primaryAction.label}</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          Moodify · a small mood and habit tracker
        </div>
      </footer>
    </div>
  );
}
