// pages/api/organization/[id]/credits.js
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const organization = await db.collection('organizations').findOne({ _id: new ObjectId(id) });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.status(200).json({ credits: organization.credits });
  } catch (error) {
    console.error('Error retrieving credits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
