import { handleGPTRequest } from '@/controllers/stockController';
import verifyCredits from '@/middlewares/verifyCredits';

export default async function handler(req, res) {
  console.log(`API Request Method: ${req.method}`);

  if (req.method === 'POST') {
    console.log('Handling POST request for stock');
    const { organizationId } = req.body;
    console.log('Request body:', req.body);
    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required.' });
    }

    return verifyCredits(req, res, () => handleGPTRequest(req, res));
  } else {
    res.setHeader('Allow', ['POST']);
    console.log(`Method ${req.method} Not Allowed`);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
