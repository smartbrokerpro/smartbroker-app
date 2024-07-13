// /pages/api/gpt-projects.js
import OpenAI from 'openai';
import clientPromise from '../../lib/mongodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const projectModel = {
  "projects": {
    "_id": "ObjectId",
    "name": "string",
    "address": "string",
    "county_id": "ObjectId",
    "country_id": "ObjectId",
    "real_estate_company_id": "ObjectId",
    "location": {
      "lat": "number",
      "lng": "number"
    }
  }
};

const initialPrompt = `Dado el siguiente modelo para la colección de proyectos en MongoDB:

${JSON.stringify(projectModel, null, 2)}

Por favor, devuelve solo el comando MongoDB necesario en formato JSON para la operación solicitada en el siguiente texto. Lo más importante, no incluyas ninguna explicación adicional.

Para actualizar una dirección, asegúrate de preservar el nombre completo de la calle (por ejemplo: Los Alerces 2560 debe preservar Los Alerces y solo modificar el número), a menos que se solicite cambiar toda la dirección.

Ejemplo 1:
Texto: Actualizar el proyecto con nombre "PLAZA ZAÑARTU". Establecer el address a "Nueva Dirección 123".
Respuesta esperada: { "filter": { "name": "PLAZA ZAÑARTU" }, "update": { "$set": { "address": "Nueva Dirección 123" } } }

Ejemplo 2:
Texto: Actualizar el proyecto con nombre "PLAZA ZAÑARTU". Establecer el name a "Nuevo Nombre" y cambiar la numeración de su address a "2566".
Respuesta esperada: { "filter": { "name": "PLAZA ZAÑARTU" }, "update": { "$set": { "name": "Nuevo Nombre", "address": "Zañartu 2566" } } }

Ahora, realiza la siguiente operación:`;

export default async function handler(req, res) {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Se requiere un prompt' });
  }

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);
  const collection = db.collection('projects');

  try {
    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: initialPrompt },
        { role: 'user', content: `Texto: ${prompt}` }
      ],
      max_tokens: 150,
    });

    const message = gptResponse.choices[0].message.content.trim();

    let updateCommand;
    try {
      updateCommand = JSON.parse(message);
    } catch (e) {
      return res.status(400).json({ error: 'Formato JSON inválido desde GPT-4', gptResponse: message });
    }

    const { filter, update } = updateCommand;

    if (!filter || !update) {
      return res.status(400).json({ error: 'Formato de respuesta incompleto desde GPT-4', gptResponse: message });
    }

    // Convertir el nombre del proyecto a mayúsculas si existe en el filtro
    if (filter.name) {
      filter.name = filter.name.toUpperCase();
    }

    // Asegurarse de que los nombres de los proyectos se guarden en mayúsculas
    if (update.$set && update.$set.name) {
      update.$set.name = update.$set.name.toUpperCase();
    }

    // Búsqueda insensible a mayúsculas/minúsculas
    if (filter.name) {
      filter.name = new RegExp(`^${filter.name}$`, 'i');
    }

    const project = await collection.findOne(filter);

    if (project) {
      const result = await collection.updateOne(
        { _id: project._id },
        update
      );

      res.status(200).json({ message: 'Actualización exitosa', updatedProjectId: project._id });
    } else {
      res.status(404).json({ error: 'Proyecto no encontrado para la actualización' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
