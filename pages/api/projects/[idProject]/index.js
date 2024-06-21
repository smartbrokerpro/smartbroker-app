import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { idProject } = req.query;

  if (!ObjectId.isValid(idProject)) {
    return res.status(400).json({ success: false, error: 'Invalid project ID' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('real_estate_management');
    const project = await db.collection('projects').findOne({ _id: new ObjectId(idProject) });
    const realEstateCompany = await db.collection('real_estate_companies').findOne({ _id: project.real_estate_company_id });

    const projectWithDetails = {
      ...project,
      realEstateCompanyName: realEstateCompany.name,
    };

    res.status(200).json({ success: true, data: projectWithDetails });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
