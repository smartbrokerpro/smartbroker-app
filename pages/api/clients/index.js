import { createClient, getClients } from '@/controllers/clientController';

export default async function handler(req, res) {
  console.log(`API Request Method: ${req.method}`);
  
  if (req.method === 'GET') {
    console.log('Handling GET request');
    return getClients(req, res);
  } else if (req.method === 'POST') {
    console.log('Handling POST request');
    return createClient(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    console.log(`Method ${req.method} Not Allowed`);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}