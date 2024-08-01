import Client from '../models/clientModel';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const getClients = async (req, res) => {
  const { organizationId } = req.query;

  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    console.log('Conectado a la base de datos, obteniendo clientes...');

    const clients = await db.collection('clients').find({ organization_id: new ObjectId(organizationId) }).sort({ updated_at: -1 }).toArray();

    res.status(200).json({ success: true, data: clients });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createClient = async (req, res) => {
  const { organizationId } = req.body;

  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const newClient = { ...req.body, organization_id: new ObjectId(organizationId), created_at: new Date(), updated_at: new Date() };
    const savedClient = await db.collection('clients').insertOne(newClient);
    res.status(201).json({ success: true, data: { _id: savedClient.insertedId, ...newClient } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateClient = async (req, res) => {
  const { id } = req.params;
  const { organizationId } = req.body;

  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const updatedClient = await db.collection('clients').findOneAndUpdate(
      { _id: new ObjectId(id), organization_id: new ObjectId(organizationId) },
      { $set: { ...req.body, updated_at: new Date() } },
      { returnOriginal: false }
    );
    if (!updatedClient) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }
    res.status(200).json({ success: true, data: updatedClient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteClient = async (req, res) => {
  const { id } = req.params;
  const { organizationId } = req.body;

  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const deletedClient = await db.collection('clients').findOneAndDelete({ _id: new ObjectId(id), organization_id: new ObjectId(organizationId) });
    if (!deletedClient) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }
    res.status(200).json({ success: true, data: deletedClient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const filterClients = async (req, res) => {
  const { organizationId, origin, status } = req.query;

  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId is required' });
  }

  const filter = { organization_id: new ObjectId(organizationId) };
  if (origin) filter.origin = origin;
  if (status) filter.status = status;

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const clients = await db.collection('clients').find(filter).toArray();
    res.status(200).json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
