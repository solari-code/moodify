import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import SignOutMenuItem from "./SignOutMenuItem"

export default function UserMenu({ user }) {

    let email = user?.email
    let image = user?.image
    let name = user?.name
    // GitHub users don't always have a display name
    let initial = (name || email || "?").charAt(0).toUpperCase()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                    <AvatarImage src={image} alt="Avatar image" />
                    <AvatarFallback>{initial}</AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" >
                <DropdownMenuLabel>{name || email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <SignOutMenuItem />
            </DropdownMenuContent>
        </DropdownMenu>
    )
}