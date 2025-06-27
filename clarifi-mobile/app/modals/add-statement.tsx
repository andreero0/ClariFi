import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import StatementScanner from '../../components/statements/StatementScanner';
import { colors } from '../../constants';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

const AddStatementModal: React.FC = () => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStatementScanned = (result: {
    statementId: string;
    message: string;
  }) => {
    setIsProcessing(true);

    // Show success and navigate back
    setTimeout(() => {
      Alert.alert(
        'Statement Processing Started',
        "Your statement is being processed. You'll be notified when it's complete.",
        [
          {
            text: 'OK',
            onPress: () => {
              setIsProcessing(false);
              router.back();
            },
          },
        ]
      );
    }, 1000);
  };

  const handleProcessingUpdate = (status: any) => {
    console.log('Processing update:', status);
    // Could show progress updates here
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* PRD: Modal header with close button */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <Text style={styles.title}>Import Statement</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* PRD: Statement upload interface */}
      <View style={styles.content}>
        <StatementScanner
          onStatementScanned={handleStatementScanned}
          onProcessingUpdate={handleProcessingUpdate}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  // PRD: Modal header with close button
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightest,
  },
  headerLeft: {
    width: 24, // Balance the close button
  },
  title: {
    ...textStyles.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
});

export default AddStatementModal;
