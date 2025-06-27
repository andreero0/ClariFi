// services/index.ts

// AI Services
export * from './ai/categorization';
export * from './ai/chatService';
export * from './ai/promptTemplates';

// Analytics Services
export * from './analytics/posthog';

// Auth Services
export * from './auth';

// Biometric Services
export * from './biometrics';

// Education Services
export * from './education';

// Localization Services
export * from './localization';

// Notification Services
export * from './notifications/scheduler';
export * from './notifications/templates';

// Storage Services
export * from './storage/asyncStorage';
export * from './storage/dataModels';
export * from './storage/migrations';
export * from './storage/fileUploadService';

console.log('services/index.ts loaded');
