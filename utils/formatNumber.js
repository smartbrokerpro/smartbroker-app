export const NumberFormatter = ({ value, unit, prependUnit = true, decimals = 0, appendUnit = false }) => {
  const formattedNumber = new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

  if (appendUnit && unit) {
    return `${formattedNumber} ${unit}`;
  } else if (prependUnit && unit) {
    return `${unit} ${formattedNumber}`;
  } else {
    return formattedNumber;
  }
};