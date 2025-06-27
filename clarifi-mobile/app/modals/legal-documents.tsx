import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import LegalDocumentsScreen from '../../components/privacy/LegalDocumentsScreen';

export default function LegalDocumentsModal() {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LegalDocumentsScreen onClose={handleClose} initialDocument="privacy" />
    </SafeAreaView>
  );
}
