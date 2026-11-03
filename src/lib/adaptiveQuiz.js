/**
 * Adaptive Learning Utilities & Quiz Difficulty Formatting
 * 
 * Rules:
 * - Applicable to adaptive subjects: Theory of Computation, Machine Learning, Operating System, Data Mining
 * - Easy: Unlocked by default
 * - Medium: Requires >= 70% in Easy quiz of the same subject
 * - Hard: Requires >= 50% in Medium quiz of the same subject
 * - If easy, medium, or hard is not explicitly in the title, default difficulty is 'easy'
 */

export const ADAPTIVE_SUBJECTS = [
  'theory of computation',
  'machine learning',
  'operating system',
  'data mining',
];

/**
 * Mapping from legacy raw titles to short, descriptive titles
 */
export const DESCRIPTIVE_TITLES_MAP = {
  // Data Mining
  'data mining – easy': 'Data Mining Fundamentals',
  'data mining - easy': 'Data Mining Fundamentals',
  'data mining: easy': 'Data Mining Fundamentals',
  'data mining easy': 'Data Mining Fundamentals',

  'data mining – medium': 'Classification & Clustering',
  'data mining - medium': 'Classification & Clustering',
  'data mining: medium': 'Classification & Clustering',
  'data mining medium': 'Classification & Clustering',

  'data mining – hard': 'Advanced Mining & Ensembles',
  'data mining - hard': 'Advanced Mining & Ensembles',
  'data mining: hard': 'Advanced Mining & Ensembles',
  'data mining hard': 'Advanced Mining & Ensembles',

  // Machine Learning
  'machine learning – easy': 'Machine Learning Basics',
  'machine learning - easy': 'Machine Learning Basics',
  'machine learning: easy': 'Machine Learning Basics',
  'machine learning easy': 'Machine Learning Basics',

  'machine learning – medium': 'Supervised Models & Tuning',
  'machine learning - medium': 'Supervised Models & Tuning',
  'machine learning: medium': 'Supervised Models & Tuning',
  'machine learning medium': 'Supervised Models & Tuning',

  'machine learning – hard': 'Neural Networks & Deep Learning',
  'machine learning - hard': 'Neural Networks & Deep Learning',
  'machine learning: hard': 'Neural Networks & Deep Learning',
  'machine learning hard': 'Neural Networks & Deep Learning',

  // Operating System
  'operating system – easy': 'OS Concepts & Architecture',
  'operating system - easy': 'OS Concepts & Architecture',
  'operating system: easy': 'OS Concepts & Architecture',
  'operating system easy': 'OS Concepts & Architecture',

  'operating system – medium': 'Processes & Memory Management',
  'operating system - medium': 'Processes & Memory Management',
  'operating system: medium': 'Processes & Memory Management',
  'operating system medium': 'Processes & Memory Management',

  'operating system – hard': 'Storage, Deadlocks & Kernels',
  'operating system - hard': 'Storage, Deadlocks & Kernels',
  'operating system: hard': 'Storage, Deadlocks & Kernels',
  'operating system hard': 'Storage, Deadlocks & Kernels',

  // Theory of Computation
  'theory of computation – easy': 'Automata & Regular Languages',
  'theory of computation - easy': 'Automata & Regular Languages',
  'theory of computation: easy': 'Automata & Regular Languages',
  'theory of computation easy': 'Automata & Regular Languages',

  'theory of computation – medium': 'Context-Free Grammars & PDA',
  'theory of computation - medium': 'Context-Free Grammars & PDA',
  'theory of computation: medium': 'Context-Free Grammars & PDA',
  'theory of computation medium': 'Context-Free Grammars & PDA',

  'theory of computation – hard': 'Turing Machines & Complexity',
  'theory of computation - hard': 'Turing Machines & Complexity',
  'theory of computation: hard': 'Turing Machines & Complexity',
  'theory of computation hard': 'Turing Machines & Complexity',
};

/**
 * Reverse mapping from descriptive titles back to their difficulty level
 */
export const DESCRIPTIVE_DIFFICULTY_MAP = {
  // Data Mining
  'data mining fundamentals': 'easy',
  'classification & clustering': 'medium',
  'advanced mining & ensembles': 'hard',

  // Machine Learning
  'machine learning basics': 'easy',
  'supervised models & tuning': 'medium',
  'neural networks & deep learning': 'hard',

  // Operating System
  'os concepts & architecture': 'easy',
  'processes & memory management': 'medium',
  'storage, deadlocks & kernels': 'hard',

  // Theory of Computation
  'automata & regular languages': 'easy',
  'context-free grammars & pda': 'medium',
  'turing machines & complexity': 'hard',
};

/**
 * Convert legacy titles to clean, short, descriptive titles
 */
export function getDescriptiveQuizTitle(quizTitle) {
  if (!quizTitle) return 'Quiz';
  const trimmed = quizTitle.trim();
  const normalized = trimmed.toLowerCase();

  if (DESCRIPTIVE_TITLES_MAP[normalized]) {
    return DESCRIPTIVE_TITLES_MAP[normalized];
  }

  // Strip trailing difficulty markers like " – Easy", " - Medium", " (Hard)"
  const stripped = trimmed
    .replace(/\s*[-–—:]\s*(easy|medium|hard)\b/i, '')
    .replace(/\s*\((easy|medium|hard)\)/i, '')
    .trim();

  return stripped || trimmed;
}

