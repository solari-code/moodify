import { requireUser } from '@/lib/requireUser'

export default async function Layout({ children }) {

    await requireUser();

    // pt-16: room for the fixed navigation bar
    return (
        <div className="min-h-screen pt-16">
            {children}
        </div>
    )
}
