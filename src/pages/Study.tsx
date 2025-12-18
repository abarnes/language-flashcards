import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  RotateCcw,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useVocabStore } from '@/stores/vocabStore'
import { useStudyStore } from '@/stores/studyStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { LANGUAGES, type SRSGrade, type StudyDirection } from '@/types'
import { cn } from '@/lib/utils'
import { isDue, getPredictedIntervals } from '@/services/srs'

type CardFilter = 'all' | 'due'

export function Study() {
  const [searchParams] = useSearchParams()
  const initialListId = searchParams.get('listId')

  const { lists, reviewFlashcard } = useVocabStore()
  const {
    session,
    startSession,
    flipCard,
    markKnown: storeMarkKnown,
    markUnknown: storeMarkUnknown,
    endSession,
    shuffleCards,
    previousCard,
  } = useStudyStore()
  const { settings } = useSettingsStore()

  // Get language names from codes
  const sourceLangName = LANGUAGES.find(l => l.code === settings.sourceLang)?.name ?? settings.sourceLang
  const targetLangName = LANGUAGES.find(l => l.code === settings.targetLang)?.name ?? settings.targetLang

  const [mode, setMode] = useState<'normal' | 'reverse'>('normal')
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([])
  const [selectedListIds, setSelectedListIds] = useState<string[]>(
    initialListId ? [initialListId] : []
  )
  const [cardFilter, setCardFilter] = useState<CardFilter>('all')

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

  // Filter cards by selected tags and due status (based on current mode/direction)
  const filteredCards = useMemo(() => {
    let cards = selectedCards

    // Filter by tags
    if (selectedTagFilters.length > 0) {
      cards = cards.filter((card) =>
        selectedTagFilters.some((tag) => card.tags.includes(tag))
      )
    }

    // Filter by due status for the selected study direction
    if (cardFilter === 'due') {
      cards = cards.filter((card) => isDue(card, mode))
    }

    return cards
  }, [selectedCards, selectedTagFilters, cardFilter, mode])

  // Count due cards for UI (based on current mode/direction)
  const dueCardCount = useMemo(() => {
    let cards = selectedCards
    if (selectedTagFilters.length > 0) {
      cards = cards.filter((card) =>
        selectedTagFilters.some((tag) => card.tags.includes(tag))
      )
    }
    return cards.filter((card) => isDue(card, mode)).length
  }, [selectedCards, selectedTagFilters, mode])

  const handleStartStudy = () => {
    startSession(filteredCards, mode, undefined, selectedTagFilters)
  }

  // Handle SRS grade and move to next card
  const handleGrade = useCallback((grade: SRSGrade) => {
    if (!session) return
    const currentCard = session.cards[session.currentIndex]
    // Pass the study direction to track SRS separately for each direction
    reviewFlashcard(currentCard.id, grade, session.mode as StudyDirection)
    // Use existing store methods for session tracking
    if (grade === 'again') {
      storeMarkUnknown()
    } else {
      storeMarkKnown()
    }
  }, [session, reviewFlashcard, storeMarkKnown, storeMarkUnknown])

  // Keyboard shortcuts for study session
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!session || session.isComplete) return

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault()
          flipCard()
          break
        case '1':
          if (session.isFlipped) handleGrade('again')
          break
        case '2':
          if (session.isFlipped) handleGrade('hard')
          break
        case '3':
          if (session.isFlipped) handleGrade('good')
          break
        case '4':
          if (session.isFlipped) handleGrade('easy')
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
            handleGrade('good')
          }
          break
      }
    },
    [session, flipCard, handleGrade, previousCard]
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
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={endSession} className="px-2 sm:px-4">
            <ArrowLeft className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">End Session</span>
          </Button>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {session.currentIndex + 1} / {session.cards.length}
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
        {session.isFlipped ? (
          <div className="space-y-3">
            {/* SRS Grade Buttons */}
            {(() => {
              const predictions = getPredictedIntervals(currentCard, session.mode as StudyDirection)
              return (
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleGrade('again')}
                    className="flex-col h-auto py-3 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <span className="text-sm font-medium">Again</span>
                    <span className="text-xs opacity-70">{predictions.again}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleGrade('hard')}
                    className="flex-col h-auto py-3 text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    <span className="text-sm font-medium">Hard</span>
                    <span className="text-xs opacity-70">{predictions.hard}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleGrade('good')}
                    className="flex-col h-auto py-3 text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <span className="text-sm font-medium">Good</span>
                    <span className="text-xs opacity-70">{predictions.good}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleGrade('easy')}
                    className="flex-col h-auto py-3 text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <span className="text-sm font-medium">Easy</span>
                    <span className="text-xs opacity-70">{predictions.easy}</span>
                  </Button>
                </div>
              )
            })()}

            {/* Navigation */}
            <div className="flex justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={previousCard}
                disabled={session.currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={previousCard}
              disabled={session.currentIndex === 0}
              className="h-12 w-12 p-0 sm:h-10 sm:w-10"
            >
              <ChevronLeft className="h-6 w-6 sm:h-5 sm:w-5" />
            </Button>
            <Button onClick={flipCard} className="h-14 px-8 text-base sm:h-10 sm:px-6 sm:text-sm">
              Flip Card
            </Button>
            <Button
              variant="outline"
              onClick={flipCard}
              className="h-12 w-12 p-0 sm:h-10 sm:w-10"
            >
              <ChevronRight className="h-6 w-6 sm:h-5 sm:w-5" />
            </Button>
          </div>
        )}

        {/* Keyboard Shortcuts Hint - hidden on mobile */}
        <p className="hidden sm:block text-center text-xs text-muted-foreground">
          Space to flip • 1-4 for grades • ← → to navigate
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
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant={mode === 'normal' ? 'default' : 'outline'}
                  onClick={() => setMode('normal')}
                  className="flex-1 flex-col h-auto py-3 sm:flex-row sm:py-2"
                >
                  <span>Normal</span>
                  <span className="text-xs opacity-70 sm:ml-2">
                    {sourceLangName} → {targetLangName}
                  </span>
                </Button>
                <Button
                  variant={mode === 'reverse' ? 'default' : 'outline'}
                  onClick={() => setMode('reverse')}
                  className="flex-1 flex-col h-auto py-3 sm:flex-row sm:py-2"
                >
                  <span>Reverse</span>
                  <span className="text-xs opacity-70 sm:ml-2">
                    {targetLangName} → {sourceLangName}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card Filter */}
          <Card>
            <CardContent className="py-4">
              <h3 className="font-medium mb-3">Which Cards?</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant={cardFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setCardFilter('all')}
                  className="flex-1"
                >
                  All Cards
                </Button>
                <Button
                  variant={cardFilter === 'due' ? 'default' : 'outline'}
                  onClick={() => setCardFilter('due')}
                  className="flex-1"
                  disabled={dueCardCount === 0}
                >
                  Due for Review
                  <span className="text-xs ml-2 opacity-70">
                    ({dueCardCount})
                  </span>
                </Button>
              </div>
              {dueCardCount === 0 && cardFilter === 'due' && (
                <p className="text-sm text-muted-foreground mt-2">
                  No cards due for review right now. Come back later!
                </p>
              )}
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
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              className="flex-1 h-14 text-base px-8 sm:h-11 sm:text-sm"
              onClick={handleStartStudy}
              disabled={filteredCards.length === 0}
            >
              Start Studying
              {filteredCards.length > 0 && (
                <span className="ml-2 opacity-70">({filteredCards.length})</span>
              )}
            </Button>
            <Button
              variant="outline"
              className="h-14 text-base px-8 sm:h-11 sm:text-sm"
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
