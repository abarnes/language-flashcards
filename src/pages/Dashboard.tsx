import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Upload, BookOpen, Target, Flame, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useVocabStore } from '@/stores/vocabStore'
import { useProgressMetrics } from '@/hooks/useProgressMetrics'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ListBreakdown } from '@/components/dashboard/ListBreakdown'
import { WeeklyChart } from '@/components/dashboard/WeeklyChart'
import { LearningOverview } from '@/components/dashboard/LearningOverview'
import { ForecastChart } from '@/components/dashboard/ForecastChart'

export function Dashboard() {
  const navigate = useNavigate()
  const { lists, createList } = useVocabStore()
  const metrics = useProgressMetrics()
  const [showNewListDialog, setShowNewListDialog] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [, setRefreshKey] = useState(0)

  // Refresh metrics when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setRefreshKey((k) => k + 1)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const handleCreateList = () => {
    if (newListName.trim()) {
      createList(newListName.trim())
      setNewListName('')
      setShowNewListDialog(false)
    }
  }

  const handleStudyDue = () => {
    navigate('/study?due=true')
  }

  const totalCards = lists.reduce((sum, l) => sum + l.flashcards.length, 0)
  const hasCards = totalCards > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Track your learning progress and review vocabulary
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Image
            </Link>
          </Button>
          <Button onClick={() => setShowNewListDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New List
          </Button>
        </div>
      </div>

      {/* Empty state for new users */}
      {!hasCards ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Welcome to Language Flashcards
            </h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Get started by creating your first vocabulary list or uploading an
              image to extract words from a textbook.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/upload">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </Link>
              </Button>
              <Button onClick={() => setShowNewListDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New List
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatsCard
              title="Due for Review"
              value={metrics.totalDue}
              subtitle={
                metrics.totalDue === 0
                  ? 'All caught up!'
                  : `${metrics.totalDue} card${metrics.totalDue !== 1 ? 's' : ''} waiting`
              }
              icon={Target}
              onClick={metrics.totalDue > 0 ? handleStudyDue : undefined}
              variant={metrics.totalDue === 0 ? 'success' : 'default'}
            />
            <StatsCard
              title="Weekly Accuracy"
              value={
                metrics.weeklyAccuracy !== null
                  ? `${metrics.weeklyAccuracy}%`
                  : '—'
              }
              subtitle={
                metrics.weeklyAccuracy !== null
                  ? `${metrics.weeklyReviews} reviews this week`
                  : 'No reviews yet this week'
              }
              icon={TrendingUp}
            />
            <StatsCard
              title="Study Streak"
              value={
                metrics.currentStreak > 0 ? `${metrics.currentStreak} day${metrics.currentStreak !== 1 ? 's' : ''}` : '0'
              }
              subtitle={
                metrics.currentStreak > 0
                  ? 'Keep it going!'
                  : 'Start studying to build a streak'
              }
              icon={Flame}
              variant={metrics.currentStreak >= 7 ? 'success' : 'default'}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              <ListBreakdown lists={metrics.dueByList} />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <WeeklyChart
                dailyActivity={metrics.dailyActivity}
                weeklyReviews={metrics.weeklyReviews}
                weeklyAccuracy={metrics.weeklyAccuracy}
              />
              <ForecastChart />
              <LearningOverview overview={metrics.learningOverview} />
            </div>
          </div>

        </>
      )}

      {/* New List Dialog */}
      <Dialog open={showNewListDialog} onOpenChange={setShowNewListDialog}>
        <DialogContent onClose={() => setShowNewListDialog(false)}>
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter list name..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewListDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateList} disabled={!newListName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
