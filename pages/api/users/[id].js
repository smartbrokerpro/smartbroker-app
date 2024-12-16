// pages/api/users/[id].js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { id } = req.query;
  const updateData = req.body;

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Si es el mismo usuario, solo permitir actualizar nombre e imagen
    if (id === session.user.id) {
      // Verificar que solo se estén actualizando campos permitidos
      const allowedSelfFields = ['name', 'image'];
      const attemptedFields = Object.keys(updateData);
      const hasDisallowedFields = attemptedFields.some(field => !allowedSelfFields.includes(field));

      if (hasDisallowedFields) {
        return res.status(403).json({ 
          success: false, 
          error: 'Solo puedes modificar tu nombre y avatar' 
        });
      }
    } else {
      // Si no es el mismo usuario, verificar permisos para editar otros usuarios
      if (!session.user.role === 'admin') {
        return res.status(403).json({ 
          success: false, 
          error: 'No tienes permisos para modificar otros usuarios' 
        });
      }
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const safeUpdate = {};
    
    if (updateData.name) {
      safeUpdate.name = updateData.name;
    }

    if (updateData.image) {
      safeUpdate.image = updateData.image;
    }

    // Solo permitir estos campos si no es auto-edición
    if (id !== session.user.id) {
      if (updateData.role) {
        safeUpdate.role = updateData.role;
      }

      if (updateData.customPermissions) {
        safeUpdate.customPermissions = updateData.customPermissions;
      }

      if (typeof updateData.active === 'boolean') {
        safeUpdate.active = updateData.active;
      }
    }

    safeUpdate.updatedAt = new Date();

    const result = await db.collection('users').updateOne(
      { 
        _id: new ObjectId(id),
        organizationId: new ObjectId(session.user.organization._id)
      },
      { $set: safeUpdate }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'User updated successfully' 
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}