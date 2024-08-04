import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  console.log('Counties API called with query:', req.query);
  const { region_id } = req.query;

  if (!region_id || region_id === 'undefined') {
    console.warn('No valid region_id provided in the request');
    return res.status(400).json({ success: false, error: 'Valid region_id is required' });
  }

  try {
    console.log('Attempting to connect to the database');
    const client = await clientPromise;
    console.log('Database connection successful');

    const db = client.db(process.env.MONGODB_DB);
    console.log('Using database:', process.env.MONGODB_DB);

    console.log('Querying counties with region_id:', region_id);
    const counties = await db.collection('counties').find({ region_id: new ObjectId(region_id) }).toArray();
    console.log('Counties found:', counties.length);

    res.status(200).json({ success: true, data: counties });
  } catch (error) {
    console.error('Error in counties API:', error);
    // Enviamos más detalles sobre el error al cliente
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch counties', 
      details: error.message,
      stack: error.stack
    });
  }
}