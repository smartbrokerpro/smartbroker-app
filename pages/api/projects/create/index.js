// pages/api/projects/create.js
import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { organizationId } = req.body;

  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const projectData = {
      ...req.body,
      organization_id: new ObjectId(organizationId),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Convertir los IDs a ObjectId
    if (projectData.region_id) projectData.region_id = new ObjectId(projectData.region_id);
    if (projectData.county_id) projectData.county_id = new ObjectId(projectData.county_id);
    if (projectData.real_estate_company_id) projectData.real_estate_company_id = new ObjectId(projectData.real_estate_company_id);

    // Asegurarse de que `location` se maneje correctamente
    if (typeof projectData.location === 'string') {
      const [lat, lng] = projectData.location.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        projectData.location = { lat, lng };
      }
    }

    // Asegurarse de que `reservationInfo` esté correctamente estructurado
    if (projectData.reservationInfo) {
      projectData.reservationInfo = {
        text: projectData.reservationInfo.text || '',
        hyperlink: projectData.reservationInfo.hyperlink || ''
      };
    }

    // Insertar el nuevo proyecto
    const result = await db.collection('projects').insertOne(projectData);

    if (result.insertedId) {
      const newProject = await db.collection('projects').findOne({ _id: result.insertedId });
      res.status(201).json({ success: true, data: newProject });
    } else {
      throw new Error('Failed to insert project');
    }
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}