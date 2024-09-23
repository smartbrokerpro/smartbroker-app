// pages/api/projects/single/[id].js
import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { id } = req.query;
  const organizationId = req.headers['x-organization-id'];

  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const projectsCollection = db.collection('projects');

    const project = await projectsCollection.findOne({
      _id: new ObjectId(id),
      organization_id: new ObjectId(organizationId)
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}