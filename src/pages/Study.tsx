import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  RotateCcw,
  Shuffle,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useVocabStore } from '@/stores/vocabStore'
import { useStudyStore } from '@/stores/studyStore'
import { cn } from '@/lib/utils'

export function Study() {
  const [searchParams] = useSearchParams()
  const initialListId = searchParams.get('listId')

  const { lists } = useVocabStore()
  const {
    session,
    startSession,
    flipCard,
    markKnown,
    markUnknown,
    endSession,
    shuffleCards,
    previousCard,
  } = useStudyStore()

  const [mode, setMode] = useState<'normal' | 'reverse'>('normal')
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([])
  const [selectedListIds, setSelectedListIds] = useState<string[]>(
    initialListId ? [initialListId] : []
  )

  // Get cards from selected lists (or all if none selected), deduplicating by source+target
  const selectedCards = useMemo(() => {
    const allCards = selectedListIds.length === 0
      ? lists.flatMap((l) => l.flashcards)
      : lists
          .filter((l) => selectedListIds.includes(l.id))
          .flatMap((l) => l.flashcards)

    // Deduplicate by source+target combination (case-insensitive)
    const seen = new Set<string>()
    return allCards.filter((card) => {
      const key = `${card.source.toLowerCase()}|${card.target.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [lists, selectedListIds])

  // Get all available tags from selected cards
  const availableTags = useMemo(() => {
    return Array.from(
      new Set(selectedCards.flatMap((card) => card.tags))
    ).sort()
  }, [selectedCards])

  // Filter cards by selected tags
  const filteredCards = useMemo(() => {
    if (selectedTagFilters.length === 0) return selectedCards
    return selectedCards.filter((card) =>
      selectedTagFilters.some((tag) => card.tags.includes(tag))
    )
  }, [selectedCards, selectedTagFilters])

  const handleStartStudy = () => {
    startSession(filteredCards, mode, undefined, selectedTagFilters)
  }

  // Keyboard shortcuts for study session
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!session || session.isComplete) return

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault()
          flipCard()
          break
        case 'k':
          if (session.isFlipped) {
            markKnown()
          }
          break
        case 'u':
          if (session.isFlipped) {
            markUnknown()
          }
          break
        case 'arrowleft':
          if (session.currentIndex > 0) {
            previousCard()
          }
          break
        case 'arrowright':
          if (!session.isFlipped) {
            flipCard()
          } else if (session.currentIndex < session.cards.length - 1) {
            markUnknown()
          }
          break
      }
    },
    [session, flipCard, markKnown, markUnknown, previousCard]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const toggleTagFilter = (tag: string) => {
    setSelectedTagFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const toggleListSelection = (listId: string) => {
    setSelectedListIds((prev) =>
      prev.includes(listId)
        ? prev.filter((id) => id !== listId)
        : [...prev, listId]
    )
    // Clear tag filters when list selection changes
    setSelectedTagFilters([])
  }

  const selectAllLists = () => {
    setSelectedListIds([])
    setSelectedTagFilters([])
  }

  // Session in progress
  if (session && !session.isComplete) {
    const currentCard = session.cards[session.currentIndex]
    // In normal mode: show source first, then target
    // In reverse mode: show target first, then source
    const frontText = session.mode === 'normal' ? currentCard.source : currentCard.target
    const backText = session.mode === 'normal' ? currentCard.target : currentCard.source

    // Check if front text is ambiguous (same text maps to different answers)
    const frontKey = session.mode === 'normal' ? 'source' : 'target'
    const backKey = session.mode === 'normal' ? 'target' : 'source'
    const cardsWithSameFront = session.cards.filter(
      (c) => c[frontKey].toLowerCase() === currentCard[frontKey].toLowerCase()
    )
    const isAmbiguous = cardsWithSameFront.some(
      (c) => c[backKey].toLowerCase() !== currentCard[backKey].toLowerCase()
    )

    // Show disambiguating hints on front when source is ambiguous
    const showHintsOnFront = isAmbiguous && !session.isFlipped

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={endSession}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            End Session
          </Button>
          <div className="text-sm text-muted-foreground">
            Card {session.currentIndex + 1} of {session.cards.length}
          </div>
          <div className="flex gap-2 text-sm">
            <span className="text-green-600">✓ {session.knownCount}</span>
            <span className="text-red-600">✗ {session.unknownCount}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{
              width: `${((session.currentIndex + 1) / session.cards.length) * 100}%`,
            }}
          />
        </div>

        {/* Flashcard */}
        <div
          className="cursor-pointer"
          onClick={flipCard}
        >
          <Card className="min-h-[300px] transition-all duration-300">
            <CardContent className="flex items-center justify-center h-full min-h-[300px] p-8">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  {session.isFlipped
                    ? (session.mode === 'normal' ? 'Answer' : 'Question')
                    : (session.mode === 'normal' ? 'Question' : 'Answer')
                  }
                </p>
                <p className="text-3xl font-bold mb-4">
                  {session.isFlipped ? backText : frontText}
                </p>
                {showHintsOnFront && (currentCard.gender || currentCard.partOfSpeech) && (
                  <div className="flex justify-center gap-2 mb-2">
                    {currentCard.partOfSpeech && (
                      <Badge variant="secondary">{currentCard.partOfSpeech}</Badge>
                    )}
                    {currentCard.gender && (
                      <Badge variant="outline">{currentCard.gender}</Badge>
                    )}
                  </div>
                )}
                {!session.isFlipped && (
                  <p className="text-sm text-muted-foreground">
                    Tap to reveal
                  </p>
                )}
                {session.isFlipped && (
                  <div className="space-y-2">
                    <div className="flex justify-center gap-2">
                      {currentCard.gender && (
                        <Badge variant="outline">
                          {currentCard.gender}
                        </Badge>
                      )}
                      {currentCard.partOfSpeech && (
                        <Badge variant="secondary">{currentCard.partOfSpeech}</Badge>
                      )}
                    </div>
                    {currentCard.example && (
                      <p className="text-sm text-muted-foreground italic">
                        {currentCard.example}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={previousCard}
            disabled={session.currentIndex === 0}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {session.isFlipped ? (
            <>
              <Button
                variant="outline"
                size="lg"
                onClick={markUnknown}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="mr-2 h-5 w-5" />
                Unknown
              </Button>
              <Button
                size="lg"
                onClick={markKnown}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="mr-2 h-5 w-5" />
                Known
              </Button>
            </>
          ) : (
            <Button size="lg" onClick={flipCard}>
              Flip Card
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (!session.isFlipped) flipCard()
              else markUnknown()
            }}
            disabled={session.currentIndex === session.cards.length - 1 && session.isFlipped}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <p className="text-center text-xs text-muted-foreground">
          Space to flip • ← → to navigate • K for known • U for unknown
        </p>
      </div>
    )
  }

  // Session complete
  if (session?.isComplete) {
    const total = session.cards.length
    const percentKnown = Math.round((session.knownCount / total) * 100)

    return (
      <div className="max-w-md mx-auto space-y-6 text-center">
        <h1 className="text-3xl font-bold">Session Complete!</h1>

        <Card>
          <CardContent className="py-8 space-y-4">
            <div className="text-6xl font-bold text-primary">{percentKnown}%</div>
            <p className="text-muted-foreground">Cards you knew</p>

            <div className="flex justify-center gap-8 pt-4">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {session.knownCount}
                </div>
                <div className="text-sm text-muted-foreground">Known</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {session.unknownCount}
                </div>
                <div className="text-sm text-muted-foreground">Unknown</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={endSession}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleStartStudy}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Study Again
          </Button>
        </div>
      </div>
    )
  }

  // Calculate total cards across all lists
  const totalAllCards = lists.reduce((sum, l) => sum + l.flashcards.length, 0)

  // Setup screen
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Study</h1>
          <p className="text-muted-foreground">
            {filteredCards.length} card{filteredCards.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      </div>

      {lists.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            No vocabulary lists yet. Create a list and add some cards first!
          </CardContent>
        </Card>
      ) : (
        <>
          {/* List Selection */}
          <Card>
            <CardContent className="py-4">
              <h3 className="font-medium mb-3">Select Lists</h3>
              <div className="space-y-2">
                {/* All Cards option */}
                <button
                  onClick={selectAllLists}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left',
                    selectedListIds.length === 0
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted'
                  )}
                >
                  <div className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center',
                    selectedListIds.length === 0
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground'
                  )}>
                    {selectedListIds.length === 0 && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">All Cards</div>
                    <div className="text-sm text-muted-foreground">
                      {totalAllCards} cards from {lists.length} list{lists.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </button>

                {/* Individual lists */}
                <div className="border-t pt-2 mt-2">
                  <p className="text-xs text-muted-foreground mb-2 px-1">Or select specific lists:</p>
                  {lists.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => toggleListSelection(list.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left mb-2',
                        selectedListIds.includes(list.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted'
                      )}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center',
                        selectedListIds.includes(list.id)
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      )}>
                        {selectedListIds.includes(list.id) && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{list.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {list.flashcards.length} card{list.flashcards.length !== 1 ? 's' : ''}
                          {list.tags.length > 0 && (
                            <span className="ml-2">
                              • {list.tags.slice(0, 2).join(', ')}
                              {list.tags.length > 2 && ` +${list.tags.length - 2}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mode Selection */}
          <Card>
            <CardContent className="py-4">
              <h3 className="font-medium mb-3">Study Mode</h3>
              <div className="flex gap-2">
                <Button
                  variant={mode === 'normal' ? 'default' : 'outline'}
                  onClick={() => setMode('normal')}
                  className="flex-1"
                >
                  Normal
                  <span className="text-xs ml-2 opacity-70">
                    Source → Target
                  </span>
                </Button>
                <Button
                  variant={mode === 'reverse' ? 'default' : 'outline'}
                  onClick={() => setMode('reverse')}
                  className="flex-1"
                >
                  Reverse
                  <span className="text-xs ml-2 opacity-70">
                    Target → Source
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tag Filters */}
          {availableTags.length > 0 && (
            <Card>
              <CardContent className="py-4">
                <h3 className="font-medium mb-3">Filter by Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTagFilter(tag)}
                      className={cn(
                        'px-3 py-1 rounded-full text-sm transition-colors',
                        selectedTagFilters.includes(tag)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                {selectedTagFilters.length > 0 && (
                  <button
                    onClick={() => setSelectedTagFilters([])}
                    className="text-sm text-muted-foreground hover:text-foreground mt-2"
                  >
                    Clear filters
                  </button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Start Button */}
          <div className="flex gap-2">
            <Button
              size="lg"
              className="flex-1"
              onClick={handleStartStudy}
              disabled={filteredCards.length === 0}
            >
              Start Studying
              {filteredCards.length > 0 && (
                <span className="ml-2 opacity-70">({filteredCards.length} cards)</span>
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                handleStartStudy()
                setTimeout(shuffleCards, 0)
              }}
              disabled={filteredCards.length === 0}
            >
              <Shuffle className="mr-2 h-4 w-4" />
              Shuffle
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
