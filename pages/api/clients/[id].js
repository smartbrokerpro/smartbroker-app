import { deleteClient } from '@/controllers/clientController';

export default async function handler(req, res) {
  const { id } = req.query;
  const { method } = req;

  console.log(`API Request Method: ${method}`);
  console.log('Client ID:', id);
  console.log('Full URL:', req.url);
  console.log('Request body:', req.body);

  if (method === 'DELETE') {
    console.log('Handling DELETE request for client ID:', id);
    return deleteClient(req, res);
  } else {
    console.log(`Method ${method} Not Allowed for /api/clients/[id]`);
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}