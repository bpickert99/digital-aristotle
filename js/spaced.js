// SM-2 spaced repetition algorithm
// Each card: { id, front, back, type, interval, easeFactor, dueDate, repetitions }

export function createCard(id, front, back, type = 'concept') {
  return {
    id, front, back, type,
    interval:    1,
    easeFactor:  2.5,
    repetitions: 0,
    dueDate:     Date.now()
  };
}

// quality: 0=blackout, 1=wrong, 2=wrong+hint, 3=hard, 4=good, 5=easy
export function reviewCard(card, quality) {
  let { interval, easeFactor, repetitions } = card;

  if (quality < 3) {
    repetitions = 0;
    interval    = 1;
  } else {
    if (repetitions === 0)      interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);

    repetitions++;
    easeFactor = Math.max(1.3,
      easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    );
  }

  const dueDate = Date.now() + interval * 24 * 60 * 60 * 1000;
  return { ...card, interval, easeFactor, repetitions, dueDate, lastReviewed: Date.now() };
}

export function isDue(card) {
  return Date.now() >= card.dueDate;
}

export function getDueCards(deck) {
  return deck.filter(isDue).sort((a, b) => a.dueDate - b.dueDate);
}

// Convert a lesson concept to a review card
export function conceptToCard(concept, lessonId, unitTitle) {
  return createCard(
    `${lessonId}-${concept.id}`,
    concept.question,
    concept.answer,
    concept.type || 'concept'
  );
}

// Vocab word to card
export function vocabToCard(word, definition, context) {
  return createCard(
    `vocab-${word}`,
    `"${word}" — used in context:\n${context}`,
    definition,
    'vocabulary'
  );
}
