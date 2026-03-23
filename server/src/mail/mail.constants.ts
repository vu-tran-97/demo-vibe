export const MAIL_TEMPLATES = {
  WELCOME: {
    name: 'welcome',
    subject: 'Welcome to Vibe! Verify your email',
  },
  RESET_PASSWORD: {
    name: 'reset-password',
    subject: 'Reset your Vibe password',
  },
  ORDER_CONFIRMATION: {
    name: 'order-confirm',
    subject: (orderNumber: string) => `Order ${orderNumber} confirmed - Vibe`,
  },
} as const;
