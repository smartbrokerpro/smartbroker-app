import dbConnect from '@/lib/mongoose';
import Project from '@/models/Project';
import Stock from '@/models/Stock';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const projectFields = Object.keys(Project.schema.paths);
      const stockFields = Object.keys(Stock.schema.paths);

      const allFields = [...new Set([...projectFields, ...stockFields])];

      res.status(200).json(allFields);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Unable to fetch model fields' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}