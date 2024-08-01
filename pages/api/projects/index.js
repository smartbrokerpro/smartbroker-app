// api/projects/index.js

import { createProject, getProjects } from '@/controllers/projectController';

export default async function handler(req, res) {
  console.log(`API Request Method: ${req.method}`);
  
  const organizationId = req.method === 'GET' ? req.query.organizationId : req.body.organizationId;

  if (!organizationId) {
    console.error('organizationId is required');
    return res.status(400).json({ error: 'organizationId is required' });
  }

  if (req.method === 'GET') {
    console.log('Handling GET request');
    return getProjects(req, res);
  } else if (req.method === 'POST') {
    console.log('Handling POST request');
    return createProject(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    console.error(`Method ${req.method} Not Allowed`);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
