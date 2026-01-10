import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface LearningOverviewProps {
  overview: {
    new: number
    learning: number
    mature: number
  }
}

export function LearningOverview({ overview }: LearningOverviewProps) {
  const total = overview.new + overview.learning + overview.mature

  if (total === 0) {
    return null
  }

  const segments = [
    {
      label: 'New',
      count: overview.new,
      color: 'bg-blue-500',
      description: 'Never reviewed',
    },
    {
      label: 'Learning',
      count: overview.learning,
      color: 'bg-orange-500',
      description: 'Interval < 21 days',
    },
    {
      label: 'Mature',
      count: overview.mature,
      color: 'bg-green-500',
      description: 'Interval ≥ 21 days',
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Learning Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="h-3 rounded-full overflow-hidden flex bg-muted mb-4">
          {segments.map((segment) => {
            const percentage = (segment.count / total) * 100
            if (percentage === 0) return null
            return (
              <div
                key={segment.label}
                className={`${segment.color} transition-all`}
                style={{ width: `${percentage}%` }}
              />
            )
          })}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-4">
          {segments.map((segment) => (
            <div key={segment.label} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className={`w-3 h-3 rounded-full ${segment.color}`} />
                <span className="text-sm font-medium">{segment.label}</span>
              </div>
              <p className="text-2xl font-bold">{segment.count}</p>
              <p className="text-xs text-muted-foreground">
                {segment.description}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
