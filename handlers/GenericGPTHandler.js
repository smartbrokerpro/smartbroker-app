// /src/handlers/GenericGPTHandler.js

import OpenAI from 'openai';
import { ObjectId } from 'mongodb';
import DatabaseModelFactory from '../utils/DatabaseModelFactory';
import { logPrompt } from '@/utils/logPrompt';
import { getContextForModel } from '../contexts/context-manager';
import clientPromise from '@/lib/mongodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const handleGPTRequest = async (req, res) => {
  const { prompt, organizationId, userId, userEmail, modelName, projectId } = req.body;

  if (!prompt || !modelName) {
    console.log('No se proporcionó un prompt o un nombre de modelo');
    return res.status(400).json({ error: 'Se requiere un prompt y un nombre de modelo' });
  }

  try {
    const context = getContextForModel(modelName, projectId);
    console.log('Contexto generado para GPT-3.5-turbo:', context);

    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: context },
        { role: 'user', content: `Texto: ${prompt}` }
      ],
      max_tokens: 150,
      temperature: 0.1
    });

    const message = gptResponse.choices[0].message.content.trim();
    console.log('Respuesta de GPT-3.5-turbo:', message);

    let response;
    try {
      response = JSON.parse(message.replace(/\n/g, ''));
      console.log('Respuesta JSON parseada:', response);
    } catch (e) {
      console.log('Error al parsear JSON:', e);
      return res.status(400).json({ error: 'Formato JSON inválido desde GPT-3.5-turbo', gptResponse: message });
    }

    const { action, command } = response;

    if (!action || !command) {
      console.log('Acción o comando no reconocidos en la respuesta:', response);
      return res.status(400).json({ error: 'Formato de respuesta incompleto desde GPT-3.5-turbo', gptResponse: message });
    }

    // Asegurarse de que organization_id esté presente en el comando
    if (action === 'update' || action === 'delete') {
      if (!command.q.organization_id) {
        command.q.organization_id = organizationId;
      }
    } else if (action === 'create' || action === 'filter') {
      if (!command.organization_id) {
        command.organization_id = organizationId;
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

    await logPrompt(userId, userEmail, organization, creditsUsed, tokensUsed, true, prompt, 'gpt-3.5-turbo');

    const collection = db.collection(modelName.toLowerCase());
    console.log('Nombre de la colección:', modelName.toLowerCase());
    let result;

    switch (action) {
      case 'create':
        result = await collection.insertOne({ ...command, organization_id: new ObjectId(organizationId), updatedAt: new Date() });
        result = { _id: result.insertedId, ...command };
        break;
          case 'update':
            const { q, u } = command;
            
            // Convertir el string "ObjectId" a un ObjectId real
            if (q.organization_id === "ObjectId") {
            q.organization_id = new ObjectId(organizationId);
            }
        
            const query = { ...q, organization_id: new ObjectId(organizationId) };
            console.log('Query de búsqueda:', query);
        
            // Intenta encontrar el documento
            let existingDoc = await collection.findOne(query);
            
            console.log('Documento existente:', existingDoc);
            
            if (!existingDoc) {
            console.log('Documento no encontrado');
            
            // Intentar buscar sin organization_id
            delete query.organization_id;
            existingDoc = await collection.findOne(query);
            
            if (existingDoc) {
                console.log('Documento encontrado sin organization_id. Actualizando...');
                await collection.updateOne(
                { _id: existingDoc._id },
                { $set: { organization_id: new ObjectId(organizationId) } }
                );
            } else {
                return res.status(404).json({ error: 'Documento no encontrado', query: q });
            }
            }
        
            // Actualizar el documento
            const updateDoc = { $set: { ...u.$set, updatedAt: new Date() } };
            console.log('Actualizando documento:', existingDoc._id);
            result = await collection.findOneAndUpdate(
            { _id: existingDoc._id },
            updateDoc,
            { returnDocument: 'after' }
            );
            
            if (!result) {
            console.log('No se pudo actualizar el documento');
            return res.status(404).json({ error: 'No se pudo actualizar el documento' });
            }
            console.log('Documento actualizado:', result);
            break;
      case 'delete':
        result = await collection.findOneAndDelete({ ...command, organization_id: new ObjectId(organizationId) });
        if (!result) {
          return res.status(404).json({ error: 'Documento no encontrado para eliminar' });
        }
        result = result;
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