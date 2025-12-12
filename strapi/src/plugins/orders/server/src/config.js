module.exports = {
  default: {
    statuses: [
      'new',
      'pending_payment',
      'paid',
      'processing',
      'shipped',
      'completed',
      'canceled',
    ],
  },
  validator: () => {},
};
