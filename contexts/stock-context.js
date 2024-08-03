import Stock from '../models/stockModel';

export function getStockContext() {
  return `
Dado el siguiente modelo para la colección de stock en MongoDB:
{
  "organization_id": {
    "type": "mongoose.Schema.Types.ObjectId",
    "required": [true, "El ID de la organización es obligatorio"]
  },
  "project_id": {
    "type": "mongoose.Schema.Types.ObjectId",
    "required": [true, "El ID del proyecto es obligatorio"]
  },
  "apartment": {
    "type": "String",
    "required": [true, "El número de apartamento es obligatorio"],
    "trim": true
  },
  "role": {
    "type": "String",
    "trim": true
  },
  "model": {
    "type": "String",
    "trim": true
  },
  "typology": {
    "type": "String",
    "trim": true
  },
  "program": {
    "type": "String",
    "trim": true
  },
  "orientation": {
    "type": "String",
    "trim": true
  },
  "interior_surface": {
    "type": "Number",
    "min": [0, "La superficie interior no puede ser negativa"]
  },
  "terrace_surface": {
    "type": "Number",
    "min": [0, "La superficie de la terraza no puede ser negativa"]
  },
  "total_surface": {
    "type": "Number",
    "min": [0, "La superficie total no puede ser negativa"]
  },
  "current_list_price": {
    "type": "Number",
    "min": [0, "El precio de lista no puede ser negativo"]
  },
  "down_payment_bonus": {
    "type": "Number",
    "min": [0, "El bono del pie no puede ser negativo"]
  },
  "discount": {
    "type": "Number",
    "min": [0, "El descuento no puede ser negativo"]
  },
  "rent": {
    "type": "Number",
    "min": [0, "El valor de la renta no puede ser negativo"]
  },
  "status_id": {
    "type": "mongoose.Schema.Types.ObjectId"
  },
  "county_id": {
    "type": "mongoose.Schema.Types.ObjectId"
  },
  "county_name": {
    "type": "String",
    "trim": true
  },
  "real_estate_company_name": {
    "type": "String",
    "trim": true
  },
  "region_name": {
    "type": "String",
    "trim": true
  },
  "available": {
    "type": "Number",
    "min": [0, "La disponibilidad no puede ser negativa"]
  }
}

Devuelve solo el comando MongoDB en JSON minificado para la operación indicada, incluyendo la acción ("create", "update", "delete", "filter") y "organization_id".

Por favor, devuelve solo el comando MongoDB necesario en formato JSON puro y minificado para la operación solicitada en el siguiente texto. No incluyas ninguna explicación adicional. Asegúrate de incluir la acción a realizar ("create", "update", "delete", "filter") como parte de la respuesta JSON.

Ejemplos de posibles entradas:
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
