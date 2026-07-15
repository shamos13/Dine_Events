import type { EventRecord } from './event-data'
import { EmptyState, OutlineButton } from './components'
export default function Notes({ event }: { event: EventRecord }) { return <EmptyState title="Notes" description={`Capture planning notes for ${event.name}.`} action={<OutlineButton>Add Note</OutlineButton>} /> }
