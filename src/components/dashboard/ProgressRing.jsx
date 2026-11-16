import { cn } from "@/lib/utils"

// Small ring that fills up as habits are done, with "done/total" inside.
export default function ProgressRing({ done, total, className }) {
    const radius = 20
    const circumference = 2 * Math.PI * radius
    const share = total === 0 ? 0 : done / total

    return (
        <div
            role="img"
            aria-label={`${done} of ${total} habits done`}
            className={cn("relative h-14 w-14 shrink-0", className)}
        >
            <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle cx="24" cy="24" r={radius} fill="none" strokeWidth="5" className="stroke-secondary" />
                <circle
                    cx="24" cy="24" r={radius} fill="none" strokeWidth="5" strokeLinecap="round"
                    className="stroke-primary transition-[stroke-dashoffset] duration-500 ease-out"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - share)}
                    // a round cap would still show a dot at 0 %
                    opacity={done === 0 ? 0 : 1}
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums" aria-hidden="true">
                {done}/{total}
            </span>
        </div>
    )
}
