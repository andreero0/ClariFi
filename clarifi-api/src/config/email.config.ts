import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true' || false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  from: {
    name: process.env.SMTP_FROM_NAME || 'ClariFi Support',
    address: process.env.SMTP_FROM_ADDRESS || 'support@clarifi.ca',
  },
  support: {
    to: process.env.SUPPORT_EMAIL || 'support@clarifi.ca',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@clarifi.ca',
  },
  templates: {
    supportTicketCreated: 'support-ticket-created',
    supportTicketUpdate: 'support-ticket-update',
  },
})); 