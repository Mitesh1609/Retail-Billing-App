// Format number as Indian Rupees
export const formatCurrency = (amount) => {
  return `₹${parseFloat(amount).toFixed(2)}`;
};