// import { filterProjects } from '@/controllers/projectController';

export default async function handler(req, res) {
  res.status(405).end(`Method ${req.method} Not Allowed`);
  // if (req.method === 'GET') {
  //   return filterProjects(req, res);
  // } else {
  //   res.setHeader('Allow', ['GET']);
  //   res.status(405).end(`Method ${req.method} Not Allowed`);
  // }
}
