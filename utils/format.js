// utils/format.js
export function formatCurrency(value, locale = 'es-CL', currency = 'UF') {
    const formattedValue = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  
    return `${formattedValue} ${currency}`;
  }
  