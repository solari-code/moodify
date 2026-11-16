import Link from "next/link"
import { Logo } from "@/components/brand/Logo"

// Site footer, shown on every page (root layout).
export default function Footer() {
    return (
        <footer className="border-t border-border/60">
            <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
                <div className="flex flex-col items-center gap-1 sm:items-start">
                    <Link href="/" aria-label="Moodify home" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <Logo markClassName="h-6 w-6" textClassName="text-lg" />
                    </Link>
                    <p>A calm place to check in with yourself.</p>
                </div>
                <nav aria-label="Footer" className="flex gap-6">
                    <Link href="/#how-it-works" className="hover:text-foreground">How it works</Link>
                    <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
                </nav>
            </div>
        </footer>
    )
}
