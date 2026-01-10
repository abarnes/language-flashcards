import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'

interface ListBreakdownProps {
  lists: Array<{
    listId: string
    listName: string
    dueCount: number
    totalCards: number
  }>
}

export function ListBreakdown({ lists }: ListBreakdownProps) {
  if (lists.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Due by List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No vocabulary lists yet</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link to="/upload">Add your first list</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Sort lists by due count (highest first)
  const sortedLists = [...lists].sort((a, b) => b.dueCount - a.dueCount)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Due by List</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {sortedLists.map((list) => (
            <div
              key={list.listId}
              className="flex items-center justify-between px-6 py-3 hover:bg-muted/50"
            >
              <div className="flex-1 min-w-0">
                <Link
                  to={`/list/${list.listId}`}
                  className="font-medium hover:underline truncate block"
                >
                  {list.listName}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {list.dueCount} due / {list.totalCards} total
                </p>
              </div>
              {list.dueCount > 0 && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/study?list=${list.listId}&due=true`}>Study</Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