/**
 * Check if a given subject title is an adaptive learning subject
 */
export function isAdaptiveSubject(subjectTitle) {
  if (!subjectTitle) return false;
  const normalized = subjectTitle.trim().toLowerCase();
  return ADAPTIVE_SUBJECTS.some(s => normalized.includes(s) || s.includes(normalized));
}

/**
 * Detect quiz difficulty level from quiz object or title string.
 * Per user instruction: If easy, medium, hard is not found, defaults to 'easy'.
 */
export function getQuizDifficulty(quizOrTitle) {
  if (!quizOrTitle) return 'easy';

  if (typeof quizOrTitle === 'object') {
    if (quizOrTitle.difficulty) {
      return String(quizOrTitle.difficulty).toLowerCase();
    }
    return getQuizDifficulty(quizOrTitle.title);
  }

  const title = String(quizOrTitle).trim().toLowerCase();

  // 1. Check known descriptive title mapping
  if (DESCRIPTIVE_DIFFICULTY_MAP[title]) {
    return DESCRIPTIVE_DIFFICULTY_MAP[title];
  }

  // 2. Check presence of explicit keywords
  if (/\bhard\b/i.test(title)) return 'hard';
  if (/\bmedium\b/i.test(title)) return 'medium';
  if (/\beasy\b/i.test(title)) return 'easy';

  // 3. Fallback default: 'easy'
  return 'easy';
}

/**
 * Return badge label and Tailwind styling for a given difficulty
 */
export function getDifficultyBadgeStyle(difficulty = 'easy') {
  const diff = String(difficulty).toLowerCase();
  switch (diff) {
    case 'hard':
      return {
        label: 'Hard',
        className: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
      };
    case 'medium':
      return {
        label: 'Medium',
        className: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30',
      };
    case 'easy':
    default:
      return {
        label: 'Easy',
        className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      };
  }
}

/**
 * Attach normalized difficulty and clean descriptive title to quiz
 */
export function formatQuiz(quiz) {
  if (!quiz) return quiz;
  const difficulty = getQuizDifficulty(quiz);
  const displayTitle = getDescriptiveQuizTitle(quiz.title);
  return {
    ...quiz,
    difficulty,
    displayTitle,
  };
}

/**
 * Sort quizzes in natural learning progression: Easy -> Medium -> Hard -> Others
 */
export function sortQuizzesByDifficulty(quizzes = []) {
  const orderWeight = { easy: 1, medium: 2, hard: 3 };
  return [...quizzes].sort((a, b) => {
    const diffA = getQuizDifficulty(a);
    const diffB = getQuizDifficulty(b);
    const weightA = orderWeight[diffA] || 99;
    const weightB = orderWeight[diffB] || 99;

    if (weightA !== weightB) {
      return weightA - weightB;
    }
    return new Date(a.created_at || 0) - new Date(b.created_at || 0);
  });
}

/**
 * Compute the lock status of a quiz for a given user
 */
export function computeQuizLockStatus({ quiz, subjectTitle, allSubjectQuizzes = [], userScores = [] }) {
  // If not an adaptive subject, quiz is always unlocked
  if (!isAdaptiveSubject(subjectTitle)) {
    return { isLocked: false };
  }

  const difficulty = getQuizDifficulty(quiz);

  // Easy quizzes or unknown levels are always unlocked
  if (difficulty === 'easy') {
    return { isLocked: false };
  }

  // Calculate highest score percentage for each quiz
  const bestScoreMap = new Map(); // quizId -> best percentage (0 - 100)
  for (const s of userScores) {
    const qId = s.quiz_id;
    const relatedQuiz = allSubjectQuizzes.find(q => q.id === qId);
    const totalQuestions = relatedQuiz?.questions?.length || s.quizzes?.questions?.length || 10;
    const pct = totalQuestions > 0 ? Math.round((s.score / totalQuestions) * 100) : 0;
    const currentBest = bestScoreMap.get(qId) || 0;
    if (pct > currentBest) {
      bestScoreMap.set(qId, pct);
    }
  }

  // Rule 1: Medium requires >= 70% in Easy
  if (difficulty === 'medium') {
    const easyQuiz = allSubjectQuizzes.find(q => getQuizDifficulty(q) === 'easy');
    const bestEasyPct = easyQuiz ? (bestScoreMap.get(easyQuiz.id) || 0) : 0;
    const isLocked = bestEasyPct < 70;

    return {
      isLocked,
      lockReason: 'Requires at least 70% score in the Easy quiz to unlock.',
      requiredPercentage: 70,
      bestScorePercentage: bestEasyPct,
      prereqQuiz: easyQuiz,
      prereqDifficulty: 'Easy',
    };
  }

  // Rule 2: Hard requires >= 50% in Medium
  if (difficulty === 'hard') {
    const mediumQuiz = allSubjectQuizzes.find(q => getQuizDifficulty(q) === 'medium');
    const bestMediumPct = mediumQuiz ? (bestScoreMap.get(mediumQuiz.id) || 0) : 0;
    const isLocked = bestMediumPct < 50;

    return {
      isLocked,
      lockReason: 'Requires at least 50% score in the Medium quiz to unlock.',
      requiredPercentage: 50,
      bestScorePercentage: bestMediumPct,
      prereqQuiz: mediumQuiz,
      prereqDifficulty: 'Medium',
    };
  }

  return { isLocked: false };
}
