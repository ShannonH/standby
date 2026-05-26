import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import type { BlockingEntry, Contact, Production } from '@/lib/db'
import type { PaperSize } from '@/lib/settings'

interface BlockingPdfProps {
  production: Production
  entries: BlockingEntry[]
  contacts: Contact[]
  paperSize: PaperSize
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica' },
  header: { marginBottom: 16 },
  title: { fontSize: 16, fontWeight: 'bold', fontFamily: 'Helvetica-Bold' },
  subtitle: { fontSize: 10, color: '#666', marginTop: 2 },
  entry: { marginBottom: 12, borderBottom: '0.5pt solid #ccc', paddingBottom: 8 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  page_label: { fontSize: 11, fontWeight: 'bold', fontFamily: 'Helvetica-Bold' },
  scene: { fontSize: 9, color: '#666' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginTop: 4 },
  zone: {
    width: '32%',
    border: '0.5pt solid #999',
    padding: 4,
    minHeight: 28,
    textAlign: 'center',
  },
  zoneLabel: { fontSize: 7, color: '#999', marginBottom: 2 },
  actorName: { fontSize: 8 },
  notes: { fontSize: 8, color: '#444', marginTop: 4, fontStyle: 'italic' },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 7,
    color: '#999',
    textAlign: 'center',
  },
})

const ZONE_ORDER = ['USR', 'USC', 'USL', 'SR', 'C', 'SL', 'DSR', 'DSC', 'DSL'] as const

export default function BlockingPdf({
  production,
  entries,
  contacts,
  paperSize,
}: BlockingPdfProps) {
  const pageSize = paperSize === 'A4' ? 'A4' : 'LETTER'

  function getActorName(contactId: number): string {
    const c = contacts.find((c) => c.id === contactId)
    return c?.name ?? `#${contactId}`
  }

  return (
    <Document>
      <Page size={pageSize} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{production.name} — Blocking</Text>
          <Text style={styles.subtitle}>
            {entries.length} page{entries.length !== 1 ? 's' : ''} recorded
          </Text>
        </View>

        {entries.map((entry) => (
          <View key={entry.id ?? entry.sequence} style={styles.entry} wrap={false}>
            <View style={styles.entryHeader}>
              <Text style={styles.page_label}>Page {entry.page || '?'}</Text>
              {entry.sceneLabel && (
                <Text style={styles.scene}>{entry.sceneLabel}</Text>
              )}
            </View>
            <View style={styles.grid}>
              {ZONE_ORDER.map((zone) => {
                const actors = entry.positions.filter((p) => p.zone === zone)
                return (
                  <View key={zone} style={styles.zone}>
                    <Text style={styles.zoneLabel}>{zone}</Text>
                    {actors.map((a) => (
                      <Text key={a.contactId} style={styles.actorName}>
                        {getActorName(a.contactId)}
                      </Text>
                    ))}
                  </View>
                )
              })}
            </View>
            {entry.notes && <Text style={styles.notes}>{entry.notes}</Text>}
          </View>
        ))}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${production.name} — Blocking — Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  )
}
