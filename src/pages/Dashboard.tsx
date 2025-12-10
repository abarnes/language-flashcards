import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Upload, BookOpen, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useVocabStore } from '@/stores/vocabStore'
import { formatDate } from '@/lib/utils'

export function Dashboard() {
  const { lists, createList, getListTags } = useVocabStore()
  const [showNewListDialog, setShowNewListDialog] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const allTags = getListTags()

  const filteredLists = selectedTag
    ? lists.filter((list) => list.tags.includes(selectedTag))
    : lists

  const sortedLists = [...filteredLists].sort((a, b) => b.createdAt - a.createdAt)

  const handleCreateList = () => {
    if (newListName.trim()) {
      createList(newListName.trim())
      setNewListName('')
      setShowNewListDialog(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your vocabulary lists and flashcards
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

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <button
            onClick={() => setSelectedTag(null)}
            className={`text-sm px-3 py-1 rounded-full transition-colors ${
              selectedTag === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={`text-sm px-3 py-1 rounded-full transition-colors ${
                selectedTag === tag
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Lists Grid */}
      {sortedLists.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No vocabulary lists yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Create your first list or upload an image to extract vocabulary from a textbook page.
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedLists.map((list) => (
            <Link key={list.id} to={`/list/${list.id}`}>
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
                <CardHeader>
                  <CardTitle className="line-clamp-1">{list.name}</CardTitle>
                  <CardDescription>
                    {list.flashcards.length} flashcard{list.flashcards.length !== 1 ? 's' : ''} • Created {formatDate(list.createdAt)}
                  </CardDescription>
                </CardHeader>
                {list.tags.length > 0 && (
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {list.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
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
            <Button variant="outline" onClick={() => setShowNewListDialog(false)}>
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
