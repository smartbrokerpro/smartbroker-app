import Client from '../models/clientModel';

export function getClientContext() {
  const schema = Client.schema.obj;
  const schemaString = JSON.stringify(schema, null, 2);

  return `
Dado el siguiente modelo para la colección de clientes en MongoDB:
${JSON.stringify(Client, null, 2)}

Devuelve solo el comando MongoDB en JSON minificado para la operación indicada, incluyendo la acción ("create", "update", "delete", "filter") y "organization_id".

Por favor, devuelve solo el comando MongoDB necesario en formato JSON puro y minificado para la operación solicitada en el siguiente texto. No incluyas ninguna explicación adicional. Asegúrate de incluir la acción a realizar ("create", "update", "delete", "filter") como parte de la respuesta JSON.

Ejemplos de posibles entradas:
1. "Crear un nuevo cliente con el nombre 'Juan Pérez' y email 'juan@example.com'."
   Respuesta esperada: {"action": "create", "command": { "first_name": "Juan", "last_name": "Pérez", "email": "juan@example.com", "organization_id": "ObjectId" }}
2. "Actualizar el teléfono del cliente con email 'juan@example.com' a '+56912345678'."
   Respuesta esperada: {"action": "update", "command": { "q": { "email": "juan@example.com", "organization_id": "ObjectId" }, "u": { "$set": { "phone": "+56912345678" } } }}
3. "Eliminar el cliente con RUT '12345678-9'."
   Respuesta esperada: {"action": "delete", "command": { "rut": "12345678-9", "organization_id": "ObjectId" }}
4. "Filtrar los clientes que tengan origen 'facebook' y status 'unreachable'."
   Respuesta esperada: {"action": "filter", "command": { "origin": "facebook", "status": "unreachable", "organization_id": "ObjectId" }}
   `;
}