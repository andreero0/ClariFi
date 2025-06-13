import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { firstValueFrom } from 'rxjs';

export interface AlertThresholds {
  accuracyThreshold: number;
  costPerStatementThreshold: number;
  errorRateThreshold: number;
  latencyThreshold: number;
  throughputThreshold: number;
}

export interface AlertMetrics {
  accuracy: number;
  costPerStatement: number;
  errorRate: number;
  averageLatency: number;
  throughput: number;
  timestamp: Date;
}

export interface Alert {
  id: string;
  type: 'accuracy' | 'cost' | 'error_rate' | 'latency' | 'throughput';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  currentValue: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface AlertNotification {
  alert: Alert;
  channels: ('email' | 'webhook' | 'log')[];
}

@Injectable()
export class AlertingService {
  private readonly logger = new Logger(AlertingService.name);
  private readonly alertPrefix = 'categorization:alerts:';
  private readonly metricsPrefix = 'categorization:metrics:';
  
  private readonly thresholds: AlertThresholds;
  private readonly notificationChannels: {
    email?: {
      enabled: boolean;
      recipients: string[];
      smtpConfig?: any;
    };
    webhook?: {
      enabled: boolean;
      url: string;
      headers?: Record<string, string>;
    };
    log: {
      enabled: boolean;
    };
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    // Load alert thresholds from configuration
    this.thresholds = {
      accuracyThreshold: this.configService.get<number>('ALERT_ACCURACY_THRESHOLD', 85),
      costPerStatementThreshold: this.configService.get<number>('ALERT_COST_THRESHOLD', 0.10),
      errorRateThreshold: this.configService.get<number>('ALERT_ERROR_RATE_THRESHOLD', 1),
      latencyThreshold: this.configService.get<number>('ALERT_LATENCY_THRESHOLD', 500),
      throughputThreshold: this.configService.get<number>('ALERT_THROUGHPUT_THRESHOLD', 1000),
    };

    // Load notification channel configuration
    this.notificationChannels = {
      email: {
        enabled: this.configService.get<boolean>('ALERT_EMAIL_ENABLED', false),
        recipients: this.configService.get<string>('ALERT_EMAIL_RECIPIENTS', '').split(',').filter(Boolean),
      },
      webhook: {
        enabled: this.configService.get<boolean>('ALERT_WEBHOOK_ENABLED', false),
        url: this.configService.get<string>('ALERT_WEBHOOK_URL', ''),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.configService.get<string>('ALERT_WEBHOOK_AUTH', ''),
        },
      },
      log: {
        enabled: true, // Always enabled
      },
    };
  }

  /**
   * Check metrics against thresholds and trigger alerts if necessary
   */
  async checkMetricsAndAlert(metrics: AlertMetrics): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = [];

