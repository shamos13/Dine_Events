import type { EventRecord } from './event-data'
import { EmptyState, OutlineButton } from './components'
export default function Files({ event }: { event: EventRecord }) { return <EmptyState title="Files" description={`Store contracts, briefs, and attachments for ${event.name}.`} action={<OutlineButton>Upload File</OutlineButton>} /> }
