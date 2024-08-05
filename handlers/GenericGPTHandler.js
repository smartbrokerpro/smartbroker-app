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
  console.log('**********data*********', JSON.stringify(req.body));

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
          const { q, u, multi } = command;
          
          // Asegurarse de que organization_id sea un ObjectId válido
          if (!organizationId) {
            console.error('organization_id es obligatorio');
            return res.status(400).json({ error: 'organization_id es obligatorio' });
          }
          const safeOrganizationId = new ObjectId(organizationId);
        
          // Crear una copia de la consulta original
          let query = { ...q };
        
          // Asegurar que organization_id esté presente y sea ObjectId
          query.organization_id = safeOrganizationId;
        
          // Si el modelo es 'stock', asegurar que project_id esté presente y sea ObjectId
          if (modelName.toLowerCase() === 'stock') {
            if (!projectId) {
              console.error('project_id es obligatorio para el modelo stock');
              return res.status(400).json({ error: 'project_id es obligatorio para el modelo stock' });
            }
            const safeProjectId = new ObjectId(projectId);
            query.project_id = safeProjectId;
          }
        
          // Manejo flexible del campo apartment
          if (query.apartment) {
            query.apartment = { 
              $in: [
                query.apartment, 
                typeof query.apartment === 'string' ? parseInt(query.apartment, 10) : query.apartment.toString()
              ]
            };
          }
        
          console.log('Query de búsqueda:', query);
        
          let updatedIds = [];
        
          if (multi) {
            // Actualización masiva
            console.log('Realizando actualización masiva');
            const updateDoc = { $set: { ...u.$set, updatedAt: new Date() } };
            console.log('Documento de actualización:', updateDoc);
            
            // Obtener los IDs de los documentos que van a ser actualizados
            const docsToUpdate = await collection.find(query).toArray();
            updatedIds = docsToUpdate.map(doc => doc._id.toString());
            
            const updateResult = await collection.updateMany(query, updateDoc);
            console.log('Resultado de actualización masiva:', updateResult);
          } else {
            // Actualización individual
            console.log('Realizando actualización individual');
            const updateDoc = { $set: { ...u.$set, updatedAt: new Date() } };
            console.log('Documento de actualización:', updateDoc);
            const updateResult = await collection.findOneAndUpdate(
              query,
              updateDoc,
              { returnDocument: 'after' }
            );
            
            if (updateResult) {
              updatedIds = [updateResult._id.toString()];
              console.log('Documento actualizado:', updateResult);
            } else {
              console.log('No se encontró documento para actualizar');
            }
          }
        
          console.log(`Número de IDs actualizados: ${updatedIds.length}`);
          console.log('IDs actualizados:', updatedIds);
        
          result = { updatedIds, count: updatedIds.length };
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