import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Brain,
  Clock,
  TrendingUp,
  Settings,
  Check,
  Mail,
  MessageSquare,
  Smartphone,
  X,
} from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

const { width } = Dimensions.get('window');

interface UsagePattern {
  hour: number;
  engagement: number;
  label: string;
}

interface NotificationChannel {
  id: string;
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
  description: string;
}

const SmartNotificationTiming: React.FC = () => {
  const router = useRouter();
  const [aiLearningEnabled, setAiLearningEnabled] = useState(true);
  const [recommendedTime, setRecommendedTime] = useState('09:30');
  const [manualOverride, setManualOverride] = useState(false);
  const [customTime, setCustomTime] = useState('18:00');
  const [testSent, setTestSent] = useState(false);

  // Mock usage pattern data for visualization
  const usagePatterns: UsagePattern[] = [
    { hour: 6, engagement: 0.1, label: '6 AM' },
    { hour: 7, engagement: 0.3, label: '7 AM' },
    { hour: 8, engagement: 0.6, label: '8 AM' },
    { hour: 9, engagement: 0.9, label: '9 AM' }, // Peak morning
    { hour: 10, engagement: 0.7, label: '10 AM' },
    { hour: 11, engagement: 0.5, label: '11 AM' },
    { hour: 12, engagement: 0.4, label: '12 PM' },
    { hour: 13, engagement: 0.3, label: '1 PM' },
    { hour: 14, engagement: 0.2, label: '2 PM' },
    { hour: 15, engagement: 0.3, label: '3 PM' },
    { hour: 16, engagement: 0.4, label: '4 PM' },
    { hour: 17, engagement: 0.6, label: '5 PM' },
    { hour: 18, engagement: 0.8, label: '6 PM' }, // Peak evening
    { hour: 19, engagement: 0.7, label: '7 PM' },
    { hour: 20, engagement: 0.5, label: '8 PM' },
    { hour: 21, engagement: 0.3, label: '9 PM' },
    { hour: 22, engagement: 0.1, label: '10 PM' },
  ];

  const [notificationChannels, setNotificationChannels] = useState<NotificationChannel[]>([
    {
      id: 'push',
      name: 'Push Notifications',
      icon: <Smartphone size={20} color={colors.clarityBlue} />,
      enabled: true,
      description: 'Instant alerts on your device',
    },
    {
      id: 'email',
      name: 'Email',
      icon: <Mail size={20} color={colors.wisdomPurple} />,
      enabled: false,
      description: 'Weekly summaries and detailed insights',
    },
    {
      id: 'sms',
      name: 'SMS',
      icon: <MessageSquare size={20} color={colors.growthGreen} />,
      enabled: false,
      description: 'Critical alerts only (charges may apply)',
    },
  ]);

  const toggleChannel = (channelId: string) => {
    setNotificationChannels(channels =>
      channels.map(channel =>
        channel.id === channelId
          ? { ...channel, enabled: !channel.enabled }
          : channel
      )
    );
  };

  const sendTestNotification = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const renderUsageVisualization = () => {
    const maxHeight = 80;
    const barWidth = (width - 80) / usagePatterns.length;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Your App Usage Patterns</Text>
        <Text style={styles.chartSubtitle}>
          AI learns when you're most likely to engage with notifications
        </Text>
        
        <View style={styles.chart}>
          <View style={styles.yAxis}>
            <Text style={styles.axisLabel}>High</Text>
            <Text style={styles.axisLabel}>Low</Text>
          </View>
          
          <View style={styles.chartBars}>
            {usagePatterns.map((pattern, index) => (
              <View key={pattern.hour} style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: pattern.engagement * maxHeight,
                      width: barWidth - 2,
                      backgroundColor: pattern.hour === 9 || pattern.hour === 18
                        ? colors.clarityBlue
                        : colors.cloudGray,
                    },
                  ]}
                />
                {(pattern.hour === 9 || pattern.hour === 18) && (
                  <View style={styles.peakIndicator}>
                    <Text style={styles.peakText}>Peak</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.xAxis}>
          <Text style={styles.axisLabel}>6 AM</Text>
          <Text style={styles.axisLabel}>12 PM</Text>
          <Text style={styles.axisLabel}>6 PM</Text>
          <Text style={styles.axisLabel}>10 PM</Text>
        </View>
      </View>
    );
  };

  const renderRecommendation = () => (
    <View style={styles.recommendationContainer}>
      <View style={styles.recommendationHeader}>
        <Brain size={24} color={colors.wisdomPurple} />
        <Text style={styles.recommendationTitle}>AI Recommendation</Text>
      </View>
      
      <View style={styles.recommendationContent}>
        <Text style={styles.recommendationTime}>{recommendedTime} AM</Text>
        <Text style={styles.recommendationDescription}>
          Based on your usage patterns, this is your optimal notification time with 89% engagement rate.
        </Text>
        
        <View style={styles.recommendationStats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>89%</Text>
            <Text style={styles.statLabel}>Engagement</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>0.3s</Text>
            <Text style={styles.statLabel}>Avg Response</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>7 days</Text>
            <Text style={styles.statLabel}>Learning Period</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderManualOverride = () => (
    <View style={styles.overrideContainer}>
      <View style={styles.overrideHeader}>
        <View style={styles.overrideTitle}>
          <Settings size={20} color={colors.neutralGray} />
          <Text style={styles.overrideText}>Manual Override</Text>
        </View>
        <Switch
          value={manualOverride}
          onValueChange={setManualOverride}
          trackColor={{ false: colors.neutralGray, true: colors.clarityBlue }}
          thumbColor={colors.pureWhite}
        />
      </View>
      
      {manualOverride && (
        <View style={styles.customTimeContainer}>
          <Text style={styles.customTimeLabel}>Custom Notification Time</Text>
          <TouchableOpacity style={styles.timePicker}>
            <Clock size={20} color={colors.clarityBlue} />
            <Text style={styles.timePickerText}>{customTime}</Text>
          </TouchableOpacity>
          <Text style={styles.overrideWarning}>
            Manual timing may reduce notification effectiveness
          </Text>
        </View>
      )}
    </View>
  );

  const renderNotificationChannels = () => (
    <View style={styles.channelsContainer}>
      <Text style={styles.sectionTitle}>Notification Channels</Text>
      
      {notificationChannels.map(channel => (
        <TouchableOpacity
          key={channel.id}
          style={styles.channelRow}
          onPress={() => toggleChannel(channel.id)}
        >
          <View style={styles.channelIcon}>
            {channel.icon}
          </View>
          <View style={styles.channelInfo}>
            <Text style={styles.channelName}>{channel.name}</Text>
            <Text style={styles.channelDescription}>{channel.description}</Text>
          </View>
          <View style={[
            styles.channelToggle,
            { backgroundColor: channel.enabled ? colors.clarityBlue : colors.cloudGray }
          ]}>
            {channel.enabled && <Check size={16} color={colors.pureWhite} />}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTestSection = () => (
    <View style={styles.testContainer}>
      <TouchableOpacity
        style={[styles.testButton, testSent && styles.testButtonSuccess]}
        onPress={sendTestNotification}
        disabled={testSent}
      >
        {testSent ? (
          <Check size={20} color={colors.pureWhite} />
        ) : (
          <TrendingUp size={20} color={colors.pureWhite} />
        )}
        <Text style={styles.testButtonText}>
          {testSent ? 'Test Sent!' : 'Send Test Notification'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.testDescription}>
        Test notifications will be sent at your current optimal time
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <X size={24} color={colors.midnightInk} />
          </TouchableOpacity>
          <Text style={styles.title}>Smart Timing</Text>
          <View style={styles.placeholder} />
        </View>

        {/* AI Learning Toggle */}
        <View style={styles.aiToggleContainer}>
          <View style={styles.aiToggleContent}>
            <Brain size={24} color={aiLearningEnabled ? colors.wisdomPurple : colors.neutralGray} />
            <View style={styles.aiToggleInfo}>
              <Text style={styles.aiToggleTitle}>AI Learning</Text>
              <Text style={styles.aiToggleDescription}>
                {aiLearningEnabled 
                  ? 'Automatically optimizing notification timing'
                  : 'Learning disabled - using default timing'
                }
              </Text>
            </View>
            <Switch
              value={aiLearningEnabled}
              onValueChange={setAiLearningEnabled}
              trackColor={{ false: colors.neutralGray, true: colors.wisdomPurple }}
              thumbColor={colors.pureWhite}
            />
          </View>
        </View>

        {/* Usage Visualization */}
        {aiLearningEnabled && renderUsageVisualization()}

        {/* AI Recommendation */}
        {aiLearningEnabled && renderRecommendation()}

        {/* Manual Override */}
        {renderManualOverride()}

        {/* Notification Channels */}
        {renderNotificationChannels()}

        {/* Test Section */}
        {renderTestSection()}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.pureWhite,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    ...textStyles.h2,
    color: colors.midnightInk,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  aiToggleContainer: {
    backgroundColor: colors.pureWhite,
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  aiToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiToggleInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  aiToggleTitle: {
    ...textStyles.h3,
    color: colors.midnightInk,
    marginBottom: 2,
  },
  aiToggleDescription: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  chartContainer: {
    backgroundColor: colors.pureWhite,
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    ...textStyles.h3,
    color: colors.midnightInk,
    marginBottom: spacing.xs,
  },
  chartSubtitle: {
    ...textStyles.caption,
    color: colors.neutralGray,
    marginBottom: spacing.lg,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
  },
  yAxis: {
    width: 30,
    height: 80,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: spacing.xs,
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 2,
  },
  peakIndicator: {
    position: 'absolute',
    bottom: -20,
    backgroundColor: colors.clarityBlue,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  peakText: {
    fontSize: 8,
    color: colors.pureWhite,
    fontWeight: '600',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingLeft: 30,
  },
  axisLabel: {
    ...textStyles.caption,
    color: colors.neutralGray,
    fontSize: 10,
  },
  recommendationContainer: {
    backgroundColor: colors.pureWhite,
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  recommendationTitle: {
    ...textStyles.h3,
    color: colors.midnightInk,
    marginLeft: spacing.sm,
  },
  recommendationContent: {
    alignItems: 'center',
  },
  recommendationTime: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.wisdomPurple,
    marginBottom: spacing.xs,
  },
  recommendationDescription: {
    ...textStyles.body,
    color: colors.neutralGray,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  recommendationStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...textStyles.h3,
    color: colors.clarityBlue,
    marginBottom: 2,
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  overrideContainer: {
    backgroundColor: colors.pureWhite,
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  overrideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overrideTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overrideText: {
    ...textStyles.body,
    color: colors.midnightInk,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
  customTimeContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  customTimeLabel: {
    ...textStyles.body,
    color: colors.midnightInk,
    marginBottom: spacing.sm,
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cloudGray,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  timePickerText: {
    ...textStyles.h3,
    color: colors.clarityBlue,
    marginLeft: spacing.sm,
  },
  overrideWarning: {
    ...textStyles.caption,
    color: colors.warning,
    textAlign: 'center',
  },
  channelsContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...textStyles.h3,
    color: colors.midnightInk,
    marginBottom: spacing.md,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pureWhite,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  channelIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cloudGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  channelName: {
    ...textStyles.body,
    color: colors.midnightInk,
    fontWeight: '500',
    marginBottom: 2,
  },
  channelDescription: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  channelToggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testContainer: {
    marginHorizontal: spacing.lg,
    alignItems: 'center',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.clarityBlue,
    borderRadius: 12,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    shadowColor: colors.clarityBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: spacing.sm,
  },
  testButtonSuccess: {
    backgroundColor: colors.success,
  },
  testButtonText: {
    ...textStyles.button,
    color: colors.pureWhite,
    marginLeft: spacing.sm,
  },
  testDescription: {
    ...textStyles.caption,
    color: colors.neutralGray,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});

export default SmartNotificationTiming;