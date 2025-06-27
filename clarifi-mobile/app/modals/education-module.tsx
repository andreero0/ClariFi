import React, { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { EducationHub } from '../../components/education';
import { educationService } from '../../services/education';

export default function EducationModuleModal() {
  const router = useRouter();
  const { moduleId } = useLocalSearchParams();
  const [language, setLanguage] = useState<'en' | 'fr'>('en');

  const handleModuleSelect = (selectedModuleId: string) => {
    // Navigate to the module viewer modal
    router.push({
      pathname: '/modals/module-viewer',
      params: { moduleId: selectedModuleId },
    });
  };

  const handleLanguageChange = (newLanguage: 'en' | 'fr') => {
    setLanguage(newLanguage);
  };

  return (
    <EducationHub
      modules={undefined} // Let the component load from service
      userProgress={undefined} // Let the component load from service
      language={language}
      onModuleSelect={handleModuleSelect}
      onLanguageChange={handleLanguageChange}
    />
  );
}
