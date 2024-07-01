export const formatNumber = (value, decimals) => {
    if (value == null) return 'N/A'; // Manejar valores nulos o indefinidos
    const cleanedValue = value.toString().replace(/,/g, ''); // Asegurarse de que el valor sea una cadena antes de reemplazar
    const numberValue = parseFloat(cleanedValue);
    const formattedValue = new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(numberValue);
    return formattedValue;
  };
  
  export const NumberFormatter = ({ value, decimals = 2 }) => {
    const formattedValue = formatNumber(value, decimals);
    return <>{formattedValue}</>;
  };
  