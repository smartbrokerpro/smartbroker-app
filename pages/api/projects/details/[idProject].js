// pages/api/projects/details/[idProject].js

import { getProjectDetails } from '@/controllers/projectController';

export default async function handler(req, res) {
  const { idProject, organizationId } = req.query;
  console.log(`API Request Method for Project Details ${idProject}: ${req.method}`);

  if (!organizationId) {
    console.log('organizationId is required');
    return res.status(400).json({ error: 'organizationId is required' });
  }

  if (req.method === 'GET') {
    console.log('Handling GET request for project details');
    return getProjectDetails(req, res, organizationId);
  } else {
    res.setHeader('Allow', ['GET']);
    console.log(`Method ${req.method} Not Allowed for project details`);
    res.status(405).end(`Method ${req.method} Not Allowed for project details`);
  }
}
