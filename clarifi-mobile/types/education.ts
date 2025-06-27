// Educational Content Types

export interface LocalizedString {
  en: string;
  fr: string;
}

export interface ContentFile {
  en: string;
  fr: string;
}

export interface Lesson {
  id: string;
  title: LocalizedString;
  contentFile: ContentFile;
  duration: number; // in minutes
  hasQuiz: boolean;
}

export interface EducationModule {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  category: 'credit' | 'budgeting' | 'investment' | 'debt' | 'general';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // total minutes
  icon: string;
  lessons: Lesson[];
  finalQuiz: ContentFile;
}

export interface EducationManifest {
  version: string;
  lastUpdated: string;
  supportedLanguages: string[];
  modules: EducationModule[];
}

// Progress Tracking Types

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: Date;
  timeSpent?: number; // in seconds
  quizScore?: number; // percentage if quiz was taken
}

export interface ModuleProgress {
  moduleId: string;
  startedAt: Date;
  completedAt?: Date;
  lessonsProgress: LessonProgress[];
  finalQuizScore?: number;
  totalTimeSpent: number; // in seconds
  isCompleted: boolean;
  completionPercentage: number;
}

export interface UserEducationProgress {
  userId: string;
  modules: ModuleProgress[];
  totalTimeSpent: number;
  lastAccessedAt: Date;
  preferredLanguage: 'en' | 'fr';
}

// Quiz Types

export interface QuizOption {
  id: string;
  text: LocalizedString;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-in-blank';
  question: LocalizedString;
  options?: QuizOption[];
  correctAnswer?: string;
  explanation: LocalizedString;
  points: number;
}

export interface Quiz {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  questions: QuizQuestion[];
  passingScore: number; // percentage
  timeLimit?: number; // in minutes
}

// UI Component Props Types

export interface EducationHubProps {
  modules: EducationModule[];
  userProgress: UserEducationProgress;
  language: 'en' | 'fr';
  onModuleSelect: (moduleId: string) => void;
  onLanguageChange: (language: 'en' | 'fr') => void;
}

export interface ModuleViewerProps {
  module: EducationModule;
  currentLessonId?: string;
  userProgress: ModuleProgress;
  language: 'en' | 'fr';
  onLessonComplete: (
    lessonId: string,
    timeSpent: number,
    quizScore?: number
  ) => void;
  onNavigateToLesson: (lessonId: string) => void;
  onBackToHub: () => void;
}

export interface QuizComponentProps {
  quiz: Quiz;
  language: 'en' | 'fr';
  onQuizComplete: (score: number, answers: Record<string, string>) => void;
  onSkip?: () => void;
}

// Storage Keys
export const EDUCATION_STORAGE_KEYS = {
  USER_PROGRESS: '@clarifi:education:progress',
  PREFERRED_LANGUAGE: '@clarifi:education:language',
  LAST_ACCESSED_MODULE: '@clarifi:education:lastModule',
  OFFLINE_CONTENT: '@clarifi:education:offlineContent',
} as const;

// Content Categories
export const EDUCATION_CATEGORIES = {
  credit: {
    en: 'Credit & Credit Scores',
    fr: 'Crédit et cotes de crédit',
  },
  budgeting: {
    en: 'Budgeting & Planning',
    fr: 'Budget et planification',
  },
  investment: {
    en: 'Saving & Investment',
    fr: 'Épargne et investissement',
  },
  debt: {
    en: 'Debt Management',
    fr: 'Gestion des dettes',
  },
  general: {
    en: 'General Finance',
    fr: 'Finance générale',
  },
} as const;

// Difficulty Levels
export const DIFFICULTY_LEVELS = {
  beginner: {
    en: 'Beginner',
    fr: 'Débutant',
  },
  intermediate: {
    en: 'Intermediate',
    fr: 'Intermédiaire',
  },
  advanced: {
    en: 'Advanced',
    fr: 'Avancé',
  },
} as const;
