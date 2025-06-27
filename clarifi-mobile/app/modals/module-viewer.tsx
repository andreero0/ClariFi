import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ModuleViewer } from '../../components/education/ModuleViewer';
import { educationService } from '../../services/education';
import {
  EducationModule,
  ModuleProgress,
  UserEducationProgress,
} from '../../types/education';

export default function ModuleViewerModal() {
  const { moduleId, lessonId } = useLocalSearchParams<{
    moduleId: string;
    lessonId?: string;
  }>();

  const [module, setModule] = useState<EducationModule | null>(null);
  const [userProgress, setUserProgress] = useState<ModuleProgress | null>(null);
  const [language, setLanguage] = useState<'en' | 'fr'>('en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeModuleViewer();
  }, [moduleId]);

  const initializeModuleViewer = async () => {
    try {
      setLoading(true);

      // Get the module data
      const moduleData = educationService.getModule(moduleId);
      if (!moduleData) {
        console.error(`Module ${moduleId} not found`);
        router.back();
        return;
      }

      // Get user progress for this module
      const progress = educationService.getModuleProgress(moduleId);

      // Get user's preferred language
      const preferredLanguage = educationService.getPreferredLanguage();

      setModule(moduleData);
      setUserProgress(progress);
      setLanguage(preferredLanguage);
    } catch (error) {
      console.error('Failed to initialize module viewer:', error);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleLessonComplete = async (lessonId: string, timeSpent: number) => {
    try {
      await educationService.completeLesson(moduleId, lessonId, timeSpent);

      // Refresh user progress
      const updatedProgress = educationService.getModuleProgress(moduleId);
      setUserProgress(updatedProgress);
    } catch (error) {
      console.error('Failed to complete lesson:', error);
    }
  };

  const handleNavigateToLesson = (lessonId: string) => {
    // Update the URL to include the current lesson
    router.setParams({ lessonId });
  };

  const handleBackToHub = () => {
    router.back();
  };

  if (loading || !module) {
    return null; // Could add a loading spinner here
  }

  return (
    <ModuleViewer
      module={module}
      currentLessonId={lessonId}
      userProgress={userProgress}
      language={language}
      onLessonComplete={handleLessonComplete}
      onNavigateToLesson={handleNavigateToLesson}
      onBackToHub={handleBackToHub}
    />
  );
}

const styles = StyleSheet.create({
  // Add any modal-specific styles here if needed
});
