export const MAIL_TEMPLATES = {
  WELCOME: {
    name: 'welcome',
    subject: 'Welcome to Vibe!',
  },
  ORDER_CONFIRMATION: {
    name: 'order-confirm',
    subject: (orderNumber: string) => `Order ${orderNumber} confirmed - Vibe`,
  },
} as const;
