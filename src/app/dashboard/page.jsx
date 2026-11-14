
import ClientWrapper from './clientWrapper';
import { getHabits } from '@/app/actions/habits'

export default async function Dashboard() {

    const { habits } = await getHabits() || [];
    console.log('HABIT!S:', habits)

    return (< ClientWrapper habits={habits} />)
}