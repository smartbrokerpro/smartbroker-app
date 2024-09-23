// pages/api/projects/delete/[id].js
import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
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
    const stockCollection = db.collection('stock');

    // Delete the project
    const deletedProject = await projectsCollection.findOneAndDelete({
      _id: new ObjectId(id),
      organization_id: new ObjectId(organizationId)
    });

    if (!deletedProject) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Delete associated stock
    const stockDeleteResult = await stockCollection.deleteMany({
      project_id: new ObjectId(id),
      organization_id: new ObjectId(organizationId)
    });

    res.status(200).json({ 
      success: true, 
      data: deletedProject,
      stockDeleted: stockDeleteResult.deletedCount
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}