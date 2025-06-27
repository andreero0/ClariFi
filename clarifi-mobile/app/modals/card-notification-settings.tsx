import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CardNotificationSettings } from '../../components/cards/CardNotificationSettings';

export default function CardNotificationSettingsModal() {
  const router = useRouter();
  const { cardId, cardName } = useLocalSearchParams<{
    cardId: string;
    cardName: string;
  }>();

  if (!cardId || !cardName) {
    router.back();
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CardNotificationSettings
        cardId={cardId}
        cardName={cardName}
        isModal={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Platform.OS === 'ios' ? '#f8f9fa' : '#ffffff',
  },
});
