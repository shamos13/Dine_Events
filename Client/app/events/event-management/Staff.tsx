import type { EventRecord } from './event-data'
import { EmptyState, OutlineButton } from './components'
export default function Staff({ event }: { event: EventRecord }) { return <EmptyState title="Staff" description={`Assign the team supporting ${event.name}.`} action={<OutlineButton>Assign Staff</OutlineButton>} /> }
