import type { EventRecord } from './event-data'
import { EmptyState, OutlineButton } from './components'
export default function Rentals({ event }: { event: EventRecord }) { return <EmptyState title="Rentals" description={`Track rental items required for ${event.name}.`} action={<OutlineButton>Add Rental</OutlineButton>} /> }
