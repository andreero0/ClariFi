import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EducationManifest,
  EducationModule,
  UserEducationProgress,
  ModuleProgress,
  LessonProgress,
  Quiz,
  EDUCATION_STORAGE_KEYS,
} from '../../types/education';
import {
  STORAGE_KEYS,
  EducationStorage,
  storeObject,
  getObject,
  storeString,
  getString,
  storeNumber,
  getNumber,
} from '../storage';

// Import the manifest file
import educationManifest from '../../assets/educational-content/manifest.json';

class EducationService {
  private manifest: EducationManifest;
  private currentProgress: UserEducationProgress | null = null;

  constructor() {
    this.manifest = educationManifest as EducationManifest;
  }

  /**
   * Initialize the education service and load user progress
   */
  async initialize(userId: string): Promise<void> {
    try {
      const existingProgress = await this.loadUserProgress(userId);
      if (existingProgress) {
        this.currentProgress = existingProgress;
      } else {
        // Create new progress for user
        this.currentProgress = {
          userId,
          modules: [],
          totalTimeSpent: 0,
          lastAccessedAt: new Date(),
          preferredLanguage: 'en',
        };
        await this.saveUserProgress();
      }
    } catch (error) {
      console.error('Failed to initialize education service:', error);
      throw error;
    }
  }

  /**
   * Get all available education modules
   */
  getModules(): EducationModule[] {
    return this.manifest.modules;
  }

  /**
   * Get a specific module by ID
   */
  getModule(moduleId: string): EducationModule | null {
    return this.manifest.modules.find(module => module.id === moduleId) || null;
  }

  /**
   * Get modules by category
   */
  getModulesByCategory(category: string): EducationModule[] {
    return this.manifest.modules.filter(module => module.category === category);
  }

  /**
   * Get user's progress for all modules
   */
  getUserProgress(): UserEducationProgress | null {
    return this.currentProgress;
  }

  /**
   * Get progress for a specific module
   */
  getModuleProgress(moduleId: string): ModuleProgress | null {
    if (!this.currentProgress) return null;
    return (
      this.currentProgress.modules.find(m => m.moduleId === moduleId) || null
    );
  }

  /**
   * Start a new module
   */
  async startModule(moduleId: string): Promise<void> {
    if (!this.currentProgress)
      throw new Error('Education service not initialized');

    const existingProgress = this.getModuleProgress(moduleId);
    if (existingProgress) {
      // Module already started, just update last accessed
      this.currentProgress.lastAccessedAt = new Date();
      await this.saveUserProgress();
      return;
    }

    const module = this.getModule(moduleId);
    if (!module) throw new Error(`Module ${moduleId} not found`);

    const newModuleProgress: ModuleProgress = {
      moduleId,
      startedAt: new Date(),
      lessonsProgress: module.lessons.map(lesson => ({
        lessonId: lesson.id,
        completed: false,
      })),
      totalTimeSpent: 0,
      isCompleted: false,
      completionPercentage: 0,
    };

    this.currentProgress.modules.push(newModuleProgress);
    this.currentProgress.lastAccessedAt = new Date();
    await this.saveUserProgress();
  }

