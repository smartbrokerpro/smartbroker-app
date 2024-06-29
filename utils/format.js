// utils/format.js
export function cleanNumberFormat(value) {
    // Elimina espacios y convierte el formato de 4,100.00 a 4100
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
  }
  
  export function formatCurrency(value, locale = 'es-CL', currency = 'UF') {
    const formattedValue = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  
    return `${formattedValue} ${currency}`;
  }
  