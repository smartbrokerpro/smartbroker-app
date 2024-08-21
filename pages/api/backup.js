// pages/api/backup.js
import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { collection, organizationId } = req.query;

    console.log(`Received request for collection: ${collection} with organizationId: ${organizationId}`);

    if (!collection || !organizationId) {
      console.error('Collection type and organizationId are required');
      return res.status(400).json({ error: 'Collection type and organizationId are required' });
    }

    try {
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB); // Usamos la base de datos definida en .env

      console.log('Connected to MongoDB, fetching data...');

      const data = await db
        .collection(collection)
        .find({ organization_id: new ObjectId(organizationId) })
        .toArray();

      console.log(`Data fetched from ${collection}:`, data);

      return res.status(200).json(data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }
  } else {
    console.error('Method not allowed');
    res.status(405).json({ error: 'Method not allowed' });
  }
}
