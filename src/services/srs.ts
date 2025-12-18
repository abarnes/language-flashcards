/**
 * Spaced Repetition System (SRS) Service
 * Implements a modified SM-2 algorithm similar to Anki
 * Supports per-direction tracking (normal vs reverse)
 */

import type { Flashcard, SRSData, SRSGrade, SRSResult, StudyDirection } from '@/types'

// Default SRS constants
const DEFAULT_EASE_FACTOR = 2.5
const MIN_EASE_FACTOR = 1.3
const EASE_BONUS = 0.15 // Added to easeFactor on 'easy'
const EASE_PENALTY_HARD = 0.15 // Subtracted on 'hard'
const EASE_PENALTY_AGAIN = 0.2 // Subtracted on 'again'

// Learning step intervals in minutes (for new/lapsed cards)
const LEARNING_STEPS = [1, 10] // 1 minute, then 10 minutes

// Graduating interval (first review interval in days after learning)
const GRADUATING_INTERVAL = 1

// Easy bonus multiplier
const EASY_BONUS = 1.3

// Hard interval multiplier
const HARD_INTERVAL_MULTIPLIER = 1.2

/**
 * Get the SRS data for a specific direction
 */
export function getSRSData(card: Flashcard, direction: StudyDirection): SRSData {
  return direction === 'normal' ? (card.srsNormal ?? {}) : (card.srsReverse ?? {})
}

/**
 * Calculate the next SRS state based on user's grade
 */
export function calculateNextReview(
  srsData: SRSData,
  grade: SRSGrade
): SRSResult {
  const now = Date.now()
  const currentEaseFactor = srsData.easeFactor ?? DEFAULT_EASE_FACTOR
  const currentInterval = srsData.interval ?? 0
  const currentRepetitions = srsData.repetitions ?? 0

  let newInterval: number
  let newEaseFactor = currentEaseFactor
  let newRepetitions = currentRepetitions

  // Card is in learning phase (no interval yet or interval < 1 day)
  const isLearning = currentInterval < 1

  if (grade === 'again') {
    // Reset to learning phase
    newRepetitions = 0
    newInterval = LEARNING_STEPS[0] / (24 * 60) // Convert minutes to days
    newEaseFactor = Math.max(MIN_EASE_FACTOR, currentEaseFactor - EASE_PENALTY_AGAIN)
  } else if (isLearning) {
    // Card is still in learning phase
    if (grade === 'good' || grade === 'easy') {
      // Graduate from learning
      newRepetitions = 1
      newInterval = grade === 'easy'
        ? GRADUATING_INTERVAL * EASY_BONUS
        : GRADUATING_INTERVAL
      if (grade === 'easy') {
        newEaseFactor = currentEaseFactor + EASE_BONUS
      }
    } else {
      // 'hard' in learning - stay in learning with next step
      const stepIndex = Math.min(1, currentRepetitions)
      newInterval = LEARNING_STEPS[stepIndex] / (24 * 60)
      newRepetitions = currentRepetitions
    }
  } else {
    // Card is in review phase (has graduated)
    newRepetitions = currentRepetitions + 1

    switch (grade) {
      case 'hard':
        newInterval = currentInterval * HARD_INTERVAL_MULTIPLIER
        newEaseFactor = Math.max(MIN_EASE_FACTOR, currentEaseFactor - EASE_PENALTY_HARD)
        break
      case 'good':
        newInterval = currentInterval * newEaseFactor
        break
      case 'easy':
        newInterval = currentInterval * newEaseFactor * EASY_BONUS
        newEaseFactor = currentEaseFactor + EASE_BONUS
        break
      default:
        newInterval = currentInterval
    }
  }

  // Calculate due date
  const intervalMs = newInterval * 24 * 60 * 60 * 1000
  const dueDate = now + intervalMs

  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    repetitions: newRepetitions,
    dueDate,
  }
}

/**
 * Check if a card is due for review in a specific direction
 */
export function isDue(card: Flashcard, direction: StudyDirection): boolean {
  const srsData = getSRSData(card, direction)
  if (!srsData.dueDate) {
    // Cards without a due date are always due (new cards)
    return true
  }
  return Date.now() >= srsData.dueDate
}

/**
 * Check if a card is due for review in either direction
 */
export function isDueAnyDirection(card: Flashcard): boolean {
  return isDue(card, 'normal') || isDue(card, 'reverse')
}

/**
 * Get cards that are due for review in a specific direction, sorted by urgency
 * Most overdue cards come first
 */
export function getDueCards(cards: Flashcard[], direction: StudyDirection): Flashcard[] {
  const now = Date.now()

  return cards
    .filter(card => isDue(card, direction))
    .sort((a, b) => {
      const aData = getSRSData(a, direction)
      const bData = getSRSData(b, direction)
      // New cards (no dueDate) come after overdue cards
      const aDue = aData.dueDate ?? now
      const bDue = bData.dueDate ?? now
      return aDue - bDue // Most overdue first
    })
}

/**
 * Get new cards (never reviewed in the specified direction)
 */
export function getNewCards(cards: Flashcard[], direction: StudyDirection): Flashcard[] {
  return cards.filter(card => {
    const srsData = getSRSData(card, direction)
    return !srsData.lastReviewed
  })
}

/**
 * Get learning cards (in learning phase, interval < 1 day)
 */
export function getLearningCards(cards: Flashcard[], direction: StudyDirection): Flashcard[] {
  return cards.filter(card => {
    const srsData = getSRSData(card, direction)
    if (!srsData.lastReviewed) return false
    const interval = srsData.interval ?? 0
    return interval < 1
  })
}

/**
 * Format interval for display
 */
export function formatInterval(days: number): string {
  if (days < 1 / 24) {
    // Less than an hour
    const minutes = Math.round(days * 24 * 60)
    return `${minutes}m`
  } else if (days < 1) {
    // Less than a day
    const hours = Math.round(days * 24)
    return `${hours}h`
  } else if (days < 30) {
    // Less than a month
    const d = Math.round(days)
    return `${d}d`
  } else if (days < 365) {
    // Less than a year
    const months = Math.round(days / 30)
    return `${months}mo`
  } else {
    const years = Math.round(days / 365 * 10) / 10
    return `${years}y`
  }
}

/**
 * Get predicted intervals for each grade option
 * Useful for showing users what will happen with each choice
 */
export function getPredictedIntervals(
  card: Flashcard,
  direction: StudyDirection
): Record<SRSGrade, string> {
  const srsData = getSRSData(card, direction)
  const grades: SRSGrade[] = ['again', 'hard', 'good', 'easy']
  const predictions: Record<SRSGrade, string> = {} as Record<SRSGrade, string>

  for (const grade of grades) {
    const result = calculateNextReview(srsData, grade)
    predictions[grade] = formatInterval(result.interval)
  }

  return predictions
}
