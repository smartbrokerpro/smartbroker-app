// /pages/api/run-tests.js

import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
    try {
      const { orgId, projId, examples } = req.body;
  
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB);
      const resultsArray = [];
  
      for (const example of examples) {
        let action, command;
  
        try {
          const parsedExample = JSON.parse(example.completion);
          action = parsedExample.action;
          command = parsedExample.command;
        } catch (error) {
          console.error('Error al parsear el JSON:', error.message);
          continue;  // Saltar este ejemplo y continuar con los demás
        }
  
        // Agregar orgId al comando
        command.organization_id = new ObjectId(orgId);
        // Solo agregar projId si está presente
        if (projId) {
          command.project_id = new ObjectId(projId);
        } else {
          delete command.project_id; // Asegurarse de que no haya un project_id vacío
        }
  
        let result;
        try {
          switch (action) {
            case 'filter':
              result = await db.collection('stock').find(command).toArray();
              break;
            case 'aggregate':
              result = await db.collection('stock').aggregate(command).toArray();
              break;
            default:
              result = 'Acción no válida';
          }
        } catch (error) {
          console.error('Error ejecutando la consulta MongoDB:', error.message);
          continue;  // Saltar este ejemplo y continuar con los demás
        }
  
        resultsArray.push({ prompt: example.prompt, result });
      }
  
      res.status(200).json({ results: resultsArray });
    } catch (error) {
      console.error('Error en el manejo de la solicitud:', error.message);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
}