    try {
      // Check accuracy threshold
      if (metrics.accuracy < this.thresholds.accuracyThreshold) {
        const alert = await this.createAlert({
          type: 'accuracy',
          severity: this.getSeverity('accuracy', metrics.accuracy),
          message: `Categorization accuracy dropped to ${metrics.accuracy.toFixed(2)}% (threshold: ${this.thresholds.accuracyThreshold}%)`,
          currentValue: metrics.accuracy,
          threshold: this.thresholds.accuracyThreshold,
          timestamp: metrics.timestamp,
        });
        triggeredAlerts.push(alert);
      }

      // Check cost threshold
      if (metrics.costPerStatement > this.thresholds.costPerStatementThreshold) {
        const alert = await this.createAlert({
          type: 'cost',
          severity: this.getSeverity('cost', metrics.costPerStatement),
          message: `Cost per statement exceeded $${metrics.costPerStatement.toFixed(4)} (threshold: $${this.thresholds.costPerStatementThreshold})`,
          currentValue: metrics.costPerStatement,
          threshold: this.thresholds.costPerStatementThreshold,
          timestamp: metrics.timestamp,
        });
        triggeredAlerts.push(alert);
      }

      // Check error rate threshold
      if (metrics.errorRate > this.thresholds.errorRateThreshold) {
        const alert = await this.createAlert({
          type: 'error_rate',
          severity: this.getSeverity('error_rate', metrics.errorRate),
          message: `Error rate increased to ${metrics.errorRate.toFixed(2)}% (threshold: ${this.thresholds.errorRateThreshold}%)`,
          currentValue: metrics.errorRate,
          threshold: this.thresholds.errorRateThreshold,
          timestamp: metrics.timestamp,
        });
        triggeredAlerts.push(alert);
      }

      // Check latency threshold
      if (metrics.averageLatency > this.thresholds.latencyThreshold) {
        const alert = await this.createAlert({
          type: 'latency',
          severity: this.getSeverity('latency', metrics.averageLatency),
          message: `Average latency increased to ${metrics.averageLatency.toFixed(0)}ms (threshold: ${this.thresholds.latencyThreshold}ms)`,
          currentValue: metrics.averageLatency,
          threshold: this.thresholds.latencyThreshold,
          timestamp: metrics.timestamp,
        });
        triggeredAlerts.push(alert);
      }

      // Check throughput threshold
      if (metrics.throughput < this.thresholds.throughputThreshold) {
        const alert = await this.createAlert({
          type: 'throughput',
          severity: this.getSeverity('throughput', metrics.throughput),
          message: `Throughput dropped to ${metrics.throughput.toFixed(0)} transactions/minute (threshold: ${this.thresholds.throughputThreshold})`,
          currentValue: metrics.throughput,
          threshold: this.thresholds.throughputThreshold,
          timestamp: metrics.timestamp,
        });
        triggeredAlerts.push(alert);
      }

      // Send notifications for triggered alerts
      for (const alert of triggeredAlerts) {
        await this.sendNotification({
          alert,
          channels: this.getNotificationChannels(alert.severity),
        });
      }

      return triggeredAlerts;
    } catch (error) {
      this.logger.error(`Error checking metrics and alerts: ${error.message}`);
      return [];
    }
  }

  /**
   * Create and store an alert
   */
  private async createAlert(alertData: Omit<Alert, 'id' | 'resolved' | 'resolvedAt'>): Promise<Alert> {
    const alert: Alert = {
      id: this.generateAlertId(),
      ...alertData,
      resolved: false,
    };

    try {
      // Store alert in Redis with 30-day TTL
      const redisClient = this.redis.getClient();
      const alertKey = `${this.alertPrefix}${alert.id}`;
      await redisClient.setex(alertKey, 30 * 24 * 60 * 60, JSON.stringify(alert));

      // Add to active alerts list
      const activeAlertsKey = `${this.alertPrefix}active`;
      await redisClient.sadd(activeAlertsKey, alert.id);

      this.logger.warn(`Alert created: ${alert.type} - ${alert.message}`);
      return alert;
    } catch (error) {
      this.logger.error(`Failed to create alert: ${error.message}`);
      return alert;
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<boolean> {
    try {
      const redisClient = this.redis.getClient();
      const alertKey = `${this.alertPrefix}${alertId}`;
      
      const alertData = await redisClient.get(alertKey);
      if (!alertData) {
        return false;
      }

      const alert: Alert = JSON.parse(alertData);
      alert.resolved = true;
      alert.resolvedAt = new Date();

      // Update alert in Redis
      await redisClient.setex(alertKey, 30 * 24 * 60 * 60, JSON.stringify(alert));

      // Remove from active alerts
      const activeAlertsKey = `${this.alertPrefix}active`;
      await redisClient.srem(activeAlertsKey, alertId);

      this.logger.log(`Alert resolved: ${alertId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to resolve alert ${alertId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<Alert[]> {
    try {
      const redisClient = this.redis.getClient();
      const activeAlertsKey = `${this.alertPrefix}active`;
      const alertIds = await redisClient.smembers(activeAlertsKey);

      const alerts: Alert[] = [];
      for (const alertId of alertIds) {
        const alertKey = `${this.alertPrefix}${alertId}`;
        const alertData = await redisClient.get(alertKey);
        if (alertData) {
          alerts.push(JSON.parse(alertData));
        }
      }

      return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      this.logger.error(`Failed to get active alerts: ${error.message}`);
      return [];
    }
  }

  /**
   * Get alert history
   */
  async getAlertHistory(limit: number = 100): Promise<Alert[]> {
    try {
      const redisClient = this.redis.getClient();
      const pattern = `${this.alertPrefix}*`;
      const keys = await redisClient.keys(pattern);
      
      const alerts: Alert[] = [];
      for (const key of keys.slice(0, limit)) {
        if (key.includes('active')) continue; // Skip active alerts list
        
        const alertData = await redisClient.get(key);
        if (alertData) {
          alerts.push(JSON.parse(alertData));
        }
      }

      return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      this.logger.error(`Failed to get alert history: ${error.message}`);
      return [];
    }
  }

  /**
   * Send notification for an alert
   */
  private async sendNotification(notification: AlertNotification): Promise<void> {
    const { alert, channels } = notification;

    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmailNotification(alert);
            break;
          case 'webhook':
            await this.sendWebhookNotification(alert);
            break;
          case 'log':
            this.sendLogNotification(alert);
            break;
        }
      } catch (error) {
        this.logger.error(`Failed to send ${channel} notification: ${error.message}`);
      }
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: Alert): Promise<void> {
    if (!this.notificationChannels.email?.enabled || !this.notificationChannels.email.recipients.length) {
      return;
    }

    // Email implementation would go here
    // For now, just log the intent
    this.logger.log(`Email notification would be sent to: ${this.notificationChannels.email.recipients.join(', ')}`);
    this.logger.log(`Alert: ${alert.message}`);
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(alert: Alert): Promise<void> {
    if (!this.notificationChannels.webhook?.enabled || !this.notificationChannels.webhook.url) {
      return;
    }

    try {
      const payload = {
        alert_type: alert.type,
        severity: alert.severity,
        message: alert.message,
        current_value: alert.currentValue,
        threshold: alert.threshold,
        timestamp: alert.timestamp.toISOString(),
        service: 'clarifi-categorization',
      };

      await firstValueFrom(
        this.httpService.post(
          this.notificationChannels.webhook.url,
          payload,
          {
            headers: this.notificationChannels.webhook.headers,
            timeout: 5000,
          }
        )
      );

      this.logger.log(`Webhook notification sent for alert: ${alert.id}`);
    } catch (error) {
      this.logger.error(`Failed to send webhook notification: ${error.message}`);
    }
  }

  /**
   * Send log notification
   */
  private sendLogNotification(alert: Alert): void {
    const logLevel = alert.severity === 'critical' ? 'error' : 'warn';
    this.logger[logLevel](`ALERT [${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}`, {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      currentValue: alert.currentValue,
      threshold: alert.threshold,
      timestamp: alert.timestamp,
    });
  }

  /**
   * Determine alert severity based on type and value
   */
  private getSeverity(type: string, value: number): Alert['severity'] {
    const threshold = this.thresholds[`${type}Threshold` as keyof AlertThresholds];
    
    switch (type) {
      case 'accuracy':
        if (value < threshold - 10) return 'critical';
        if (value < threshold - 5) return 'high';
        if (value < threshold - 2) return 'medium';
        return 'low';
      
      case 'cost':
        if (value > threshold * 2) return 'critical';
        if (value > threshold * 1.5) return 'high';
        if (value > threshold * 1.2) return 'medium';
        return 'low';
      
      case 'error_rate':
        if (value > threshold * 5) return 'critical';
        if (value > threshold * 3) return 'high';
        if (value > threshold * 2) return 'medium';
        return 'low';
      
      case 'latency':
        if (value > threshold * 2) return 'critical';
        if (value > threshold * 1.5) return 'high';
        if (value > threshold * 1.2) return 'medium';
        return 'low';
      
      case 'throughput':
        if (value < threshold * 0.5) return 'critical';
        if (value < threshold * 0.7) return 'high';
        if (value < threshold * 0.85) return 'medium';
        return 'low';
      
      default:
        return 'medium';
    }
  }

  /**
   * Get notification channels based on severity
   */
  private getNotificationChannels(severity: Alert['severity']): ('email' | 'webhook' | 'log')[] {
    const channels: ('email' | 'webhook' | 'log')[] = ['log'];
    
    if (severity === 'high' || severity === 'critical') {
      if (this.notificationChannels.webhook?.enabled) {
        channels.push('webhook');
      }
    }
    
    if (severity === 'critical') {
      if (this.notificationChannels.email?.enabled) {
        channels.push('email');
      }
    }
    
    return channels;
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current alert thresholds
   */
  getThresholds(): AlertThresholds {
    return { ...this.thresholds };
  }

  /**
   * Update alert thresholds
   */
  updateThresholds(newThresholds: Partial<AlertThresholds>): void {
    Object.assign(this.thresholds, newThresholds);
    this.logger.log('Alert thresholds updated', newThresholds);
  }
} 