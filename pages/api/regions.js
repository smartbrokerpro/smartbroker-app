// pages/api/regions.js

import clientPromise from '@/lib/mongodb';

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const regions = await db.collection('regions').find({}).toArray();

    res.status(200).json({ success: true, data: regions });
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch regions' });
  }
}
