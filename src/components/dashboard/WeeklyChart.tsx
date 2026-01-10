import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DailyStats } from '@/types'

interface WeeklyChartProps {
  dailyActivity: DailyStats[]
  weeklyReviews: number
  weeklyAccuracy: number | null
}

export function WeeklyChart({
  dailyActivity,
  weeklyReviews,
  weeklyAccuracy,
}: WeeklyChartProps) {
  // Find max reviews for scaling bars
  const maxReviews = Math.max(...dailyActivity.map((d) => d.reviews), 1)

  // Get day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">This Week</CardTitle>
          <div className="text-right">
            <p className="text-2xl font-bold">{weeklyReviews}</p>
            <p className="text-sm text-muted-foreground">
              reviews{' '}
              {weeklyAccuracy !== null && (
                <span className="text-primary">({weeklyAccuracy}% correct)</span>
              )}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2 h-24">
          {dailyActivity.map((day) => {
            const date = new Date(day.date)
            const dayName = dayNames[date.getDay()]
            const isToday =
              day.date === new Date().toISOString().split('T')[0]
            const height =
              day.reviews > 0 ? (day.reviews / maxReviews) * 100 : 4

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
                      isToday
                        ? 'bg-primary'
                        : day.reviews > 0
                          ? 'bg-primary/60'
                          : 'bg-muted'
                    }`}
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  />
                  {day.reviews > 0 && (
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md whitespace-nowrap z-10">
                      {day.reviews} reviews
                      {day.correct > 0 && (
                        <span className="text-muted-foreground">
                          {' '}
                          ({Math.round((day.correct / day.reviews) * 100)}%)
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <span
                  className={`text-xs ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}
                >
                  {dayName}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
