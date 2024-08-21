// import { filterProjects } from '@/controllers/projectController';

export default async function handler(req, res) {
  res.status(500).json({ error: 'Unable to fetch model fields' });
  // if (req.method === 'GET') {
  //   return filterProjects(req, res);
  // } else {
  //   res.setHeader('Allow', ['GET']);
  //   res.status(405).end(`Method ${req.method} Not Allowed`);
  // }
}
