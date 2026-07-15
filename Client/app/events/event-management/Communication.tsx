import type { EventRecord } from './event-data'
import { EmptyState, OutlineButton } from './components'
export default function Communication({ event }: { event: EventRecord }) { return <EmptyState title="Communication" description={`Keep client correspondence for ${event.name} in one place.`} action={<OutlineButton>New Message</OutlineButton>} /> }
