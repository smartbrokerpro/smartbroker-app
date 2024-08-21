// utils/excelUtils.js

import ExcelJS from 'exceljs';

export async function extractHeadersAndExamplesFromExcel(file) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const worksheet = workbook.worksheets[0];
  
  // Extraer la primera fila (encabezados)
  const headerRow = worksheet.getRow(1);
  const headers = headerRow.values.slice(1).filter(header => header != null);
  
  // Extraer la segunda fila (valores de ejemplo)
  const exampleRow = worksheet.getRow(2);
  const examples = exampleRow.values.slice(1).map(example => {
    if (example instanceof Date) {
      return example.toLocaleDateString(); // Convertir fecha a cadena
    } else if (typeof example === 'object') {
      return JSON.stringify(example); // Convertir objetos a cadena
    }
    return example != null ? example.toString() : '';
  });
  
  // Retornar ambos, encabezados y ejemplos, como un objeto
  return { headers, examples };
}
