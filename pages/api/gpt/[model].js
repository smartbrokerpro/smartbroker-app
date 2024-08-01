// /pages/api/gpt/[model].js
import { handleGPTRequest } from '../../../handlers/GenericGPTHandler';
import verifyCredits from '@/middlewares/verifyCredits';

export default async function handler(req, res) {
  console.log(`API Request Method: ${req.method}`);
  
  if (req.method === 'POST') {
    console.log('Handling POST request');
    const { organizationId } = req.body;
    const modelName = req.query.model;
    
    if (!organizationId || !modelName) {
      return res.status(400).json({ error: 'organizationId and model name are required' });
    }
    
    req.body.modelName = modelName;
    
    // Integrar el middleware verifyCredits antes de manejar la solicitud
    return verifyCredits(req, res, () => handleGPTRequest(req, res));
  } else {
    res.setHeader('Allow', ['POST']);
    console.log(`Method ${req.method} Not Allowed`);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}