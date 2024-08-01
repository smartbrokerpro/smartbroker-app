import Stock from '../models/stockModel';

export function getStockContext(projectId) {
  const schema = Stock.schema.obj;
  const schemaString = JSON.stringify(schema, null, 2);

  return `
Dado el siguiente modelo para la colección de stock en MongoDB:
${schemaString}

Por favor, devuelve solo el comando MongoDB necesario en formato JSON puro y minificado para la operación solicitada en el siguiente texto. No incluyas ninguna explicación adicional. Asegúrate de incluir la acción a realizar ("create", "update", "delete", "filter") como parte de la respuesta JSON. Todas las peticiones deben incluir obligatoriamente los parámetros "apartment" y "project_id", donde "project_id" es ObjectId.

MUY IMPORTANTE: SIEMPRE INCORPORA EL "project_id": "${projectId}"

Ejemplos de posibles entradas:
1. "Crear una nueva unidad de stock con el apartamento '204'."
   Respuesta esperada: {"action": "create", "command": { "apartment": "204", "project_id": { "$oid": "${projectId}" } }}
2. "Cambia el valor de la unidad 306 a 3000 UF"
   Respuesta esperada: {"action": "update", "command": { "q": { "apartment": "306", "project_id": { "$oid": "${projectId}" } }, "u": { "$set": { "current_list_price": 3000 } } }}
3. "Eliminar la unidad de stock con el apartamento '306'."
   Respuesta esperada: {"action": "delete", "command": { "apartment": "306", "project_id": { "$oid": "${projectId}" } }}
4. "Filtrar las unidades de stock que tengan valores de unidad entre 2000 y 4000 UF."
   Respuesta esperada: {"action": "filter", "command": { "project_id": { "$oid": "${projectId}" }, "current_list_price": { "$gte": 2000, "$lte": 4000 } }}
`;
}