import mongoose from 'mongoose';
import Stock from '../models/stockModel';

export function getStockContext() {
  const stockSchema = Stock.schema;
  
  const simplifySchema = (schema) => {
    return Object.entries(schema.obj).reduce((acc, [key, value]) => {
      acc[key] = {
        type: value.type ? value.type.name || value.type.toString() : 'Unknown',
        ...(value.required && { required: value.required }),
        ...(value.min !== undefined && { min: value.min }),
        ...(value.trim && { trim: value.trim })
      };
      return acc;
    }, {});
  };

  const simplifiedSchema = simplifySchema(stockSchema);
  const schemaString = JSON.stringify(simplifiedSchema, null, 2);

  console.log('Simplified Stock Schema:', schemaString);

  return `
Dado el siguiente modelo para la colección de stock en MongoDB:
${schemaString}

Devuelve solo el comando MongoDB en JSON minificado para la operación indicada, incluyendo la acción ("create", "update", "delete", "filter") y "organization_id".

Por favor, devuelve solo el comando MongoDB necesario en formato JSON puro y minificado para la operación solicitada en el siguiente texto. No incluyas ninguna explicación adicional. Asegúrate de incluir la acción a realizar ("create", "update", "delete", "filter") como parte de la respuesta JSON.

Ejemplos de posibles entradas:
1. "Crear una nueva unidad de stock con el apartamento '204'."
   Respuesta esperada: {"action": "create", "command": { "apartment": "204", "project_id": "ObjectId", "organization_id": "ObjectId" }}
2. "Cambia el valor de la unidad 306 a 3000 UF."
   Respuesta esperada: {"action": "update", "command": { "q": { "apartment": "306", "project_id": "ObjectId", "organization_id": "ObjectId" }, "u": { "$set": { "current_list_price": 3000 } } }}
3. "Eliminar la unidad de stock con el apartamento '306'."
   Respuesta esperada: {"action": "delete", "command": { "apartment": "306", "project_id": "ObjectId", "organization_id": "ObjectId" }}
4. "Filtrar las unidades de stock que tengan valores de unidad entre 2000 y 4000 UF."
   Respuesta esperada: {"action": "filter", "command": { "project_id": "ObjectId", "organization_id": "ObjectId", "current_list_price": { "$gte": 2000, "$lte": 4000 } }}
5. "Cambia todas las unidades de orientación Norte a orientación Sur."
   Respuesta esperada: {"action": "update", "command": { "q": { "orientation": "Norte", "project_id": "ObjectId", "organization_id": "ObjectId" }, "u": { "$set": { "orientation": "Sur" } }, "multi": true }}
6. "Cambia todas las unidades con orientación NORTE/PONIENTE a NORPONIENTE."
   Respuesta esperada: {"action": "update", "command": { "q": { "orientation": "NORTE/PONIENTE", "project_id": "ObjectId", "organization_id": "ObjectId" }, "u": { "$set": { "orientation": "NORPONIENTE" } }, "multi": true }}
 `;
}