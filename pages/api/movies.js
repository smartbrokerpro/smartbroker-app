import clientPromise from '@/lib/mongodb';

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db('sample_mflix');
    const collection = db.collection('movies');
    
    const movies = await collection.find({}).limit(10).toArray(); // Limitar a 10 películas por simplicidad

    res.status(200).json({ success: true, data: movies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
