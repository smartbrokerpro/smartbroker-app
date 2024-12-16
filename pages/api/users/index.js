// pages/api/users/index.js
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  // GET - Listar usuarios
  if (req.method === 'GET') {
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    try {
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB);

      const users = await db.collection('users').find({
        organizationId: new ObjectId(organizationId)
      }).toArray();

      return res.status(200).json({ success: true, data: users });
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // POST - Crear usuario
  if (req.method === 'POST') {
    try {
      const { name, email, role, organizationId } = req.body;

      // Validaciones básicas
      if (!name || !email || !role || !organizationId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Todos los campos son requeridos' 
        });
      }

      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB);

      // Verificar si el usuario ya existe
      const existingUser = await db.collection('users').findOne({ 
        email: email.toLowerCase(),
        organizationId: new ObjectId(organizationId)
      });

      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          error: 'Ya existe un usuario con este email en la organización' 
        });
      }

      // Crear el nuevo usuario
      const newUser = {
        name,
        email: email.toLowerCase(),
        role,
        organizationId: new ObjectId(organizationId),
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true
      };

      const result = await db.collection('users').insertOne(newUser);

      return res.status(201).json({ 
        success: true,
        data: { ...newUser, _id: result.insertedId }
      });

    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Si no es ninguno de los métodos permitidos
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}