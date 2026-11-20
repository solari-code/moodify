import { requireUser } from '@/lib/requireUser'
import DashboardAppearance from '@/components/appearance/DashboardAppearance'

export default async function Layout({ children }) {

    await requireUser();

    // pt-16: room for the fixed navigation bar
    // DashboardAppearance: the user's theme and color mode, only in the dashboard
    return (
        <div className="min-h-screen pt-16">
            <DashboardAppearance />
            {children}
        </div>
    )
}