  /**
   * Mark a lesson as completed
   */
  async completeLesson(
    moduleId: string,
    lessonId: string,
    timeSpent: number,
    quizScore?: number
  ): Promise<void> {
    if (!this.currentProgress)
      throw new Error('Education service not initialized');

    const moduleProgress = this.getModuleProgress(moduleId);
    if (!moduleProgress) {
      await this.startModule(moduleId);
      return this.completeLesson(moduleId, lessonId, timeSpent, quizScore);
    }

    const lessonProgress = moduleProgress.lessonsProgress.find(
      l => l.lessonId === lessonId
    );
    if (!lessonProgress)
      throw new Error(`Lesson ${lessonId} not found in module ${moduleId}`);

    // Update lesson progress
    lessonProgress.completed = true;
    lessonProgress.completedAt = new Date();
    lessonProgress.timeSpent = (lessonProgress.timeSpent || 0) + timeSpent;
    if (quizScore !== undefined) {
      lessonProgress.quizScore = quizScore;
    }

    // Update module progress
    moduleProgress.totalTimeSpent += timeSpent;
    this.currentProgress.totalTimeSpent += timeSpent;

    // Calculate completion percentage
    const completedLessons = moduleProgress.lessonsProgress.filter(
      l => l.completed
    ).length;
    moduleProgress.completionPercentage =
      (completedLessons / moduleProgress.lessonsProgress.length) * 100;

    // Check if module is completed
    if (moduleProgress.completionPercentage === 100) {
      moduleProgress.isCompleted = true;
      moduleProgress.completedAt = new Date();
    }

    this.currentProgress.lastAccessedAt = new Date();
    await this.saveUserProgress();
  }

  /**
   * Complete module final quiz
   */
  async completeModuleFinalQuiz(
    moduleId: string,
    score: number
  ): Promise<void> {
    if (!this.currentProgress)
      throw new Error('Education service not initialized');

    const moduleProgress = this.getModuleProgress(moduleId);
    if (!moduleProgress) throw new Error(`Module ${moduleId} not started`);

    moduleProgress.finalQuizScore = score;
    this.currentProgress.lastAccessedAt = new Date();
    await this.saveUserProgress();
  }

  /**
   * Set user's preferred language
   */
  async setPreferredLanguage(language: 'en' | 'fr'): Promise<void> {
    if (!this.currentProgress)
      throw new Error('Education service not initialized');

    this.currentProgress.preferredLanguage = language;
    await this.saveUserProgress();
    // Language is saved as part of saveUserProgress, no need for separate call
  }

  /**
   * Get user's preferred language
   */
  getPreferredLanguage(): 'en' | 'fr' {
    return this.currentProgress?.preferredLanguage || 'en';
  }

  /**
   * Load lesson content from asset files
   */
  async loadLessonContent(contentPath: string): Promise<string> {
    try {
      // Static content mapping for actual content files
      const contentMap: { [key: string]: () => Promise<any> } = {
        'en/budgeting-newcomers/01-banking-basics.md': () =>
          import(
            '../../assets/educational-content/en/budgeting-newcomers/01-banking-basics.md'
          ),
        'en/budgeting-newcomers/02-first-budget.md': () =>
          import(
            '../../assets/educational-content/en/budgeting-newcomers/02-first-budget.md'
          ),
        'en/budgeting-newcomers/03-cost-of-living.md': () =>
          import(
            '../../assets/educational-content/en/budgeting-newcomers/03-cost-of-living.md'
          ),
        'en/understanding-credit-canada/01-what-is-credit.md': () =>
          import(
            '../../assets/educational-content/en/understanding-credit-canada/01-what-is-credit.md'
          ),
        'en/understanding-credit-canada/02-credit-scores.md': () =>
          import(
            '../../assets/educational-content/en/understanding-credit-canada/02-credit-scores.md'
          ),
        'en/understanding-credit-canada/03-building-credit.md': () =>
          import(
            '../../assets/educational-content/en/understanding-credit-canada/03-building-credit.md'
          ),
      };

      const contentImporter = contentMap[contentPath];
      if (contentImporter) {
        const module = await contentImporter();
        return module.default || module;
      } else {
        console.warn(
          `No content mapping found for ${contentPath}, using placeholder`
        );
        return this.getPlaceholderContent(contentPath);
      }
    } catch (error) {
      console.warn(
        `Failed to load content from ${contentPath}, using placeholder:`,
        error
      );
      return this.getPlaceholderContent(contentPath);
    }
  }

