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

Por favor, devuelve solo el comando MongoDB necesario en formato JSON para la operación solicitada en el siguiente texto. No incluyas ninguna explicación adicional.

Para actualizar una dirección, asegúrate de preservar el nombre de la calle y solo cambiar la numeración si se especifica.

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
    return res.status(400).json({ error: 'Prompt is required' });
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
      return res.status(400).json({ error: 'Invalid JSON format from GPT-4', gptResponse: message });
    }

    const { filter, update } = updateCommand;

    if (!filter || !update) {
      return res.status(400).json({ error: 'Incomplete response format from GPT-4', gptResponse: message });
    }

    const project = await collection.findOne(filter);

    if (project) {
      const result = await collection.updateOne(
        { _id: project._id },
        update
      );

      res.status(200).json({ message: 'Update successful', result });
    } else {
      res.status(404).json({ error: 'Project not found for update' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
