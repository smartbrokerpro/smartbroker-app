import { getProjectDetails, updateProject } from '@/controllers/projectController';

export default async function handler(req, res) {
  const organizationId = req.headers['x-organization-id'];

  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId is required' });
  }

  if (req.method === 'GET') {
    return getProjectDetails(req, res, organizationId);
  } else if (req.method === 'PUT') {
    return updateProject(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}