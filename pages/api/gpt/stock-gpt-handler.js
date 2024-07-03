import { handleGPTRequest } from '@/controllers/stockController';

export default async function handler(req, res) {
  console.log(`API Request Method: ${req.method}`);

  if (req.method === 'POST') {
    console.log('Handling POST request for stock');
    return handleGPTRequest(req, res);
  } else {
    res.setHeader('Allow', ['POST']);
    console.log(`Method ${req.method} Not Allowed`);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
