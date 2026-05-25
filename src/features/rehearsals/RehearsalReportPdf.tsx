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
  type RehearsalReport,
} from '@/lib/db'
import { NOTE_DEPT_LABELS } from '@/lib/schemas'
import type { PaperSize } from '@/lib/settings'

// Stern/Gold-conformant rehearsal report layout — letter paper, Times-Roman.
// Departmental notes numbered per-section so designers can reply
// "Re: Costumes #3, yes."

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
  attendanceRow: {
    flexDirection: 'row',
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5e5',
  },
  attendanceName: {
    flex: 1,
    fontFamily: 'Times-Bold',
  },
  attendanceStatus: {
    width: 80,
  },
  timeBlockRow: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  timeCell: {
    width: 80,
    fontFamily: 'Times-Bold',
  },
  activityCell: {
    flex: 1,
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

const STATUS_LABELS: Record<string, string> = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
  excused: 'Excused',
}

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

interface Props {
  production: Production
  report: RehearsalReport
  contacts: Contact[]
  paperSize?: PaperSize
}

export default function RehearsalReportPdf({
  production,
  report,
  contacts,
  paperSize = 'LETTER',
}: Props) {
  const contactName = (id: number) =>
    contacts.find((c) => c.id === id)?.name ?? '(removed)'

  const hasAnyNotes = NOTE_DEPT_KEYS.some(
    (key) => (report.notes[key]?.length ?? 0) > 0,
  )

  return (
    <Document
      title={`${production.name} — Rehearsal Report Day ${report.dayNumber}`}
      author="Standby"
    >
      <Page size={paperSize} style={styles.page}>
        <Text style={styles.title}>{production.name}</Text>
        <Text style={styles.subtitle}>
          Rehearsal Report · Day {report.dayNumber} · {formatDate(report.date)}
        </Text>

        <View style={styles.headerGrid}>
          <View style={styles.headerItem}>
            <Text style={styles.headerLabel}>Time</Text>
            <Text style={styles.headerValue}>
              {report.startTime}–{report.endTime}
            </Text>
          </View>
          {report.location && (
            <View style={styles.headerItem}>
              <Text style={styles.headerLabel}>Location</Text>
              <Text style={styles.headerValue}>{report.location}</Text>
            </View>
          )}
          <View style={styles.headerItem}>
            <Text style={styles.headerLabel}>Stage Manager</Text>
            <Text style={styles.headerValue}>—</Text>
          </View>
        </View>

        {report.attendance.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Attendance</Text>
            {report.attendance.map((a, i) => (
              <View key={i} style={styles.attendanceRow}>
                <Text style={styles.attendanceName}>
                  {contactName(a.contactId)}
                </Text>
                <Text style={styles.attendanceStatus}>
                  {STATUS_LABELS[a.status]}
                  {a.status === 'late' && a.minutesLate
                    ? ` (${a.minutesLate} min)`
                    : ''}
                </Text>
              </View>
            ))}
          </>
        )}

        {report.timeBlocks.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Time Breakdown</Text>
            {report.timeBlocks.map((tb, i) => (
              <View key={i} style={styles.timeBlockRow}>
                <Text style={styles.timeCell}>
                  {tb.start}–{tb.end}
                </Text>
                <Text style={styles.activityCell}>{tb.activity}</Text>
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
          {production.name} · Rehearsal Report Day {report.dayNumber} ·
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
