import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { idProject } = req.query;

  if (!ObjectId.isValid(idProject)) {
    return res.status(400).json({ success: false, error: 'Invalid project ID' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('stock');

    const stock = await collection.find({ project_id: new ObjectId(idProject) }).toArray();
    
    // Si no hay stock, retornamos array vacío
    if (!stock.length) {
      return res.status(200).json({ success: true, data: [] });
    }

    const project = await db.collection('projects').findOne({ _id: new ObjectId(idProject) });
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    let realEstateCompany = null;
    if (project.real_estate_company_id) {
      realEstateCompany = await db.collection('real_estate_companies').findOne({ 
        _id: project.real_estate_company_id 
      });
    }

    const stockWithDetails = stock.map(item => ({
      ...item,
      projectName: project?.name || 'Sin nombre',
      realEstateCompanyName: realEstateCompany?.name || 'Sin inmobiliaria',
    }));

    res.status(200).json({ success: true, data: stockWithDetails });
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}