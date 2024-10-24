import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function getRealEstateCompanies(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('real_estate_companies');
    const companies = await collection.find({}).toArray();

    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    console.error('Error fetching real estate companies:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

export async function createRealEstateCompany(req, res) {
  try {
    const { 
      name, 
      address, 
      contact_person, 
      description, 
      email, 
      phone, 
      website 
    } = req.body;

    // Validaciones básicas
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'El nombre de la empresa es requerido' });
    }

    // Validación de email
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'El formato del email no es válido' });
    }

    // Validación de website
    if (website && !isValidUrl(website)) {
      return res.status(400).json({ success: false, message: 'El formato de la URL no es válido' });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('real_estate_companies');

    const now = new Date();

    const newCompany = { 
      name: name.trim(),
      address: address?.trim() || null,
      contact_person: contact_person?.trim() || null,
      description: description?.trim() || null,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      website: website?.trim() || null,
      createdAt: now,
      updatedAt: now
    };

    const result = await collection.insertOne(newCompany);
    
    newCompany._id = result.insertedId;

    res.status(201).json({ success: true, data: newCompany });
  } catch (error) {
    console.error('Error creating real estate company:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function updateRealEstateCompany(req, res) {
  try {
    const { id } = req.query;
    const { 
      name, 
      address, 
      contact_person, 
      email, 
      phone, 
      website,
      action,
      documents 
    } = req.body;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de empresa inválido' 
      });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('real_estate_companies');

    // Primero obtenemos la empresa para verificar si existe y su estado actual
    const existingCompany = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!existingCompany) {
      return res.status(404).json({ 
        success: false, 
        message: 'Empresa no encontrada' 
      });
    }

    let updateOperation = {};

    if (action === 'addDocuments' && Array.isArray(documents)) {
      // Aseguramos que existe el array de documentos
      const currentDocs = existingCompany.documents || [];
      
      // Preparamos los nuevos documentos
      const newDocs = documents.map(doc => ({
        ...doc,
        uploadedAt: new Date(doc.uploadedAt)
      }));

      updateOperation = {
        $set: {
          documents: [...currentDocs, ...newDocs],
          updatedAt: new Date()
        }
      };

    } else if (action === 'deleteDocument' && documents?.url) {
      const currentDocs = existingCompany.documents || [];
      const updatedDocs = currentDocs.filter(doc => doc.url !== documents.url);

      updateOperation = {
        $set: {
          documents: updatedDocs,
          updatedAt: new Date()
        }
      };

    } else {
      // Actualización normal de la empresa
      if (!name?.trim()) {
        return res.status(400).json({ 
          success: false, 
          message: 'El nombre de la empresa es requerido' 
        });
      }

      if (email && !isValidEmail(email)) {
        return res.status(400).json({ 
          success: false, 
          message: 'El formato del email no es válido' 
        });
      }

      if (website && !isValidUrl(website)) {
        return res.status(400).json({ 
          success: false, 
          message: 'El formato de la URL no es válido' 
        });
      }

      updateOperation = {
        $set: {
          name: name.trim(),
          address: address?.trim() || null,
          contact_person: contact_person?.trim() || null,
          email: email?.trim() || null,
          phone: phone?.trim() || null,
          website: website?.trim() || null,
          updatedAt: new Date()
        }
      };
    }

    // Realizamos la actualización usando updateOne
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      updateOperation
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Empresa no encontrada' 
      });
    }

    if (result.modifiedCount === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se realizaron cambios' 
      });
    }

    // Obtenemos la empresa actualizada
    const updatedCompany = await collection.findOne({ _id: new ObjectId(id) });

    return res.status(200).json({ 
      success: true, 
      data: updatedCompany
    });

  } catch (error) {
    console.error('Error updating real estate company:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      details: error.message 
    });
  }
}


export async function deleteRealEstateCompany(req, res) {
  try {
    const { id } = req.query;

    // Validar ID
    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID de empresa inválido' });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('real_estate_companies');

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
    }

    res.status(200).json({ success: true, message: 'Empresa eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting real estate company:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

// Funciones auxiliares de validación
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}