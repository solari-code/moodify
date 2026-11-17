import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import UserAvatar from "./UserAvatar"
import SignOutMenuItem from "./SignOutMenuItem"
import { getTranslations } from "@/i18n/server"

export default async function UserMenu({ user }) {

    const t = await getTranslations("nav")
    const name = user?.name
    const email = user?.email

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {/* a real button, so the menu can be opened with the keyboard */}
                <button
                    type="button"
                    aria-label={t("openUserMenu")}
                    className="rounded-full ring-offset-background transition-shadow hover:ring-2 hover:ring-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    <UserAvatar user={user} className="h-9 w-9" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[12rem]">
                <DropdownMenuLabel className="font-normal">
                    {name && <p className="text-sm font-medium leading-tight">{name}</p>}
                    {email && <p className="text-xs leading-tight text-muted-foreground">{email}</p>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <SignOutMenuItem />
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