  /**
   * Generate placeholder content when asset loading fails
   */
  private getPlaceholderContent(contentPath: string): string {
    const filename =
      contentPath.split('/').pop()?.replace('.md', '') || 'lesson';
    const title = filename
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return `# ${title}

This lesson content is being loaded from:
\`${contentPath}\`

## Sample Content Structure

This is a placeholder while the content loading system is being developed. In a production app, this would contain:

- **Educational material** relevant to Canadian financial literacy
- **Interactive elements** to engage users
- **Quebec French translations** for accessibility
- **Practical examples** specific to the Canadian context

### Key Learning Points

1. Understanding financial concepts
2. Practical application in daily life
3. Canadian-specific considerations
4. Building healthy financial habits

---

*This content will be replaced with actual educational material once the content loading system is fully implemented.*`;
  }

  /**
   * Load quiz data from asset files
   */
  async loadQuizData(quizPath: string): Promise<Quiz> {
    try {
      // Static quiz mapping for actual quiz files
      const quizMap: { [key: string]: () => Promise<any> } = {
        'en/budgeting-newcomers/final-quiz.json': () =>
          import(
            '../../assets/educational-content/en/budgeting-newcomers/final-quiz.json'
          ),
        'en/understanding-credit-canada/quiz.json': () =>
          import(
            '../../assets/educational-content/en/understanding-credit-canada/quiz.json'
          ),
        'en/understanding-credit-canada/final-quiz.json': () =>
          import(
            '../../assets/educational-content/en/understanding-credit-canada/final-quiz.json'
          ),
      };

      const quizImporter = quizMap[quizPath];
      if (quizImporter) {
        const quizModule = await quizImporter();
        const quizData = quizModule.default || quizModule;

        // Transform the JSON format to our Quiz interface
        return {
          id: quizData.title?.toLowerCase().replace(/\s+/g, '-') || 'quiz',
          title: { en: quizData.title || 'Quiz', fr: quizData.title || 'Quiz' },
          description: {
            en: quizData.description || 'Test your knowledge',
            fr: quizData.description || 'Testez vos connaissances',
          },
          questions: quizData.questions.map((q: any) => ({
            id: q.id,
            type:
              q.type === 'multiple-choice' ? 'multiple-choice' : 'true-false',
            question: { en: q.question, fr: q.question },
            options: q.options || undefined,
            correctAnswer: q.correctAnswer,
            explanation: { en: q.explanation, fr: q.explanation },
            points: q.points || 10,
          })),
          passingScore: quizData.passingScore || 70,
        };
      } else {
        console.warn(
          `No quiz mapping found for ${quizPath}, using placeholder`
        );
        return this.getPlaceholderQuiz();
      }
    } catch (error) {
      console.error(`Failed to load quiz from ${quizPath}:`, error);
      return this.getPlaceholderQuiz();
    }
  }

  /**
   * Generate placeholder quiz when asset loading fails
   */
  private getPlaceholderQuiz(): Quiz {
    return {
      id: 'placeholder-quiz',
      title: { en: 'Sample Quiz', fr: "Quiz d'exemple" },
      description: {
        en: 'A sample quiz for testing',
        fr: "Un quiz d'exemple pour les tests",
      },
      questions: [
        {
          id: 'q1',
          type: 'true-false',
          question: {
            en: 'This is a sample question.',
            fr: "Ceci est une question d'exemple.",
          },
          correctAnswer: 'true',
          explanation: {
            en: 'This is the explanation.',
            fr: "Ceci est l'explication.",
          },
          points: 10,
        },
      ],
      passingScore: 70,
    };
  }

  /**
   * Get overall learning statistics
   */
  getLearningStats(): {
    totalModules: number;
    completedModules: number;
    totalTimeSpent: number;
    completionPercentage: number;
  } {
    if (!this.currentProgress) {
      return {
        totalModules: this.manifest.modules.length,
        completedModules: 0,
        totalTimeSpent: 0,
        completionPercentage: 0,
      };
    }

    const completedModules = this.currentProgress.modules.filter(
      m => m.isCompleted
    ).length;
    const completionPercentage =
      (completedModules / this.manifest.modules.length) * 100;

    return {
      totalModules: this.manifest.modules.length,
      completedModules,
      totalTimeSpent: this.currentProgress.totalTimeSpent,
      completionPercentage,
    };
  }

