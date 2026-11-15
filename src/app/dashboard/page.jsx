
import ClientWrapper from './clientWrapper';
import { getHabits } from '@/app/actions/habits'
import { getEntries } from '@/app/actions/entries'
import { requireUser } from '@/lib/requireUser'
import { isLocalMode } from '@/lib/mode'

export const metadata = {
    title: "Dashboard",
};

export default async function Dashboard() {

    await requireUser();
    const [habits, entries] = await Promise.all([getHabits(), getEntries()]);

    return (< ClientWrapper habits={habits} entries={entries} localMode={isLocalMode()} />)
}
