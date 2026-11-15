import { SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import NavSheet from "./NavSheet"
import { Button } from "@/components/ui/button"
import { Smile, Menu, LogOut, User } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import ButtonSignIn from "./ButtonSignIn"
import { signOutAction } from "@/app/actions/auth"


export default function MobileNav({ user }) {

    let email = user?.email
    let image = user?.image
    let name = user?.name
    // GitHub users don't always have a display name
    let initial = (name || email || "?").charAt(0).toUpperCase()

    return (
        <NavSheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group">
                    <Menu className="h-6 w-6 text-primary group-hover:text-primary/80 transition-colors" />
                    <span className="sr-only">Toggle navigation menu</span>
                    <span className="absolute inset-x-0 bottom-0 h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-150 ease-in-out" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-4 mb-4">
                        <Smile className="h-6 w-6 text-primary" />
                        {/* SheetTitle gives the dialog its accessible name */}
                        <SheetTitle>Moodify</SheetTitle>
                    </div>
                    {user ? (
                        <>
                            <div className="flex items-center space-x-4">
                                <Avatar>
                                    <AvatarImage src={image} alt="User avatar image" />
                                    <AvatarFallback>{initial}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium">{name}</p>
                                    <p className="text-xs text-muted-foreground">{email}</p>
                                </div>
                            </div>
                            <Link href="/dashboard" className="text-sm font-medium">
                                Dashboard
                            </Link>
                            <form action={signOutAction}>
                                <Button type="submit" className="justify-start">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign Out
                                </Button>
                            </form>
                        </>
                    ) : (
                        <ButtonSignIn compact />
                    )}
                </nav>
            </SheetContent>
        </NavSheet>
    )
}