import clientPromise from '@/lib/mongodb';

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db('real_estate_management');
    const collection = db.collection('projects');

    const projects = await collection.find({}).limit(10).toArray(); // Limitar a 10 proyectos por simplicidad

    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
