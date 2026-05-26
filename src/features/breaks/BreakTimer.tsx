import { useMemo, useState } from 'react'
import { Button, Field } from '@/components/Form'
import type { BreakEventType, BreakLog } from '@/lib/db'

interface BreakTimerProps {
  todayLog: BreakLog | undefined
  onStartDay: (dayType: 'regular' | '10-of-12', callTime: string) => void
  onLogEvent: (type: BreakEventType, note?: string) => void
  onUndo: () => void
}

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function formatMinutes(mins: number): string {
  const h = Math.floor(Math.abs(mins) / 60)
  const m = Math.abs(mins) % 60
  const sign = mins < 0 ? '-' : ''
  return h > 0 ? `${sign}${h}h ${m}m` : `${sign}${m}m`
}

function nowHHMM(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

interface Compliance {
  minutesSinceLastBreak: number
  breakDue: boolean
  breakOverdue: boolean
  mealDue: boolean
  mealOverdue: boolean
  totalWorkMinutes: number
  totalBreakMinutes: number
  maxWorkMinutes: number
  isOnBreak: boolean
  isOnMeal: boolean
  lastEventType: BreakEventType | null
}

function computeCompliance(log: BreakLog): Compliance {
  const now = parseTime(nowHHMM())
  const callMinutes = parseTime(log.callTime)
  const is1012 = log.dayType === '10-of-12'
  const maxWorkMinutes = is1012 ? 600 : 480

  let totalBreakMinutes = 0
  let lastWorkStart = callMinutes
  let longestWorkStretch = 0
  let isOnBreak = false
  let isOnMeal = false
  let lastMealEnd = callMinutes
  let hasMeal = false

  for (const evt of log.events) {
    const t = parseTime(evt.time)
    if (evt.type === 'break-start' || evt.type === 'meal-start') {
      const stretch = t - lastWorkStart
      longestWorkStretch = Math.max(longestWorkStretch, stretch)
      isOnBreak = evt.type === 'break-start'
      isOnMeal = evt.type === 'meal-start'
    } else if (evt.type === 'break-end' || evt.type === 'meal-end') {
      const breakStart = log.events
        .slice(0, log.events.indexOf(evt))
        .reverse()
        .find(
          (e) =>
            e.type === 'break-start' || e.type === 'meal-start',
        )
      if (breakStart) {
        totalBreakMinutes += t - parseTime(breakStart.time)
      }
      lastWorkStart = t
      isOnBreak = false
      isOnMeal = false
      if (evt.type === 'meal-end') {
        lastMealEnd = t
        hasMeal = true
      }
    } else if (evt.type === 'wrap') {
      const stretch = t - lastWorkStart
      longestWorkStretch = Math.max(longestWorkStretch, stretch)
      isOnBreak = false
      isOnMeal = false
    }
  }

  const currentStretch = isOnBreak || isOnMeal ? 0 : now - lastWorkStart
  const minutesSinceLastBreak = Math.max(0, currentStretch)

  const totalElapsed = now - callMinutes
  const totalWorkMinutes = totalElapsed - totalBreakMinutes

  const mealDeadline = (hasMeal ? lastMealEnd : callMinutes) + 300
  const mealDue = !isOnMeal && !hasMeal && now > mealDeadline - 30
  const mealOverdue = !isOnMeal && now > mealDeadline

  return {
    minutesSinceLastBreak,
    breakDue: minutesSinceLastBreak >= 50 && minutesSinceLastBreak < 55,
    breakOverdue: minutesSinceLastBreak >= 55,
    mealDue: mealDue && !mealOverdue,
    mealOverdue,
    totalWorkMinutes,
    totalBreakMinutes,
    maxWorkMinutes,
    isOnBreak,
    isOnMeal,
    lastEventType: log.events.length > 0 ? log.events[log.events.length - 1]!.type : null,
  }
}

export default function BreakTimer({
  todayLog,
  onStartDay,
  onLogEvent,
  onUndo,
}: BreakTimerProps) {
  const [callTime, setCallTime] = useState(nowHHMM())
  const [dayType, setDayType] = useState<'regular' | '10-of-12'>('regular')

  const compliance = useMemo(
    () => (todayLog ? computeCompliance(todayLog) : null),
    [todayLog],
  )

  if (!todayLog) {
    return (
      <div className="space-y-4 rounded-lg border border-surface-border bg-surface-secondary/30 p-6">
        <h3 className="font-display text-xl">Start today's session</h3>
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Call time">
            <input
              type="time"
              value={callTime}
              onChange={(e) => setCallTime(e.target.value)}
              className="rounded border border-surface-border bg-surface px-3 py-2"
            />
          </Field>
          <Field label="Day type">
            <select
              value={dayType}
              onChange={(e) =>
                setDayType(e.target.value as 'regular' | '10-of-12')
              }
              className="rounded border border-surface-border bg-surface px-3 py-2"
            >
              <option value="regular">Regular</option>
              <option value="10-of-12">10-out-of-12</option>
            </select>
          </Field>
          <Button onClick={() => onStartDay(dayType, callTime)}>
            Start day
          </Button>
        </div>
      </div>
    )
  }

  if (!compliance) return null

  const statusColor = compliance.breakOverdue || compliance.mealOverdue
    ? 'text-red-600 dark:text-red-400'
    : compliance.breakDue || compliance.mealDue
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-green-600 dark:text-green-400'

  const statusText = compliance.isOnBreak
    ? '☕ On break'
    : compliance.isOnMeal
      ? '🍽️ On meal'
      : compliance.breakOverdue
        ? '⚠️ BREAK OVERDUE'
        : compliance.mealOverdue
          ? '⚠️ MEAL PENALTY'
          : compliance.breakDue
            ? '⏰ Break due soon'
            : compliance.mealDue
              ? '⏰ Meal due soon'
              : '✓ Compliant'

  return (
    <div className="space-y-6">
      {/* Status panel */}
      <div className="rounded-lg border border-surface-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={`text-2xl font-bold ${statusColor}`}>{statusText}</p>
            <p className="mt-1 text-sm text-muted">
              {todayLog.dayType === '10-of-12' ? '10/12 day' : 'Regular day'} ·
              Called at {todayLog.callTime}
            </p>
          </div>
          <div className="text-right text-sm">
            <p>
              Work: <strong>{formatMinutes(compliance.totalWorkMinutes)}</strong>{' '}
              / {formatMinutes(compliance.maxWorkMinutes)}
            </p>
            <p>
              Break time: <strong>{formatMinutes(compliance.totalBreakMinutes)}</strong>
            </p>
            <p>
              Since last break:{' '}
              <strong className={compliance.breakOverdue ? 'text-red-600 dark:text-red-400' : ''}>
                {formatMinutes(compliance.minutesSinceLastBreak)}
              </strong>
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {!compliance.isOnBreak && !compliance.isOnMeal && (
          <>
            <Button onClick={() => onLogEvent('break-start')}>
              Start break
            </Button>
            <Button variant="secondary" onClick={() => onLogEvent('meal-start')}>
              Start meal
            </Button>
            <Button variant="secondary" onClick={() => onLogEvent('wrap')}>
              Wrap
            </Button>
          </>
        )}
        {compliance.isOnBreak && (
          <Button onClick={() => onLogEvent('break-end')}>End break</Button>
        )}
        {compliance.isOnMeal && (
          <Button onClick={() => onLogEvent('meal-end')}>End meal</Button>
        )}
        {todayLog.events.length > 0 && (
          <Button variant="secondary" onClick={onUndo}>
            Undo last
          </Button>
        )}
      </div>

      {/* Event timeline */}
      {todayLog.events.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted">Today's log</h4>
          <div className="divide-y divide-surface-border rounded border border-surface-border text-sm">
            {todayLog.events.map((evt, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-1.5">
                <span className="w-12 font-mono text-xs">{evt.time}</span>
                <span className={eventBadgeClass(evt.type)}>
                  {eventLabel(evt.type)}
                </span>
                {evt.note && (
                  <span className="text-xs text-muted">{evt.note}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function eventLabel(type: BreakEventType): string {
  switch (type) {
    case 'break-start': return 'Break ▶'
    case 'break-end': return 'Break ■'
    case 'meal-start': return 'Meal ▶'
    case 'meal-end': return 'Meal ■'
    case 'wrap': return 'Wrap'
  }
}

function eventBadgeClass(type: BreakEventType): string {
  const base = 'rounded px-2 py-0.5 text-xs font-medium'
  switch (type) {
    case 'break-start':
    case 'break-end':
      return `${base} bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300`
    case 'meal-start':
    case 'meal-end':
      return `${base} bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300`
    case 'wrap':
      return `${base} bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300`
  }
}
