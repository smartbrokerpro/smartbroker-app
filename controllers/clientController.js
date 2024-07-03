import Client from '../models/clientModel';
import OpenAI from 'openai';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const clientModel = {
  "clients": {
    "_id": "ObjectId",
    "first_name": "string",
    "last_name": "string",
    "origin": "string",
    "status": "string",
    "email": "string",
    "phone": "string",
    "address": "string",
    "rut": "string",
    "contact_date": "date",
    "notes": "string",
    "created_at": "date",
    "updated_at": "date"
  }
};

const generateContext = (prompt) => {
  return `
Dado el siguiente modelo para la colección de clientes en MongoDB:
${JSON.stringify(clientModel, null, 2)}

Por favor, devuelve solo el comando MongoDB necesario en formato JSON puro y minificado para la operación solicitada en el siguiente texto. No incluyas ninguna explicación adicional. Asegúrate de incluir la acción a realizar ("create", "update", "delete", "filter") como parte de la respuesta JSON.

Ejemplos de posibles entradas:
1. "Crear un nuevo cliente con el nombre 'Juan Pérez' y email 'juan@example.com'."
   Respuesta esperada: {"action": "create", "command": { "first_name": "Juan", "last_name": "Pérez", "email": "juan@example.com" }}
2. "Actualizar el teléfono del cliente con email 'juan@example.com' a '+56912345678'."
   Respuesta esperada: {"action": "update", "command": { "q": { "email": "juan@example.com" }, "u": { "$set": { "phone": "+56912345678" } } }}
3. "Eliminar el cliente con RUT '12345678-9'."
   Respuesta esperada: {"action": "delete", "command": { "rut": "12345678-9" }}
4. "Filtrar los clientes que tengan origen 'facebook' y status 'unreachable'."
   Respuesta esperada: {"action": "filter", "command": { "origin": "facebook", "status": "unreachable" }}

Entrada del usuario:
${prompt}
`;
};


export const handleClientGPTRequest = async (req, res) => {
    const { prompt } = req.body;
  
    if (!prompt) {
      console.log('Se requiere un prompt para el manejo de clientes');
      return res.status(400).json({ error: 'Se requiere un prompt para el manejo de clientes' });
    }
  
    const context = generateContext(prompt);
    console.log('Contexto generado para GPT-4 (Clientes):', context);
  
    try {
      const gptResponse = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: context },
          { role: 'user', content: `Texto: ${prompt}` }
        ],
        max_tokens: 150,
      });
  
      const message = gptResponse.choices[0].message.content.trim();
      console.log('Respuesta de GPT-4 para Clientes:', message);
  
      let response;
      try {
        response = JSON.parse(message.replace(/\n/g, ''));
        console.log('Respuesta JSON parseada para Clientes:', response);
      } catch (e) {
        console.log('Error al parsear JSON para Clientes:', e);
        return res.status(400).json({ error: 'Formato JSON inválido desde GPT-4 para Clientes', gptResponse: message });
      }
  
      const { action, command } = response;
  
      if (!action || !command) {
        console.log('Acción o comando no reconocidos en la respuesta para Clientes:', response);
        return res.status(400).json({ error: 'Formato de respuesta incompleto desde GPT-4 para Clientes', gptResponse: message });
      }
  
      const client = await clientPromise;
      const db = client.db('real_estate_management');
      const collection = db.collection('clients');
  
      switch (action) {
        case 'create':
          console.log('Procesando una creación de cliente');
          const newClient = await collection.insertOne({ ...command, created_at: new Date(), updated_at: new Date() });
          console.log('Cliente creado:', newClient);
          res.status(201).json({ success: true, data: newClient.ops ? newClient.ops[0] : { _id: newClient.insertedId, ...command }, createdClientId: newClient.insertedId });
          break;
        case 'update':
          console.log('Procesando una actualización de cliente');
          const { q, u } = command;
  
          if (!q || !u || !u.$set) {
            console.log('Formato de respuesta incompleto desde GPT-4 para actualización de cliente:', response);
            return res.status(400).json({ error: 'Formato de respuesta incompleto desde GPT-4 para actualización de cliente', gptResponse: message });
          }
  
          const updatedClient = await collection.findOneAndUpdate(
            q,
            { $set: { ...u.$set, updated_at: new Date() } },
            { returnOriginal: false, returnDocument: 'after' }
          );
  
          console.log('Respuesta de findOneAndUpdate para cliente:', updatedClient);
  
          if (updatedClient) {
            console.log('Cliente actualizado:', { success: true, data: updatedClient, updatedClientId: updatedClient._id });
            res.status(200).json({ success: true, data: updatedClient, updatedClientId: updatedClient._id });
          } else {
            console.log('Cliente no encontrado para la actualización');
            res.status(404).json({ error: 'Cliente no encontrado para la actualización' });
          }
          break;
        case 'delete':
          console.log('Procesando una eliminación de cliente');
          const deleteCmd = command;
          console.log('Filtro de eliminación de cliente:', deleteCmd);
  
          const deletedClient = await collection.findOneAndDelete(deleteCmd);
  
          console.log("Respuesta de deletedClient:", Boolean(deletedClient), deletedClient);
          if (deletedClient && deletedClient.value) {
            console.log('Cliente eliminado:', deletedClient.value);
            res.status(200).json({ success: true, data: deletedClient.value, deletedClientId: deletedClient.value._id });
          } else {
            console.log('Cliente no encontrado para la eliminación');
            res.status(404).json({ error: 'Cliente no encontrado para la eliminación' });
          }
          break;
        case 'filter':
          console.log('Procesando un filtro de clientes');
          const filterCriteria = command;
          console.log('Criterios de filtro de clientes:', filterCriteria);
  
          const clients = await collection.find(filterCriteria).toArray();
          console.log('Clientes filtrados:', clients);
          res.status(200).json({ success: true, data: clients });
          break;
        default:
          console.log('Acción no válida en el comando para clientes:', response);
          res.status(400).json({ error: 'Acción no válida para clientes' });
      }
    } catch (error) {
      console.error('Error del servidor en el manejo de Clientes GPT:', error);
      res.status(500).json({ error: 'Error interno del servidor en el manejo de Clientes GPT' });
    }
  };
  

export const getClients = async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db('real_estate_management');

    console.log('Conectado a la base de datos, obteniendo clientes...');

    const clients = await db.collection('clients').find({}).sort({ updated_at: -1 }).toArray();

    res.status(200).json({ success: true, data: clients });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createClient = async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db('real_estate_management');
    const newClient = { ...req.body, created_at: new Date(), updated_at: new Date() };
    const savedClient = await db.collection('clients').insertOne(newClient);
    res.status(201).json({ success: true, data: { _id: savedClient.insertedId, ...newClient } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await clientPromise;
    const db = client.db('real_estate_management');
    const updatedClient = await db.collection('clients').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...req.body, updated_at: new Date() } },
      { returnOriginal: false }
    );
    if (!updatedClient.value) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }
    res.status(200).json({ success: true, data: updatedClient.value });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await clientPromise;
    const db = client.db('real_estate_management');
    const deletedClient = await db.collection('clients').findOneAndDelete({ _id: new ObjectId(id) });
    if (!deletedClient.value) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }
    res.status(200).json({ success: true, data: deletedClient.value });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const filterClients = async (req, res) => {
  try {
    const { origin, status } = req.query;
    const filter = {};
    if (origin) filter.origin = origin;
    if (status) filter.status = status;
    const client = await clientPromise;
    const db = client.db('real_estate_management');
    const clients = await db.collection('clients').find(filter).toArray();
    res.status(200).json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};