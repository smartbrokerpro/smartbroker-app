import { createClient, getClients, deleteClient } from '@/controllers/clientController';

export default async function handler(req, res) {
  console.log(`API Request Method: ${req.method}`);
  
  const { id } = req.query;

  if (req.method === 'GET') {
    console.log('Handling GET request');
    return getClients(req, res);
  } else if (req.method === 'POST') {
    console.log('Handling POST request');
    return createClient(req, res);
  } else if (req.method === 'DELETE') {
    console.log('Handling DELETE request');
    if (!id) {
      return res.status(400).json({ error: 'Client ID is required for DELETE' });
    }
    return deleteClient(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    console.log(`Method ${req.method} Not Allowed`);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}