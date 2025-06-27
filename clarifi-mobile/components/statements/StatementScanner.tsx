import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import CustomButton from '../ui/Button';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { statementProcessingService } from '../../services/statements/statementProcessingService';
import { limitValidationService } from '../../services/validation/limitValidationService';
import { useAuth } from '../../context/AuthContext';

interface StatementScannerProps {
  onStatementScanned: (result: {
    statementId: string;
    message: string;
  }) => void;
  onProcessingUpdate?: (status: any) => void;
}

const StatementScanner: React.FC<StatementScannerProps> = ({
  onStatementScanned,
  onProcessingUpdate,
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const handleUploadFile = async (file: any) => {
    if (!user) {
      Alert.alert('Error', 'Please log in to upload statements');
      return;
    }

    setIsUploading(true);
    setUploadProgress('Checking upload limits...');

    try {
      // Check free tier limits
      const validation = await limitValidationService.validateDocumentUpload(
        user.id
      );

      if (!validation.isValid) {
        if (validation.showUpgrade) {
          limitValidationService.showUpgradePrompt(validation.error!, () => {
            // Navigate to upgrade screen
            console.log('Navigate to upgrade');
          });
        } else {
          Alert.alert('Upload Limit Reached', validation.error!);
        }
        return;
      }

      setUploadProgress('Uploading file...');

      // Upload and process statement
      const result = await statementProcessingService.uploadStatement({
        uri: file.uri,
        name: file.name || 'statement.pdf',
        type: file.mimeType || file.type || 'application/pdf',
      });

      if (result.success) {
        setUploadProgress('Processing statement...');

        // Record successful upload in usage tracking
        await limitValidationService.recordSuccessfulAction(
          user.id,
          'upload_document'
        );

        // Start polling for processing updates
        if (onProcessingUpdate) {
          statementProcessingService.pollProcessingStatus(
            result.statementId,
            onProcessingUpdate
          );
        }

        onStatementScanned({
          statementId: result.statementId,
          message: result.message,
        });

        Alert.alert(
          'Upload Successful',
          'Your statement is being processed. You will be notified when complete.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Upload Failed', result.error || 'Please try again');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Error', 'Something went wrong. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const handleTakePicture = async () => {
    try {
      // Request camera permissions
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access to capture statements.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        await handleUploadFile({
          uri: result.assets[0].uri,
          name: `statement_${Date.now()}.jpg`,
          type: 'image/jpeg',
        });
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Camera Error', 'Unable to take picture. Please try again.');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      // Request media library permissions
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Gallery Permission Required',
          'Please allow gallery access to select statements.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        await handleUploadFile({
          uri: result.assets[0].uri,
          name: `statement_${Date.now()}.jpg`,
          type: 'image/jpeg',
        });
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Gallery Error', 'Unable to pick image. Please try again.');
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        await handleUploadFile({
          uri: file.uri,
          name: file.name,
          type: file.mimeType,
        });
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert(
        'Document Error',
        'Unable to pick document. Please try again.'
      );
    }
  };

  if (isUploading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2B5CE6" />
        <Text style={styles.progressText}>{uploadProgress}</Text>
        <Text style={styles.infoText}>
          Please wait while we process your statement...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Bank Statement</Text>

      <View style={styles.optionsContainer}>
        <CustomButton
          title="Take Photo"
          onPress={handleTakePicture}
          buttonStyle={styles.button}
          disabled={isUploading}
        />

        <CustomButton
          title="Choose from Gallery"
          onPress={handlePickFromGallery}
          variant="outline"
          buttonStyle={styles.button}
          disabled={isUploading}
        />

        <CustomButton
          title="Upload PDF Document"
          onPress={handlePickDocument}
          variant="outline"
          buttonStyle={styles.button}
          disabled={isUploading}
        />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          • Supports PDF files and images (JPG, PNG)
        </Text>
        <Text style={styles.infoText}>
          • Ensure all text is clear and readable
        </Text>
        <Text style={styles.infoText}>
          • Processing typically takes 1-2 minutes
        </Text>
        <Text style={styles.infoText}>
          • Free accounts: 1 document per month
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#2B5CE6',
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    marginBottom: 32,
    gap: 16,
  },
  button: {
    width: '100%',
    marginVertical: 4,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2B5CE6',
    marginTop: 16,
    textAlign: 'center',
  },
  infoContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginVertical: 2,
  },
});

export default StatementScanner;
