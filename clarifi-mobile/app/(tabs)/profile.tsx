import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
  Switch,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronRight,
  User,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  TrendingUp,
  Trophy,
  Moon,
  FileText,
  Settings,
  Fingerprint,
  Zap,
  Globe,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context';
import * as SPACING from '../../constants/spacing';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme: colors, isDarkMode, toggleTheme } = useTheme();
  const [darkModeEnabled, setDarkModeEnabled] = useState(isDarkMode);
  const {
    signOut,
    isSigningOut,
    user,
    checkBiometricSupport,
    isBiometricHardwareAvailable,
    isBiometricEnrolled,
    isBiometricLoginEnabled,
    enableBiometricLogin,
    disableBiometricLogin,
    isSettingUpBiometrics,
    error: authError,
    clearError,
  } = useAuth();

  useEffect(() => {
    checkBiometricSupport();
  }, [checkBiometricSupport]);

  useEffect(() => {
    if (
      authError &&
      (authError.name === 'BiometricSetupError' ||
        authError.name === 'BiometricAuthError' ||
        authError.name === 'StorageError')
    ) {
      Alert.alert('Biometric Setup', authError.message);
      clearError();
    }
  }, [authError, clearError]);

  const handleLogout = async () => {
    await signOut();
  };

  const handleEnableBiometrics = async () => {
    const success = await enableBiometricLogin();
    if (success) {
      Alert.alert('Success', 'Biometric login has been enabled.');
    }
  };

  const handleDisableBiometrics = async () => {
    const success = await disableBiometricLogin();
    if (success) {
      Alert.alert('Success', 'Biometric login has been disabled.');
    }
  };

  const handleToggleDarkMode = () => {
    const newValue = !darkModeEnabled;
    setDarkModeEnabled(newValue);
    toggleTheme();
  };

  // Sync local state with theme context
  useEffect(() => {
    setDarkModeEnabled(isDarkMode);
  }, [isDarkMode]);

  const renderMenuItem = ({
    title,
    icon: Icon,
    onPress,
    showArrow = true,
    rightElement = null,
    iconColor = colors.textSecondary,
  }) => (
    <TouchableOpacity
      style={[
        styles.menuItem,
        { backgroundColor: colors.surface || colors.backgroundSecondary },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View
          style={[
            styles.menuIconContainer,
            { backgroundColor: iconColor + '15' },
          ]}
        >
          <Icon size={20} color={iconColor} />
        </View>
        <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>
          {title}
        </Text>
      </View>
      {rightElement ||
        (showArrow && <ChevronRight size={20} color={colors.textSecondary} />)}
    </TouchableOpacity>
  );

  const renderMenuSection = ({ title, children }) => (
    <View style={styles.section}>
      {title && (
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {title}
        </Text>
      )}
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary || colors.appBackground,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      backgroundColor: colors.primary,
      paddingHorizontal: SPACING.MD || 16,
      paddingTop: SPACING.XL || 32,
      paddingBottom: SPACING.LG || 24,
    },
    profileSection: {
      alignItems: 'center',
      marginBottom: SPACING.MD || 16,
    },
    avatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#FFFFFF20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.MD || 16,
    },
    userName: {
      fontSize: 24,
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: SPACING.XS || 4,
      letterSpacing: -0.5,
    },
    userEmail: {
      fontSize: 16,
      color: '#FFFFFFB0',
      marginBottom: SPACING.MD || 16,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      paddingTop: SPACING.MD || 16,
      borderTopWidth: 1,
      borderTopColor: '#FFFFFF20',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: SPACING.XXS || 2,
    },
    statLabel: {
      fontSize: 12,
      color: '#FFFFFFB0',
    },
    section: {
      marginTop: SPACING.LG || 24,
      marginBottom: SPACING.SM || 8,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: '#718096',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: SPACING.SM || 12,
      marginHorizontal: SPACING.MD || 16,
    },
    sectionContent: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      marginHorizontal: SPACING.MD || 16,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: SPACING.MD || 16,
      paddingHorizontal: SPACING.MD || 16,
      borderBottomWidth: 1,
      borderBottomColor: '#F7F9FC',
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    menuIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.SM || 12,
    },
    menuItemText: {
      fontSize: 16,
      color: '#1A1F36',
      fontWeight: '400',
    },
    biometricStatus: {
      fontSize: 14,
      color: '#718096',
      marginTop: SPACING.XS || 4,
      marginRight: SPACING.SM || 12,
      flex: 1,
    },
    logoutButton: {
      backgroundColor: '#E53E3E10',
      borderRadius: 16,
      marginHorizontal: SPACING.MD || 16,
      marginTop: SPACING.LG || 24,
      marginBottom: SPACING.XL || 32,
      paddingVertical: SPACING.MD || 16,
      paddingHorizontal: SPACING.LG || 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E53E3E20',
    },
    logoutButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#E53E3E',
      letterSpacing: 0.5,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <User size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.userName}>{user?.name || 'Welcome'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>850</Text>
                <Text style={styles.statLabel}>Credit Score</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statLabel}>Achievements</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>3</Text>
                <Text style={styles.statLabel}>Credit Cards</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Financial Progress Section */}
        {renderMenuSection({
          title: 'Financial Progress',
          children: (
            <>
              {renderMenuItem({
                title: 'Insights & Analytics',
                icon: TrendingUp,
                iconColor: '#00C896',
                onPress: () => router.push('/(tabs)/insights'),
              })}
              {renderMenuItem({
                title: 'Achievements & Rewards',
                icon: Trophy,
                iconColor: '#F6AD55',
                onPress: () => router.push('/(tabs)/achievements'),
              })}
            </>
          ),
        })}

        {/* Account Settings Section */}
        {renderMenuSection({
          title: 'Account Settings',
          children: (
            <>
              {renderMenuItem({
                title: 'Dark Mode',
                icon: Moon,
                iconColor: '#6B5DD3',
                showArrow: false,
                rightElement: (
                  <Switch
                    value={darkModeEnabled}
                    onValueChange={handleToggleDarkMode}
                    trackColor={{
                      false: colors.borderLight || '#E2E8F0',
                      true: colors.primary,
                    }}
                    thumbColor={'#FFFFFF'}
                  />
                ),
              })}
              {renderMenuItem({
                title: 'Notification Settings',
                icon: Bell,
                iconColor: '#2B5CE6',
                onPress: () => router.push('/modals/notification-settings'),
              })}
              {renderMenuItem({
                title: 'Language',
                icon: Globe,
                iconColor: '#4B7BF5',
                onPress: () =>
                  Alert.alert(
                    'Coming Soon',
                    'Language selection will be available soon.'
                  ),
              })}
            </>
          ),
        })}

        {/* Security Section */}
        {renderMenuSection({
          title: 'Security & Privacy',
          children: (
            <>
              {renderMenuItem({
                title: 'Biometric Login',
                icon: Fingerprint,
                iconColor: '#00A76F',
                showArrow: false,
                rightElement: (
                  <View style={{ alignItems: 'flex-end', flex: 1 }}>
                    {isBiometricHardwareAvailable && isBiometricEnrolled && (
                      <Switch
                        value={isBiometricLoginEnabled}
                        onValueChange={
                          isBiometricLoginEnabled
                            ? handleDisableBiometrics
                            : handleEnableBiometrics
                        }
                        disabled={isSettingUpBiometrics}
                        trackColor={{ false: '#E2E8F0', true: '#00A76F' }}
                        thumbColor="#FFFFFF"
                      />
                    )}
                    {(!isBiometricHardwareAvailable ||
                      !isBiometricEnrolled) && (
                      <Text style={styles.biometricStatus}>
                        {!isBiometricHardwareAvailable
                          ? 'Not available'
                          : 'Not enrolled'}
                      </Text>
                    )}
                  </View>
                ),
              })}
              {renderMenuItem({
                title: 'Privacy Settings',
                icon: Shield,
                iconColor: '#2B5CE6',
                onPress: () => router.push('/modals/privacy-settings'),
              })}
              {renderMenuItem({
                title: 'Export My Data',
                icon: FileText,
                iconColor: '#718096',
                onPress: () => router.push('/modals/data-export'),
              })}
            </>
          ),
        })}

        {/* Support Section */}
        {renderMenuSection({
          title: 'Support',
          children: (
            <>
              {renderMenuItem({
                title: 'Help Center',
                icon: HelpCircle,
                iconColor: '#4B7BF5',
                onPress: () => router.push('/modals/help-center'),
              })}
              {renderMenuItem({
                title: 'Developer Options',
                icon: Settings,
                iconColor: '#718096',
                onPress: () =>
                  router.push('/modals/notification-test-dashboard'),
              })}
            </>
          ),
        })}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isSigningOut}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutButtonText}>
            {isSigningOut ? 'Logging out...' : 'Log Out'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