  /**
   * Reset all progress (for testing or user request)
   */
  async resetProgress(): Promise<void> {
    if (!this.currentProgress)
      throw new Error('Education service not initialized');

    const userId = this.currentProgress.userId;
    const language = this.currentProgress.preferredLanguage;

    this.currentProgress = {
      userId,
      modules: [],
      totalTimeSpent: 0,
      lastAccessedAt: new Date(),
      preferredLanguage: language,
    };

    await this.saveUserProgress();

    // Clear all education-specific storage data
    await EducationStorage.clearEducationData();
  }

  /**
   * Save quiz result with detailed tracking
   */
  async saveQuizResult(
    moduleId: string,
    quizId: string,
    result: {
      score: number;
      totalQuestions: number;
      correctAnswers: number;
      timeSpent: number;
      completedAt: Date;
      answers: Array<{
        questionId: string;
        userAnswer: string;
        correct: boolean;
      }>;
    }
  ): Promise<void> {
    await EducationStorage.saveQuizResult(moduleId, quizId, result);
  }

  /**
   * Load quiz result history
   */
  async getQuizResult(moduleId: string, quizId: string): Promise<any> {
    return await EducationStorage.loadQuizResult(moduleId, quizId);
  }

  /**
   * Track time spent in a module
   */
  async trackModuleTime(moduleId: string, timeSpent: number): Promise<void> {
    const currentTime =
      (await EducationStorage.loadModuleCompletionTime(moduleId)) || 0;
    await EducationStorage.saveModuleCompletionTime(
      moduleId,
      currentTime + timeSpent
    );
  }

  /**
   * Get total time spent in a module
   */
  async getModuleTimeSpent(moduleId: string): Promise<number> {
    return (await EducationStorage.loadModuleCompletionTime(moduleId)) || 0;
  }

  /**
   * Bookmark a lesson
   */
  async bookmarkLesson(moduleId: string, lessonId: string): Promise<void> {
    await EducationStorage.bookmarkLesson(moduleId, lessonId);
  }

  /**
   * Remove bookmark from lesson
   */
  async removeBookmark(moduleId: string, lessonId: string): Promise<void> {
    await EducationStorage.removeBookmark(moduleId, lessonId);
  }

  /**
   * Check if lesson is bookmarked
   */
  async isLessonBookmarked(
    moduleId: string,
    lessonId: string
  ): Promise<boolean> {
    return await EducationStorage.isLessonBookmarked(moduleId, lessonId);
  }

  /**
   * Get all bookmarked lessons
   */
  async getAllBookmarks(): Promise<
    Array<{ moduleId: string; lessonId: string }>
  > {
    return await EducationStorage.getAllBookmarks();
  }

  /**
   * Save detailed lesson progress
   */
  async saveLessonProgress(
    moduleId: string,
    lessonId: string,
    progress: {
      timeSpent: number;
      scrollPosition?: number;
      notes?: string;
      completed: boolean;
      lastAccessedAt: Date;
    }
  ): Promise<void> {
    await EducationStorage.saveLessonProgress(moduleId, lessonId, progress);
  }

  /**
   * Load detailed lesson progress
   */
  async getLessonProgress(moduleId: string, lessonId: string): Promise<any> {
    return await EducationStorage.loadLessonProgress(moduleId, lessonId);
  }

  /**
   * Get last accessed module for quick resume
   */
  async getLastAccessedModule(): Promise<string | null> {
    return await getString(STORAGE_KEYS.EDUCATION_LAST_ACCESSED_MODULE);
  }

