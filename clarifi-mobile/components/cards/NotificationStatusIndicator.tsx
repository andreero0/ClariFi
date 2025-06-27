import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { CardNotificationPreferencesService } from '../../services/notifications/cardNotificationPreferences';
import { CreditCard } from '../../types/creditCard';

interface NotificationStatusIndicatorProps {
  card: CreditCard;
  onPress?: () => void;
  compact?: boolean;
}

export const NotificationStatusIndicator: React.FC<
  NotificationStatusIndicatorProps
> = ({ card, onPress, compact = false }) => {
  const { theme } = useTheme();
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotificationStatus();
  }, [card.id]);

  const loadNotificationStatus = async () => {
    try {
      setLoading(true);
      const service = CardNotificationPreferencesService.getInstance();
      const preferences = await service.getCardPreferences(card.id);
      setIsEnabled(preferences.enabled);
    } catch (error) {
      console.error('Failed to load notification status:', error);
      setIsEnabled(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = async () => {
    try {
      const service = CardNotificationPreferencesService.getInstance();
      const currentPreferences = await service.getCardPreferences(card.id);
      const newPreferences = {
        ...currentPreferences,
        enabled: !currentPreferences.enabled,
      };

      await service.updateCardPreferences(card.id, newPreferences);
      setIsEnabled(newPreferences.enabled);
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      toggleNotifications();
    }
  };

  const getStatusColor = () => {
    if (loading) return theme.textSecondary;
    return isEnabled ? '#4CAF50' : theme.textSecondary;
  };

  const getStatusIcon = () => {
    if (loading) return 'hourglass-outline';
    return isEnabled ? 'notifications' : 'notifications-off';
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: compact ? 4 : 8,
      paddingVertical: compact ? 2 : 4,
      borderRadius: compact ? 12 : 16,
      backgroundColor: loading
        ? theme.backgroundSecondary
        : isEnabled
          ? '#4CAF5020'
          : theme.backgroundSecondary,
      borderWidth: 1,
      borderColor: loading
        ? theme.border
        : isEnabled
          ? '#4CAF50'
          : theme.border,
    },
    icon: {
      marginRight: compact ? 2 : 4,
    },
    statusText: {
      fontSize: compact ? 10 : 12,
      fontWeight: '500',
      color: getStatusColor(),
    },
    compactContainer: {
      paddingHorizontal: 6,
      paddingVertical: 3,
      minWidth: compact ? 24 : 32,
      justifyContent: 'center',
    },
  });

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.container, styles.compactContainer]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Ionicons name={getStatusIcon()} size={14} color={getStatusColor()} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={getStatusIcon()}
        size={16}
        color={getStatusColor()}
        style={styles.icon}
      />
      <Text style={styles.statusText}>
        {loading ? 'Loading...' : isEnabled ? 'On' : 'Off'}
      </Text>
    </TouchableOpacity>
  );
};
