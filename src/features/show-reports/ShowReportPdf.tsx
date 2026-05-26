import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import {
  NOTE_DEPT_KEYS,
  type Contact,
  type NoteDeptKey,
  type Production,
  type ShowReport,
} from '@/lib/db'
import { INCIDENT_KIND_LABELS, NOTE_DEPT_LABELS } from '@/lib/schemas'
import type { PaperSize, TimeFormat } from '@/lib/settings'
import { formatTime } from '@/lib/time-format'

// Stern/Gold-conformant show report layout. Letter paper, Times-Roman. The
// section order matches the way producers / artistic directors read these:
// header → run times → holds → incidents → understudies → dept notes.

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Times-Roman',
    fontSize: 10,
    paddingHorizontal: 54,
    paddingVertical: 54,
    lineHeight: 1.4,
  },
  title: {
    fontFamily: 'Times-Bold',
    fontSize: 16,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    color: '#555',
    marginBottom: 14,
  },
  headerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  headerItem: {
    width: '33%',
    marginBottom: 4,
  },
  headerLabel: {
    fontSize: 8,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerValue: {
    fontFamily: 'Times-Bold',
    fontSize: 11,
  },
  sectionHeader: {
    fontFamily: 'Times-Bold',
    fontSize: 12,
    marginTop: 12,
    marginBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#666',
    paddingBottom: 2,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5e5',
  },
  rowLabel: {
    flex: 1,
    fontFamily: 'Times-Bold',
  },
  rowTime: {
    width: 140,
  },
  rowDuration: {
    width: 60,
    textAlign: 'right',
  },
  twoCol: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  whenCell: {
    width: 120,
    fontFamily: 'Times-Bold',
  },
  minCell: {
    width: 60,
    color: '#555',
  },
  reasonCell: {
    flex: 1,
  },
  incidentRow: {
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5e5',
  },
  incidentKind: {
    fontFamily: 'Times-Bold',
    fontSize: 10,
    marginBottom: 1,
  },
  incidentBody: {
    fontSize: 10,
  },
  understudyRow: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  understudyName: {
    width: 140,
    fontFamily: 'Times-Bold',
  },
  understudyRole: {
    width: 140,
  },
  understudyReason: {
    flex: 1,
    color: '#555',
  },
  deptSection: {
    marginTop: 8,
  },
  deptHeader: {
    fontFamily: 'Times-Bold',
    fontSize: 11,
    marginBottom: 2,
  },
  noteRow: {
    flexDirection: 'row',
    marginBottom: 2,
    marginLeft: 8,
  },
  noteNumber: {
    width: 22,
    color: '#666',
  },
  noteText: {
    flex: 1,
  },
  totalRun: {
    marginTop: 6,
    fontSize: 10,
    fontFamily: 'Times-Bold',
  },
  footer: {
    position: 'absolute',
    bottom: 36,
    left: 54,
    right: 54,
    fontSize: 8,
    color: '#888',
    textAlign: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#bbb',
    paddingTop: 6,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 24,
    right: 54,
    fontSize: 8,
    color: '#888',
  },
})

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

const DEPT_LABEL_MAP: Record<NoteDeptKey, string> = Object.fromEntries(
  NOTE_DEPT_LABELS.map((d) => [d.key, d.label]),
) as Record<NoteDeptKey, string>

/** Minutes between two HH:MM times. Returns null if either is missing or
 *  unparseable, or if end is before start (we don't handle crossing midnight
 *  — performances never run that long). */
function durationMinutes(start: string, end: string): number | null {
  const a = start.match(/^(\d{1,2}):(\d{2})$/)
  const b = end.match(/^(\d{1,2}):(\d{2})$/)
  if (!a || !b) return null
  const sm = parseInt(a[1]!, 10) * 60 + parseInt(a[2]!, 10)
  const em = parseInt(b[1]!, 10) * 60 + parseInt(b[2]!, 10)
  if (em < sm) return null
  return em - sm
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  return `${h}h ${String(m).padStart(2, '0')}m`
}

interface Props {
  production: Production
  report: ShowReport
  contacts: Contact[]
  paperSize?: PaperSize
  timeFormat?: TimeFormat
}

