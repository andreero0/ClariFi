import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useStorage } from '../providers/StorageProvider';

interface StorageStats {
  totalSize: number;
  totalSizeKB: number;
  itemCount: number;
  lastSync: string | null;
  version: string;
}

interface StorageSettingsProps {
  onNavigateBack?: () => void;
}

export const StorageSettings: React.FC<StorageSettingsProps> = ({
  onNavigateBack,
}) => {
  const storage = useStorage();
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  useEffect(() => {
    loadStorageStats();
  }, []);

  const loadStorageStats = async () => {
    try {
      setIsLoading(true);
      const storageStats = await storage.getStorageStats();
      setStats(storageStats);
    } catch (error) {
      console.error('Failed to load storage stats:', error);
      Alert.alert('Error', 'Failed to load storage statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setIsLoading(true);

      const backup = await storage.createBackup();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `clarifi-backup-${timestamp}.json`;

      // Save backup to device
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, backup);

      // Share the backup file
      await Share.share({
        url: fileUri,
        message: 'ClariFi Data Backup',
      });

      Alert.alert(
        'Backup Created',
        `Your data has been backed up to ${filename}. You can now save it to your preferred location.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to create backup:', error);
      Alert.alert('Error', 'Failed to create backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const fileUri = result.assets[0].uri;
        const backupData = await FileSystem.readAsStringAsync(fileUri);

        Alert.alert(
          'Restore Data',
          'This will replace all current data with the backup data. This action cannot be undone. Continue?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Restore',
              style: 'destructive',
              onPress: async () => {
                try {
                  setIsLoading(true);
                  await storage.restoreFromBackup(backupData);
                  await loadStorageStats();
                  Alert.alert('Success', 'Data restored successfully');
                } catch (error) {
                  console.error('Failed to restore backup:', error);
                  Alert.alert(
                    'Error',
                    'Failed to restore backup. Please check the file format.'
                  );
                } finally {
                  setIsLoading(false);
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Failed to restore backup:', error);
      Alert.alert('Error', 'Failed to select backup file');
    }
  };

  const handleSyncData = async () => {
    try {
      setIsLoading(true);
      await storage.syncAllData();
      await loadStorageStats();
      Alert.alert('Success', 'Data synchronized successfully');
    } catch (error) {
      console.error('Failed to sync data:', error);
      Alert.alert('Error', 'Failed to synchronize data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your achievements, progress, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await storage.clearAllData();
              await loadStorageStats();
              Alert.alert('Success', 'All data cleared successfully');
            } catch (error) {
              console.error('Failed to clear data:', error);
              Alert.alert('Error', 'Failed to clear data');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      setIsLoading(true);

      const exportData = await storage.exportData();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `clarifi-export-${timestamp}.json`;

      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, exportData);

      await Share.share({
        url: fileUri,
        message: 'ClariFi Data Export',
      });

      Alert.alert(
        'Data Exported',
        'Your data has been exported successfully.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to export data:', error);
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {onNavigateBack && (
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
      )}
      <Text style={styles.headerTitle}>Storage Settings</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderStorageStats = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Storage Statistics</Text>

      {stats ? (
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Storage Used</Text>
            <Text style={styles.statValue}>
              {formatFileSize(stats.totalSize)}
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Data Items</Text>
            <Text style={styles.statValue}>{stats.itemCount}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Storage Version</Text>
            <Text style={styles.statValue}>{stats.version}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Last Sync</Text>
            <Text style={styles.statValue}>{formatDate(stats.lastSync)}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Loading statistics...</Text>
        </View>
      )}

      <TouchableOpacity style={styles.refreshButton} onPress={loadStorageStats}>
        <Ionicons name="refresh" size={16} color="#007AFF" />
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDataManagement = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Data Management</Text>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleSyncData}
        disabled={isLoading}
      >
        <Ionicons name="sync" size={20} color="#007AFF" />
        <Text style={styles.actionButtonText}>Sync Data Now</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleCreateBackup}
        disabled={isLoading}
      >
        <Ionicons name="archive" size={20} color="#28a745" />
        <Text style={styles.actionButtonText}>Create Backup</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleRestoreBackup}
        disabled={isLoading}
      >
        <Ionicons name="cloud-download" size={20} color="#007AFF" />
        <Text style={styles.actionButtonText}>Restore from Backup</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleExportData}
        disabled={isLoading}
      >
        <Ionicons name="download" size={20} color="#6f42c1" />
        <Text style={styles.actionButtonText}>Export Data</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>
    </View>
  );

  const renderDangerZone = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Danger Zone</Text>

      <TouchableOpacity
        style={[styles.actionButton, styles.dangerButton]}
        onPress={handleClearData}
        disabled={isLoading}
      >
        <Ionicons name="trash" size={20} color="#dc3545" />
        <Text style={[styles.actionButtonText, styles.dangerText]}>
          Clear All Data
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>
    </View>
  );

  if (isLoading && !stats) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading storage settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderStorageStats()}
        {renderDataManagement()}
        {renderDangerZone()}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingModal}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingModalText}>Processing...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsContainer: {
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  refreshButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  actionButtonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  dangerButton: {
    borderBottomColor: '#ffeaa7',
    backgroundColor: '#fef9e7',
    borderRadius: 8,
    marginTop: 8,
    paddingHorizontal: 12,
  },
  dangerText: {
    color: '#dc3545',
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingModal: {
    backgroundColor: 'white',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loadingModalText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
  },
  bottomPadding: {
    height: 40,
  },
});

export default StorageSettings;
