import { auth } from '@/../auth'
import { redirect } from 'next/navigation';

export default async function Layout({ children }) {

    const session = await auth();

    if (!session || !session.user?.id) return redirect('/api/auth/signin')
    return (
        <div
            className="items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]"
        >
            {children}
        </div>
    )
}