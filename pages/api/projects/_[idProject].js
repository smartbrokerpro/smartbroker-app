import { updateProject, deleteProject } from '@/controllers/projectController';

export default async function handler(req, res) {
  console.log(`API Request Method: ${req.method}`);
  
  if (req.method === 'PUT') {
    console.log('Handling PUT request');
    return updateProject(req, res);
  } else if (req.method === 'DELETE') {
    console.log('Handling DELETE request');
    return deleteProject(req, res);
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    console.log(`Method ${req.method} Not Allowed`);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
