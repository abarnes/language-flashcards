import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  GraduationCap,
  Tag,
  Check,
  X,
  Tags,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { TagEditor } from '@/components/TagEditor'
import { useVocabStore } from '@/stores/vocabStore'
import type { Flashcard } from '@/types'

export function ListDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getList, updateList, deleteList, addFlashcard, updateFlashcard, deleteFlashcard, getAllTags } = useVocabStore()

  const list = getList(id!)
  const allTags = getAllTags()

  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(list?.name || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showAddCard, setShowAddCard] = useState(false)
  const [showEditListTags, setShowEditListTags] = useState(false)
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null)
  const [editingCardId, setEditingCardId] = useState<string | null>(null)

  const [newCard, setNewCard] = useState({ source: '', target: '', tags: [] as string[] })

  if (!list) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">List not found</p>
        <Button asChild>
          <Link to="/">Go to Dashboard</Link>
        </Button>
      </div>
    )
  }

  const flashcardTags = Array.from(
    new Set(list.flashcards.flatMap((fc) => fc.tags))
  ).sort()

  const filteredCards = selectedTagFilter
    ? list.flashcards.filter((fc) => fc.tags.includes(selectedTagFilter))
    : list.flashcards

  const handleSaveName = () => {
    if (editedName.trim()) {
      updateList(list.id, { name: editedName.trim() })
    }
    setIsEditingName(false)
  }

  const handleDelete = () => {
    deleteList(list.id)
    navigate('/')
  }

  const handleAddCard = () => {
    if (newCard.source.trim() && newCard.target.trim()) {
      addFlashcard(list.id, {
        source: newCard.source.trim(),
        target: newCard.target.trim(),
        tags: newCard.tags,
      })
      setNewCard({ source: '', target: '', tags: [] })
      setShowAddCard(false)
    }
  }

  const handleDeleteCard = (cardId: string) => {
    deleteFlashcard(list.id, cardId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>

        <div className="flex-1">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                className="max-w-sm text-lg font-bold"
                autoFocus
              />
              <Button size="icon" variant="ghost" onClick={handleSaveName}>
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setEditedName(list.name)
                  setIsEditingName(false)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{list.name}</h1>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsEditingName(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          <p className="text-muted-foreground text-sm">
            {list.flashcards.length} flashcard{list.flashcards.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowEditListTags(true)}
            title="Edit list tags"
          >
            <Tags className="h-4 w-4" />
          </Button>
          {list.flashcards.length > 0 && (
            <Button asChild>
              <Link to={`/study?listId=${list.id}`}>
                <GraduationCap className="mr-2 h-4 w-4" />
                Study
              </Link>
            </Button>
          )}
          <Button
            variant="destructive"
            size="icon"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* List Tags */}
      {list.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">List tags:</span>
          {list.tags.map((tag) => (
            <Badge key={tag} variant="default">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Tag Filter */}
      {flashcardTags.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground mr-1">Filter:</span>
          <button
            onClick={() => setSelectedTagFilter(null)}
            className={`text-sm px-3 py-1 rounded-full transition-colors ${
              selectedTagFilter === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            All
          </button>
          {flashcardTags.map((tag) => (
            <button
              key={tag}
              onClick={() =>
                setSelectedTagFilter(tag === selectedTagFilter ? null : tag)
              }
              className={`text-sm px-3 py-1 rounded-full transition-colors ${
                selectedTagFilter === tag
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Add Card Button */}
      <Button onClick={() => setShowAddCard(true)} variant="outline">
        <Plus className="mr-2 h-4 w-4" />
        Add Flashcard
      </Button>

      {/* Flashcards Table */}
      {filteredCards.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            {list.flashcards.length === 0
              ? 'No flashcards yet. Add your first card or upload an image to extract vocabulary.'
              : 'No cards match the selected filter.'}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Flashcards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredCards.map((card) => (
                <FlashcardRow
                  key={card.id}
                  card={card}
                  listId={list.id}
                  isEditing={editingCardId === card.id}
                  onStartEdit={() => setEditingCardId(card.id)}
                  onEndEdit={() => setEditingCardId(null)}
                  onDelete={() => handleDeleteCard(card.id)}
                  onUpdate={(updates) => updateFlashcard(list.id, card.id, updates)}
                  allTags={allTags}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent onClose={() => setShowDeleteConfirm(false)}>
          <DialogHeader>
            <DialogTitle>Delete List</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to delete "{list.name}"? This will delete all{' '}
            {list.flashcards.length} flashcards. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit List Tags Dialog */}
      <Dialog open={showEditListTags} onOpenChange={setShowEditListTags}>
        <DialogContent onClose={() => setShowEditListTags(false)}>
          <DialogHeader>
            <DialogTitle>Edit List Tags</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">Tags</Label>
            <TagEditor
              tags={list.tags}
              onChange={(tags) => updateList(list.id, { tags })}
              suggestions={allTags}
              placeholder="Add tags to organize this list..."
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setShowEditListTags(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Card Dialog */}
      <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
        <DialogContent onClose={() => setShowAddCard(false)}>
          <DialogHeader>
            <DialogTitle>Add Flashcard</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-[var(--color-source)] font-medium">Source Word</Label>
              <Input
                placeholder="Enter source word..."
                value={newCard.source}
                onChange={(e) => setNewCard({ ...newCard, source: e.target.value })}
                className="border-[var(--color-source)]/30 focus-visible:ring-[var(--color-source)]/50"
              />
            </div>
            <div>
              <Label className="text-[var(--color-target)] font-medium">Target Word</Label>
              <Input
                placeholder="Enter target word..."
                value={newCard.target}
                onChange={(e) => setNewCard({ ...newCard, target: e.target.value })}
                className="border-[var(--color-target)]/30 focus-visible:ring-[var(--color-target)]/50"
              />
            </div>
            <div>
              <Label>Tags (optional)</Label>
              <TagEditor
                tags={newCard.tags}
                onChange={(tags) => setNewCard({ ...newCard, tags })}
                suggestions={allTags}
                placeholder="Add tags..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCard(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCard}
              disabled={!newCard.source.trim() || !newCard.target.trim()}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface FlashcardRowProps {
  card: Flashcard
  listId: string
  isEditing: boolean
  onStartEdit: () => void
  onEndEdit: () => void
  onDelete: () => void
  onUpdate: (updates: Partial<Flashcard>) => void
  allTags: string[]
}

function FlashcardRow({
  card,
  isEditing,
  onStartEdit,
  onEndEdit,
  onDelete,
  onUpdate,
  allTags,
}: FlashcardRowProps) {
  const [editedSource, setEditedSource] = useState(card.source)
  const [editedTarget, setEditedTarget] = useState(card.target)
  const [editedTags, setEditedTags] = useState(card.tags)

  const handleSave = () => {
    onUpdate({ source: editedSource, target: editedTarget, tags: editedTags })
    onEndEdit()
  }

  if (isEditing) {
    return (
      <div className="p-3 bg-muted rounded-lg space-y-3">
        <div className="flex items-center gap-2">
          <Input
            value={editedSource}
            onChange={(e) => setEditedSource(e.target.value)}
            className="flex-1 border-[var(--color-source)]/30 focus-visible:ring-[var(--color-source)]/50"
            placeholder="Source"
          />
          <span className="text-muted-foreground">→</span>
          <Input
            value={editedTarget}
            onChange={(e) => setEditedTarget(e.target.value)}
            className="flex-1 border-[var(--color-target)]/30 focus-visible:ring-[var(--color-target)]/50"
            placeholder="Target"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Tags</Label>
          <TagEditor
            tags={editedTags}
            onChange={setEditedTags}
            suggestions={allTags}
            placeholder="Add tags..."
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onEndEdit}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Check className="mr-1 h-3 w-3" />
            Save
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group">
      <div className="flex-1 flex flex-wrap items-center gap-2">
        <span className="font-medium text-[var(--color-source-foreground)] bg-[var(--color-source-muted)] px-2 py-0.5 rounded">
          {card.source}
        </span>
        <span className="text-muted-foreground">→</span>
        <span className="font-medium text-[var(--color-target-foreground)] bg-[var(--color-target-muted)] px-2 py-0.5 rounded">
          {card.target}
        </span>
        {card.tags.length > 0 && (
          <div className="flex gap-1 ml-2">
            {card.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button size="icon" variant="ghost" onClick={onStartEdit}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
