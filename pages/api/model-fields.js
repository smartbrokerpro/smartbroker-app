// pages/api/model-fields.js

import Project from '@/models/projectModel';
import Stock from '@/models/stockModel';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const projectFields = Object.keys(Project.schema.paths);
    const stockFields = Object.keys(Stock.schema.paths);

    res.status(200).json({ projectFields, stockFields });
  } catch (error) {
    console.error('Error fetching model fields:', error);
    res.status(500).json({ message: 'Error fetching model fields' });
  }
}