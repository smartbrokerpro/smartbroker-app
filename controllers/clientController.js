import Client from '../models/clientModel';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { clean, format } from 'rut.js';

export const getClients = async (req, res) => {
  const { organizationId, brokerId } = req.query;

  if (!organizationId || !brokerId) {
    return res.status(400).json({ error: 'organizationId and brokerId are required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const clients = await db.collection('clients').find({
      organization_id: new ObjectId(organizationId),
      broker_id: new ObjectId(brokerId) 
    }).sort({ updated_at: -1 }).toArray();

    res.status(200).json({ success: true, data: clients });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};



export const createClient = async (req, res) => {
  const { 
    first_name, 
    last_name, 
    email, 
    phone, 
    address, 
    rut, 
    notes, 
    broker_id, 
    organization_id 
  } = req.body;

  if (!organization_id) {
    return res.status(400).json({ error: 'organization_id is required' });
  }

  if (!broker_id) {
    return res.status(400).json({ error: 'broker_id is required' });
  }

  // Primero limpiamos el RUT y luego lo formateamos, pero sin puntos
  const cleanedRut = format(clean(rut)).replace(/\./g, '');

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Verificar si ya existe un cliente con el mismo email o RUT
    const existingClient = await db.collection('clients').findOne({
      $or: [
        { email: email },
        { rut: cleanedRut }
      ],
      organization_id: new ObjectId(organization_id)
    });

    if (existingClient) {
      return res.status(400).json({ success: false, error: 'Ya existe un cliente con este email o RUT' });
    }

    const newClient = {
      first_name,
      last_name,
      email,
      phone,
      address,
      rut: cleanedRut,
      notes,
      broker_id: new ObjectId(broker_id),
      organization_id: new ObjectId(organization_id),
      status: 'potencial', // Valor por defecto
      origin: 'otro', // Valor por defecto
      contact_date: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };

    const savedClient = await db.collection('clients').insertOne(newClient);
    res.status(201).json({ 
      success: true, 
      data: { 
        _id: savedClient.insertedId, 
        ...newClient 
      } 
    });
  } catch (error) {
    console.error('Error al crear cliente:', error);
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
  console.log('Iniciando deleteClient en el controlador');
  console.log('req.query:', req.query);
  console.log('req.body:', req.body);

  const { id } = req.query;
  const { organizationId } = req.body;

  console.log('ID del cliente a eliminar (desde query):', id);
  console.log('ID de la organización (desde body):', organizationId);

  if (!id) {
    console.log('Error: Client ID is missing');
    return res.status(400).json({ error: 'Client ID is required' });
  }

  if (!organizationId) {
    console.log('Error: organizationId is missing');
    return res.status(400).json({ error: 'organizationId is required' });
  }

  try {
    console.log('Intentando conectar a la base de datos');
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    console.log('Conexión a la base de datos establecida');

    console.log('Intentando eliminar el cliente');
    const deletedClient = await db.collection('clients').findOneAndDelete({
      _id: new ObjectId(id),
      organization_id: new ObjectId(organizationId)
    });
    console.log('Resultado de la eliminación:', deletedClient);

    if (!deletedClient) {
      console.log('Cliente no encontrado');
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    console.log('Cliente eliminado exitosamente');
    res.status(200).json({ success: true, data: deletedClient });
  } catch (error) {
    console.error('Error al eliminar el cliente:', error);
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
