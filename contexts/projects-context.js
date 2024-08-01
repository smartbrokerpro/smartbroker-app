import Project from '../models/projectModel';

export function getProjectContext() {
  const schema = Project.schema.obj;
  const schemaString = JSON.stringify(schema, null, 2);

  return `
Modelo de proyectos en MongoDB:
${schemaString}

Devuelve solo el comando MongoDB en JSON minificado para la operación indicada, incluyendo la acción ("create", "update", "delete", "filter") y "organization_id".

Ejemplos:
1. "Crear un nuevo proyecto 'Edificio Central', dirección 'Calle Falsa 123'."
   {"action": "create", "command": { "name": "Edificio Central", "address": "Calle Falsa 123", "organization_id": "ObjectId" }}
2. "Actualizar el proyecto 'Edificio Central', cambiar dirección a 'Calle Verdadera 456'."
   {"action": "update", "command": { "q": { "name": "Edificio Central", "organization_id": "ObjectId" }, "u": { "$set": { "address": "Calle Verdadera 456" } } }}
3. "Eliminar el proyecto 'Edificio Central'."
   {"action": "delete", "command": { "name": "Edificio Central", "organization_id": "ObjectId" }}
4. "Filtrar proyectos con valores entre 2000 y 4000 UF."
   {"action": "filter", "command": { "min_price": { "$gte": 2000 }, "max_price": { "$lte": 4000 }, "organization_id": "ObjectId" }}
`;
}