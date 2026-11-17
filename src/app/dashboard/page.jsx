import ClientWrapper from './clientWrapper';
import { getHabits } from '@/app/actions/habits'
import { getEntries } from '@/app/actions/entries'
import { requireUser } from '@/lib/requireUser'
import { isLocalMode } from '@/lib/mode'
import { getTranslations } from '@/i18n/server'

export async function generateMetadata() {
    const t = await getTranslations("metadata.dashboard");
    return { title: t("title") };
}

export default async function Dashboard() {

    const user = await requireUser();
    const [habits, entries] = await Promise.all([getHabits(), getEntries()]);

    return (<ClientWrapper habits={habits} entries={entries} userName={user.name ?? ""} localMode={isLocalMode()} />)
}
