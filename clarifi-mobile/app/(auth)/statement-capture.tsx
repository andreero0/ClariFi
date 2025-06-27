import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { translate } from '../../i18n';
import { colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

interface SelectedFile {
  name: string;
  uri: string;
  size: number;
  mimeType: string;
}

const StatementCaptureScreen = () => {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handlePickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/csv', 'application/vnd.ms-excel'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles: SelectedFile[] = result.assets.map(asset => ({
          name: asset.name,
          uri: asset.uri,
          size: asset.size || 0,
          mimeType: asset.mimeType || 'application/octet-stream',
        }));

        setSelectedFiles(prev => [...prev, ...newFiles]);
      }
    } catch (error) {
      console.error('Error picking files:', error);
      Alert.alert(
        translate('common.error'),
        'Failed to select files. Please try again.'
      );
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return 'document-text';
    if (mimeType.includes('csv') || mimeType.includes('excel')) return 'grid';
    return 'document';
  };

  const handleProcessStatements = async () => {
    if (selectedFiles.length === 0) {
      Alert.alert(
        translate('common.error'),
        translate('auth.statementCaptureNoFiles')
      );
      return;
    }

    setIsUploading(true);

    try {
      // Navigate to processing screen
      router.push('/(auth)/statement-processing');
    } catch (error) {
      console.error('Error processing statements:', error);
      Alert.alert(
        translate('common.error'),
        'Failed to process statements. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Statement Upload',
      'You can upload your statements later from the settings. Continue to dashboard?',
      [
        { text: translate('common.cancel'), style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            // Skip directly to dashboard without confetti/celebration
            router.replace('/(tabs)/dashboard');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Ionicons
            name="cloud-upload-outline"
            size={80}
            color={colors.primary}
            style={styles.headerIcon}
          />
          <Text style={styles.title}>
            {translate('auth.statementCaptureTitle')}
          </Text>
          <Text style={styles.subtitle}>
            {translate('auth.statementCaptureSubtitle')}
          </Text>
        </View>

        <View style={styles.content}>
          <TouchableOpacity style={styles.pickButton} onPress={handlePickFiles}>
            <Ionicons name="add-circle-outline" size={24} color="white" />
            <Text style={styles.pickButtonText}>
              {translate('auth.statementCapturePickButton')}
            </Text>
          </TouchableOpacity>

          {selectedFiles.length > 0 && (
            <View style={styles.filesContainer}>
              <Text style={styles.filesTitle}>
                Selected Files ({selectedFiles.length})
              </Text>
              {selectedFiles.map((file, index) => (
                <View key={index} style={styles.fileItem}>
                  <View style={styles.fileInfo}>
                    <Ionicons
                      name={getFileIcon(file.mimeType) as any}
                      size={24}
                      color={colors.primary}
                      style={styles.fileIcon}
                    />
                    <View style={styles.fileDetails}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Text style={styles.fileSize}>
                        {formatFileSize(file.size)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFile(index)}
                  >
                    <Ionicons
                      name="close-circle"
                      size={24}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.tipContainer}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.tipText}>
              Upload PDF or CSV bank statements from the last 3-6 months for the
              best financial insights.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.processButton,
            selectedFiles.length === 0 && styles.disabledButton,
          ]}
          onPress={handleProcessStatements}
          disabled={selectedFiles.length === 0 || isUploading}
        >
          {isUploading ? (
            <Text style={styles.processButtonText}>
              {translate('common.loading')}
            </Text>
          ) : (
            <>
              <Ionicons name="arrow-forward" size={20} color="white" />
              <Text style={styles.processButtonText}>
                {translate('auth.statementCaptureUploadButton')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerIcon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  pickButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  pickButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  filesContainer: {
    marginBottom: 20,
  },
  filesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  fileItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.neutral.light,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileIcon: {
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  removeButton: {
    padding: 4,
  },
  tipContainer: {
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    gap: 16,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  skipButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  processButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    minHeight: 52,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: colors.neutral.medium,
    shadowOpacity: 0,
  },
  processButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StatementCaptureScreen;
