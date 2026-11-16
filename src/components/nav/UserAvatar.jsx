import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// The user's GitHub picture, or their initial on a sage background.
export default function UserAvatar({ user, className }) {
    // GitHub users don't always have a display name
    const initial = (user?.name || user?.email || "?").charAt(0).toUpperCase()

    return (
        <Avatar className={className}>
            {user?.image && <AvatarImage src={user.image} alt="" />}
            <AvatarFallback className="bg-secondary font-semibold text-secondary-foreground">
                {initial}
            </AvatarFallback>
        </Avatar>
    )
}
