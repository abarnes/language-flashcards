import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useVocabStore } from '@/stores/vocabStore'
import { useMemo } from 'react'

export function ForecastChart() {
  const lists = useVocabStore((state) => state.lists)

  const forecast = useMemo(() => {
    const allCards = lists.flatMap((l) => l.flashcards)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const days: Array<{
      date: string
      dayName: string
      count: number
      isToday: boolean
      isOverdue: boolean
    }> = []

    // Calculate overdue (cards due before today)
    let overdueCount = 0
    for (const card of allCards) {
      const normalDue = card.srsNormal?.dueDate
      const reverseDue = card.srsReverse?.dueDate
      const earliestDue = Math.min(
        normalDue ?? Infinity,
        reverseDue ?? Infinity
      )
      if (earliestDue !== Infinity && earliestDue < today.getTime()) {
        overdueCount++
      }
    }

    // Add overdue as first entry if any
    if (overdueCount > 0) {
      days.push({
        date: 'overdue',
        dayName: 'Overdue',
        count: overdueCount,
        isToday: false,
        isOverdue: true,
      })
    }

    // Calculate next 7 days
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      const dayStart = date.getTime()
      const dayEnd = dayStart + 24 * 60 * 60 * 1000

      let count = 0
      for (const card of allCards) {
        const normalDue = card.srsNormal?.dueDate
        const reverseDue = card.srsReverse?.dueDate

        // Check if card is due on this specific day
        // A card is new (never reviewed) if neither has a dueDate
        const isNew = !normalDue && !reverseDue

        if (isNew && i === 0) {
          // New cards count as due today
          count++
        } else {
          // Check if the earliest due date falls on this day
          const earliestDue = Math.min(
            normalDue ?? Infinity,
            reverseDue ?? Infinity
          )
          if (earliestDue >= dayStart && earliestDue < dayEnd) {
            count++
          }
        }
      }

      days.push({
        date: date.toISOString().split('T')[0],
        dayName: i === 0 ? 'Today' : dayNames[date.getDay()],
        count,
        isToday: i === 0,
        isOverdue: false,
      })
    }

    return days
  }, [lists])

  const maxCount = Math.max(...forecast.map((d) => d.count), 1)
  const totalUpcoming = forecast.reduce((sum, d) => sum + d.count, 0)

  if (totalUpcoming === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Upcoming Reviews</CardTitle>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Next 7 days</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-1 h-24">
          {forecast.map((day) => {
            const height = day.count > 0 ? (day.count / maxCount) * 100 : 4

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div
                  className="relative w-full group"
                  style={{ height: '80px' }}
                >
                  <div
                    className={`absolute bottom-0 w-full rounded-t transition-all ${
                      day.isOverdue
                        ? 'bg-red-500'
                        : day.isToday
                          ? 'bg-primary'
                          : day.count > 0
                            ? 'bg-primary/40'
                            : 'bg-muted'
                    }`}
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  />
                  {day.count > 0 && (
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md whitespace-nowrap z-10">
                      {day.count} card{day.count !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <span
                  className={`text-xs truncate w-full text-center ${
                    day.isOverdue
                      ? 'text-red-500 font-medium'
                      : day.isToday
                        ? 'font-bold text-primary'
                        : 'text-muted-foreground'
                  }`}
                >
                  {day.dayName}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
