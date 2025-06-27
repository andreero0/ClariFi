import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DataExportOptionsScreen from '../../components/privacy/DataExportOptionsScreen';

export default function DataExportModal() {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <DataExportOptionsScreen onClose={handleClose} />
    </SafeAreaView>
  );
}
