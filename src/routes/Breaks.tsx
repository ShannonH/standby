import { useState } from 'react'
import { Button } from '@/components/Form'
import RequiresProduction from '@/components/RequiresProduction'
import BreakTimer from '@/features/breaks/BreakTimer'
import BreakHistory from '@/features/breaks/BreakHistory'
import {
  db,
  type BreakEvent,
  type BreakEventType,
  type BreakLog,
} from '@/lib/db'
import {
  useBreakLogs,
  useCurrentProduction,
  useTodayBreakLog,
} from '@/lib/hooks'

export default function BreaksRoute() {
  return (
    <RequiresProduction>
      <BreaksInner />
    </RequiresProduction>
  )
}

function BreaksInner() {
  const production = useCurrentProduction()
  const productionId = production?.id ?? null
  const todayLog = useTodayBreakLog(productionId)
  const allLogs = useBreakLogs(productionId)
  const [showHistory, setShowHistory] = useState(false)

  if (!production?.id) return null

  const today = new Date().toISOString().slice(0, 10)

  async function startDay(dayType: 'regular' | '10-of-12', callTime: string) {
    if (!production?.id) return
    const newLog: Omit<BreakLog, 'id'> = {
      productionId: production.id,
      date: today,
      dayType,
      callTime,
      events: [],
    }
    await db.breakLogs.add(newLog as BreakLog)
  }

  async function logEvent(type: BreakEventType, note?: string) {
    if (!todayLog?.id) return
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const newEvent: BreakEvent = { type, time, note }
    const updatedEvents = [...todayLog.events, newEvent]
    await db.breakLogs.update(todayLog.id, { events: updatedEvents })
  }

  async function undoLastEvent() {
    if (!todayLog?.id || todayLog.events.length === 0) return
    const updatedEvents = todayLog.events.slice(0, -1)
    await db.breakLogs.update(todayLog.id, { events: updatedEvents })
  }

  async function deleteLog(id: number) {
    await db.breakLogs.delete(id)
  }

  return (
    <section className="mx-auto max-w-4xl space-y-8">
      <header>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl">Breaks</h2>
            <p className="mt-1 text-sm text-muted">
              For <span className="font-medium">{production.name}</span>. AEA
              break timer — tracks 5-after-55, meal penalty, and 10/12 hour
              limits.
            </p>
          </div>
          {allLogs.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => setShowHistory((v) => !v)}
            >
              {showHistory ? 'Hide history' : 'History'}
            </Button>
          )}
        </div>
      </header>

      <BreakTimer
        todayLog={todayLog}
        onStartDay={startDay}
        onLogEvent={logEvent}
        onUndo={undoLastEvent}
      />

      {showHistory && (
        <BreakHistory logs={allLogs} onDelete={deleteLog} />
      )}
    </section>
  )
}
