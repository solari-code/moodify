import { LogoMark } from "@/components/brand/Logo"

// Layout of the 404 and error pages: logo, title, text and actions.
// No hooks, so it works in server components (not-found) and in the error
// boundaries (error, global-error), which get their texts in different ways.
export default function ErrorScreen({ title, text, children }) {
    return (
        <div className="container mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-6 px-4 py-24 text-center">
            <LogoMark className="h-12 w-12" />
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
                <p className="text-muted-foreground">{text}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">{children}</div>
        </div>
    )
}