  /**
   * Get comprehensive learning analytics
   */
  async getLearningAnalytics(): Promise<{
    totalTimeSpent: number;
    modulesStarted: number;
    modulesCompleted: number;
    lessonsCompleted: number;
    quizzesCompleted: number;
    averageQuizScore: number;
    bookmarkedLessons: number;
    streakDays: number;
    lastActivityDate: Date | null;
  }> {
    const stats = this.getLearningStats();
    const bookmarks = await this.getAllBookmarks();

    // Calculate additional metrics
    let totalQuizzes = 0;
    let totalQuizScore = 0;
    let lessonsCompleted = 0;

    if (this.currentProgress) {
      for (const moduleProgress of this.currentProgress.modules) {
        lessonsCompleted += moduleProgress.lessonsProgress.filter(
          l => l.completed
        ).length;

        // Count quizzes and scores
        for (const lessonProgress of moduleProgress.lessonsProgress) {
          if (lessonProgress.quizScore !== undefined) {
            totalQuizzes++;
            totalQuizScore += lessonProgress.quizScore;
          }
        }
      }
    }

    return {
      totalTimeSpent: stats.totalTimeSpent,
      modulesStarted: this.currentProgress?.modules.length || 0,
      modulesCompleted: stats.completedModules,
      lessonsCompleted,
      quizzesCompleted: totalQuizzes,
      averageQuizScore: totalQuizzes > 0 ? totalQuizScore / totalQuizzes : 0,
      bookmarkedLessons: bookmarks.length,
      streakDays: 0, // TODO: Implement streak calculation
      lastActivityDate: this.currentProgress?.lastAccessedAt || null,
    };
  }

  /**
   * Save user progress to AsyncStorage
   */
  private async saveUserProgress(): Promise<void> {
    if (!this.currentProgress) return;

    try {
      const progressData = {
        ...this.currentProgress,
        lastAccessedAt: this.currentProgress.lastAccessedAt.toISOString(),
      };

      // Use the standardized storage utility
      await storeObject(STORAGE_KEYS.EDUCATION_PROGRESS, progressData);

      // Also save last accessed module for quick access
      if (this.currentProgress.modules.length > 0) {
        const lastModule = this.currentProgress.modules.sort(
          (a, b) =>
            (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0)
        )[0];
        await storeString(
          STORAGE_KEYS.EDUCATION_LAST_ACCESSED_MODULE,
          lastModule.moduleId
        );
      }

      // Save preferred language separately for quick access
      await storeString(
        STORAGE_KEYS.EDUCATION_PREFERRED_LANGUAGE,
        this.currentProgress.preferredLanguage
      );
    } catch (error) {
      console.error('Failed to save user progress:', error);
      throw error;
    }
  }

  /**
   * Load user progress from AsyncStorage
   */
  private async loadUserProgress(
    userId: string
  ): Promise<UserEducationProgress | null> {
    try {
      // Use the standardized storage utility
      const progressData = await getObject<any>(
        STORAGE_KEYS.EDUCATION_PROGRESS
      );
      if (!progressData) return null;

      // Verify it's for the correct user
      if (progressData.userId !== userId) return null;

      // Convert date strings back to Date objects
      progressData.lastAccessedAt = new Date(progressData.lastAccessedAt);
      progressData.modules.forEach((module: any) => {
        if (module.startedAt) {
          module.startedAt = new Date(module.startedAt);
        }
        if (module.completedAt) {
          module.completedAt = new Date(module.completedAt);
        }
        module.lessonsProgress.forEach((lesson: any) => {
          if (lesson.completedAt) {
            lesson.completedAt = new Date(lesson.completedAt);
          }
        });
      });

      return progressData as UserEducationProgress;
    } catch (error) {
      console.error('Failed to load user progress:', error);
      return null;
    }
  }
}

// Export singleton instance
export const educationService = new EducationService();
export default educationService;
