import alluraUrl from '@fontsource/allura/files/allura-latin-400-normal.woff?url'
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import type { Contact, DailyCall, Production } from '@/lib/db'
import type { PaperSize } from '@/lib/settings'

// Register the script title font once on module load. The dynamic import path
// for this module is the existing PDF download flow, so this only runs the
// first time a daily call PDF is generated.
Font.register({
  family: 'Allura',
  src: alluraUrl,
})

// Stable red used for accents (call times, called-cast, notes, footer).
const STAGE_RED = '#b91c1c'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Times-Roman',
    fontSize: 11,
    paddingHorizontal: 54,
    paddingVertical: 54,
    lineHeight: 1.4,
  },
  version: {
    position: 'absolute',
    top: 24,
    right: 36,
    fontSize: 8,
    color: '#666',
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Allura',
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 4,
    // Allura sits high on its baseline, so a slight bump helps optical balance.
    paddingTop: 4,
    paddingBottom: 6,
  },
  subhead: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Times-Roman',
  },
  subheadSmall: {
    textAlign: 'center',
    fontSize: 11,
    marginBottom: 2,
  },
  notesHeader: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Times-Bold',
    marginTop: 6,
    marginBottom: 2,
    letterSpacing: 1,
  },
  note: {
    textAlign: 'center',
    fontSize: 10,
    color: STAGE_RED,
    marginBottom: 1,
  },
  hr: {
    marginVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#000',
  },
  sectionHeader: {
    textAlign: 'center',
    fontFamily: 'Times-Roman',
    fontSize: 14,
    letterSpacing: 2,
    marginBottom: 10,
  },
  callTimeGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    columnGap: 36,
    marginBottom: 24,
  },
  callTimeColumn: {
    flexDirection: 'column',
  },
  callTimeRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  callTimeTime: {
    color: STAGE_RED,
    marginRight: 6,
    width: 40,
  },
  callTimeName: {
    fontFamily: 'Times-Roman',
  },
  scheduleItem: {
    marginBottom: 14,
  },
  scheduleHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  scheduleTime: {
    width: 70,
    fontFamily: 'Times-Roman',
  },
  scheduleActivity: {
    flex: 1,
    fontFamily: 'Times-Roman',
  },
  scheduleDescription: {
    marginLeft: 70,
    fontFamily: 'Times-Roman',
  },
  scheduleCalled: {
    marginLeft: 70,
    color: STAGE_RED,
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 36,
    left: 54,
    right: 54,
    fontSize: 10,
    color: STAGE_RED,
    textAlign: 'center',
  },
})

function abbreviateName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length < 2) return name
  const first = parts[0]!
  const last = parts[parts.length - 1]!
  return `${first[0]}. ${last}`
}

function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

interface Props {
  production: Production
  call: DailyCall
  contacts: Contact[]
  paperSize?: PaperSize
}

export default function DailyCallPdf({
  production,
  call,
  contacts,
  paperSize = 'LETTER',
}: Props) {
  // Stable lookup for name rendering.
  const nameOf = (id: number): string =>
    contacts.find((c) => c.id === id)?.name ?? '(removed)'

  // Split the call-times list into two roughly-equal columns to match
  // Rayne's reference PDF.
  const half = Math.ceil(call.callTimes.length / 2)
  const leftColumn = call.callTimes.slice(0, half)
  const rightColumn = call.callTimes.slice(half)

  // Render the red "called" line under each schedule item.
  function calledText(
    item: DailyCall['scheduleItems'][number],
  ): string | null {
    switch (item.calledMode) {
      case 'all':
        return 'All called'
      case 'company':
        return 'Full company'
      case 'specific': {
        if (item.calledContactIds.length === 0) return null
        const names = item.calledContactIds
          .map((id) => abbreviateName(nameOf(id)))
          .filter((n) => n !== '(removed)')
        return names.join(', ')
      }
      case 'custom':
        return item.customLabel?.trim() || null
    }
  }

  return (
    <Document
      title={`${production.name} — Daily Call ${call.date} v${call.version}`}
      author="Standby"
    >
      <Page size={paperSize} style={styles.page}>
        <Text style={styles.version} fixed>
          Version {call.version}.0
        </Text>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>{production.name}</Text>
        </View>
        <Text style={styles.subhead}>Daily Call</Text>
        <Text style={styles.subheadSmall}>
          {formatLongDate(call.date)}, {call.location}
        </Text>

        {call.notes.length > 0 && (
          <>
            <Text style={styles.notesHeader}>NOTES</Text>
            {call.notes.map((n, i) => (
              <Text key={i} style={styles.note}>
                {i + 1}. {n.text}
              </Text>
            ))}
          </>
        )}

        <View style={styles.hr} />

        <Text style={styles.sectionHeader}>CALL TIME</Text>

        <View style={styles.callTimeGrid}>
          <View style={styles.callTimeColumn}>
            {leftColumn.map((ct, i) => (
              <View key={i} style={styles.callTimeRow}>
                <Text style={styles.callTimeTime}>{ct.time}</Text>
                <Text style={styles.callTimeName}>{nameOf(ct.contactId)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.callTimeColumn}>
            {rightColumn.map((ct, i) => (
              <View key={i} style={styles.callTimeRow}>
                <Text style={styles.callTimeTime}>{ct.time}</Text>
                <Text style={styles.callTimeName}>{nameOf(ct.contactId)}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionHeader}>REHEARSAL SCHEDULE</Text>

        {call.scheduleItems.map((item, i) => {
          const called = calledText(item)
          return (
            <View key={i} style={styles.scheduleItem} wrap={false}>
              <View style={styles.scheduleHead}>
                <Text style={styles.scheduleTime}>{item.time}</Text>
                <Text style={styles.scheduleActivity}>{item.activity}</Text>
              </View>
              {item.description && (
                <Text style={styles.scheduleDescription}>
                  {item.description}
                </Text>
              )}
              {called && <Text style={styles.scheduleCalled}>{called}</Text>}
            </View>
          )
        })}

        <Text style={styles.footer} fixed>
          Subject to Change
        </Text>
      </Page>
    </Document>
  )
}
