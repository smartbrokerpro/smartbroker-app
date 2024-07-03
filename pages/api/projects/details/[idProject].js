import { getProjectDetails } from '@/controllers/projectController';

export default async function handler(req, res) {
  const { idProject } = req.query;
  console.log(`API Request Method for Project Details ${idProject}: ${req.method}`);

  if (req.method === 'GET') {
    console.log('Handling GET request for project details');
    return getProjectDetails(req, res);
  } else {
    res.setHeader('Allow', ['GET']);
    console.log(`Method ${req.method} Not Allowed for project details`);
    res.status(405).end(`Method ${req.method} Not Allowed for project details`);
  }
}