export default function ShowReportPdf({
  production,
  report,
  contacts,
  paperSize = 'LETTER',
  timeFormat = '12h',
}: Props) {
  const contactName = (id: number) =>
    contacts.find((c) => c.id === id)?.name ?? '(removed)'

  const hasAnyNotes = NOTE_DEPT_KEYS.some(
    (key) => (report.notes[key]?.length ?? 0) > 0,
  )

  const actDurations = report.acts.map((a) => durationMinutes(a.start, a.end))
  const intermissionDurations = report.intermissions.map((i) =>
    durationMinutes(i.start, i.end),
  )
  const sumDurations = (xs: (number | null)[]): number =>
    xs.reduce<number>((s, m) => (m === null ? s : s + m), 0)
  const actTotal = sumDurations(actDurations)
  const intermissionTotal = sumDurations(intermissionDurations)
  const showAnyTotals = actDurations.some((d) => d !== null)

  return (
    <Document
      title={`${production.name} — Show Report ${report.performanceLabel}`}
      author="Standby"
    >
      <Page size={paperSize} style={styles.page}>
        <Text style={styles.title}>{production.name}</Text>
        <Text style={styles.subtitle}>
          Show Report · {report.performanceLabel} · {formatDate(report.date)}
        </Text>

        <View style={styles.headerGrid}>
          <View style={styles.headerItem}>
            <Text style={styles.headerLabel}>Performance #</Text>
            <Text style={styles.headerValue}>{report.performanceNumber}</Text>
          </View>
          <View style={styles.headerItem}>
            <Text style={styles.headerLabel}>Curtain</Text>
            <Text style={styles.headerValue}>
              {formatTime(report.curtainUp, timeFormat)}
              {report.curtainDown
                ? `–${formatTime(report.curtainDown, timeFormat)}`
                : ''}
            </Text>
          </View>
          {report.location && (
            <View style={styles.headerItem}>
              <Text style={styles.headerLabel}>Location</Text>
              <Text style={styles.headerValue}>{report.location}</Text>
            </View>
          )}
          {typeof report.houseCount === 'number' && (
            <View style={styles.headerItem}>
              <Text style={styles.headerLabel}>House</Text>
              <Text style={styles.headerValue}>{report.houseCount}</Text>
            </View>
          )}
          {typeof report.lateSeating === 'number' && (
            <View style={styles.headerItem}>
              <Text style={styles.headerLabel}>Late seating</Text>
              <Text style={styles.headerValue}>{report.lateSeating}</Text>
            </View>
          )}
        </View>

        {report.acts.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Run Times</Text>
            {report.acts.map((a, i) => {
              const d = actDurations[i]
              return (
                <View key={`a${i}`} style={styles.row}>
                  <Text style={styles.rowLabel}>{a.label}</Text>
                  <Text style={styles.rowTime}>
                    {formatTime(a.start, timeFormat)}–
                    {formatTime(a.end, timeFormat)}
                  </Text>
                  <Text style={styles.rowDuration}>
                    {d === null ? '' : formatMinutes(d)}
                  </Text>
                </View>
              )
            })}
            {report.intermissions.map((it, i) => {
              const d = intermissionDurations[i]
              return (
                <View key={`i${i}`} style={styles.row}>
                  <Text style={styles.rowLabel}>
                    {it.label || `Intermission ${i + 1}`}
                  </Text>
                  <Text style={styles.rowTime}>
                    {formatTime(it.start, timeFormat)}–
                    {formatTime(it.end, timeFormat)}
                  </Text>
                  <Text style={styles.rowDuration}>
                    {d === null ? '' : formatMinutes(d)}
                  </Text>
                </View>
              )
            })}
            {showAnyTotals && (
              <Text style={styles.totalRun}>
                Total acts: {formatMinutes(actTotal)}
                {intermissionTotal > 0
                  ? ` · With intermission: ${formatMinutes(actTotal + intermissionTotal)}`
                  : ''}
              </Text>
            )}
          </>
        )}

        {report.holds.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Holds</Text>
            {report.holds.map((h, i) => (
              <View key={i} style={styles.twoCol}>
                <Text style={styles.whenCell}>{h.when}</Text>
                <Text style={styles.minCell}>{h.durationMinutes}m</Text>
                <Text style={styles.reasonCell}>{h.reason}</Text>
              </View>
            ))}
          </>
        )}

        {report.incidents.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Incidents</Text>
            {report.incidents.map((inc, i) => (
              <View key={i} style={styles.incidentRow}>
                <Text style={styles.incidentKind}>
                  {INCIDENT_KIND_LABELS[inc.kind]}
                </Text>
                <Text style={styles.incidentBody}>{inc.description}</Text>
              </View>
            ))}
          </>
        )}

        {report.understudyChanges.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>
              Understudy / Swing Changes
            </Text>
            {report.understudyChanges.map((u, i) => (
              <View key={i} style={styles.understudyRow}>
                <Text style={styles.understudyName}>
                  {contactName(u.contactId)}
                </Text>
                <Text style={styles.understudyRole}>{u.role}</Text>
                <Text style={styles.understudyReason}>{u.reason ?? ''}</Text>
              </View>
            ))}
          </>
        )}

        {hasAnyNotes && (
          <>
            <Text style={styles.sectionHeader}>Departmental Notes</Text>
            {NOTE_DEPT_KEYS.map((key) => {
              const list = report.notes[key]
              if (!list || list.length === 0) return null
              return (
                <View key={key} style={styles.deptSection} wrap={false}>
                  <Text style={styles.deptHeader}>{DEPT_LABEL_MAP[key]}</Text>
                  {list.map((n, i) => (
                    <View key={i} style={styles.noteRow}>
                      <Text style={styles.noteNumber}>#{i + 1}</Text>
                      <Text style={styles.noteText}>{n.text}</Text>
                    </View>
                  ))}
                </View>
              )
            })}
          </>
        )}

        <Text style={styles.footer} fixed>
          {production.name} · {report.performanceLabel} ·
          Generated by Standby
        </Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  )
}
