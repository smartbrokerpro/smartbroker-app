import { handleClientGPTRequest } from '@/controllers/clientController';

export default async function handler(req, res) {
  console.log(`API Request Method for Clients GPT Handler: ${req.method}`);
  
  if (req.method === 'POST') {
    console.log('Handling POST request for Clients GPT');
    return handleClientGPTRequest(req, res);
  } else {
    res.setHeader('Allow', ['POST']);
    console.log(`Method ${req.method} Not Allowed in Clients GPT Handler`);
    res.status(405).end(`Method ${req.method} Not Allowed in Clients GPT Handler`);
  }
}