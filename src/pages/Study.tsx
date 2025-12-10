import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  RotateCcw,
  Shuffle,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useVocabStore } from '@/stores/vocabStore'
import { useStudyStore } from '@/stores/studyStore'
import { cn } from '@/lib/utils'

export function Study() {
  const [searchParams] = useSearchParams()
  const listId = searchParams.get('listId')

  const { lists, getList } = useVocabStore()
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

  const list = listId ? getList(listId) : null

  // Get all available cards
  const allCards = listId
    ? list?.flashcards || []
    : lists.flatMap((l) => l.flashcards)

  // Get all available tags from cards
  const availableTags = Array.from(
    new Set(allCards.flatMap((card) => card.tags))
  ).sort()

  // Filter cards by selected tags
  const filteredCards =
    selectedTagFilters.length > 0
      ? allCards.filter((card) =>
          selectedTagFilters.some((tag) => card.tags.includes(tag))
        )
      : allCards

  const handleStartStudy = () => {
    startSession(filteredCards, mode, listId || undefined, selectedTagFilters)
  }

  const toggleTagFilter = (tag: string) => {
    setSelectedTagFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  // Session in progress
  if (session && !session.isComplete) {
    const currentCard = session.cards[session.currentIndex]
    // In normal mode: show source first, then target
    // In reverse mode: show target first, then source
    const frontText = session.mode === 'normal' ? currentCard.source : currentCard.target
    const backText = session.mode === 'normal' ? currentCard.target : currentCard.source

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

  // Setup screen
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={listId ? `/list/${listId}` : '/'}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            Study {list ? list.name : 'All Cards'}
          </h1>
          <p className="text-muted-foreground">
            {filteredCards.length} card{filteredCards.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      {filteredCards.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            No flashcards to study. Add some cards first!
          </CardContent>
        </Card>
      ) : (
        <>
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
            <Button size="lg" className="flex-1" onClick={handleStartStudy}>
              Start Studying
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                handleStartStudy()
                setTimeout(shuffleCards, 0)
              }}
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
