import OpenAI from 'openai';
import { ObjectId } from 'mongodb';
import DatabaseModelFactory from '../utils/DatabaseModelFactory';
import { logPrompt } from '@/utils/logPrompt';
import { getContextForModel } from '../contexts/context-manager';
import clientPromise from '@/lib/mongodb';

// Reemplaza 'ft-XXXXX' con tu model ID fine-tuned
const fineTunedModelId = 'ft-XXXXX'; 

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const handleGPTRequest = async (req, res) => {
  const { prompt, organizationId, userId, userEmail, modelName, projectId } = req.body;
  console.log('**********data*********', JSON.stringify(req.body));

  if (!prompt || !modelName) {
    console.log('No se proporcionó un prompt o un nombre de modelo');
    return res.status(400).json({ error: 'Se requiere un prompt y un nombre de modelo' });
  }

  try {
    const context = getContextForModel(modelName, projectId);
    console.log('Contexto generado para el modelo fine-tuned:', context);

    const gptResponse = await openai.chat.completions.create({
      model: fineTunedModelId,
      messages: [
        { role: 'system', content: context },
        { role: 'user', content: `Texto: ${prompt}` }
      ],
      max_tokens: 150,
      temperature: 0.1
    });

    const message = gptResponse.choices[0].message.content.trim();
    console.log('Respuesta del modelo fine-tuned:', message);

    let response;
    try {
      response = JSON.parse(message.replace(/\n/g, ''));
      console.log('Respuesta JSON parseada:', response);
    } catch (e) {
      console.log('Error al parsear JSON:', e);
      return res.status(400).json({ error: 'Formato JSON inválido desde el modelo fine-tuned', gptResponse: message });
    }

    const { action, command } = response;

    if (!action || !command) {
      console.log('Acción o comando no reconocidos en la respuesta:', response);
      return res.status(400).json({ error: 'Formato de respuesta incompleto desde el modelo fine-tuned', gptResponse: message });
    }

    // Asegurarse de que organization_id esté presente en el comando
    if (action === 'update' || action === 'delete') {
      if (command.q.organization_id === "ObjectId") {
        command.q.organization_id = new ObjectId(organizationId);
      }
      if (modelName.toLowerCase() === 'stock' && command.q.project_id === "ObjectId") {
        command.q.project_id = new ObjectId(projectId);
      }
    } else if (action === 'create' || action === 'filter') {
      if (command.organization_id === "ObjectId") {
        command.organization_id = new ObjectId(organizationId);
      }
      if (modelName.toLowerCase() === 'stock' && command.project_id === "ObjectId") {
        command.project_id = new ObjectId(projectId);
      }
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Obtener la organización y actualizar los créditos
    const organizationsCollection = db.collection('organizations');
    const organization = await organizationsCollection.findOne({ _id: new ObjectId(organizationId) });
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    console.log('Organización encontrada:', organization);

    const tokensUsed = gptResponse.usage.total_tokens;
    const creditsUsed = Math.ceil(tokensUsed / 1000);

    console.log('Créditos actuales:', organization.credits.current);
    console.log('Créditos a usar:', creditsUsed);

    if (organization.credits.current < creditsUsed) {
      return res.status(403).json({ error: 'Insufficient credits' });
    }

    await organizationsCollection.updateOne(
      { _id: new ObjectId(organizationId) },
      { $inc: { 'credits.current': -creditsUsed } }
    );

    console.log('Créditos actualizados');

    await logPrompt(userId, userEmail, organization, creditsUsed, tokensUsed, true, prompt, fineTunedModelId);

    const collection = db.collection(modelName.toLowerCase());
    console.log('Nombre de la colección:', modelName.toLowerCase());
    let result;

    switch (action) {
      case 'create':
        result = await collection.insertOne({ ...command, organization_id: new ObjectId(organizationId), updatedAt: new Date() });
        result = { _id: result.insertedId, ...command };
        break;
      case 'update':
        const { q, u, multi } = command;
        let query = { ...q };
        query.organization_id = new ObjectId(organizationId);
        if (modelName.toLowerCase() === 'stock') {
          query.project_id = new ObjectId(projectId);
        }
        result = await collection.updateMany(query, { $set: { ...u.$set, updatedAt: new Date() } });
        break;
      case 'delete':
        result = await collection.findOneAndDelete({ ...command, organization_id: new ObjectId(organizationId) });
        if (!result) {
          return res.status(404).json({ error: 'Documento no encontrado para eliminar' });
        }
        break;
      case 'filter':
        result = await collection.find({ ...command, organization_id: new ObjectId(organizationId) }).toArray();
        break;
      default:
        return res.status(400).json({ error: 'Acción no válida' });
    }

    console.log('Resultado de la operación:', result);

    const updatedOrganization = await organizationsCollection.findOne({ _id: new ObjectId(organizationId) });

    res.status(200).json({ 
      success: true, 
      data: result, 
      action, 
      credits: updatedOrganization.credits.current
    });

  } catch (error) {
    console.error('Error del servidor:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};
