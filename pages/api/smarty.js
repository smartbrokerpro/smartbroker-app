import { handleSearchRequest } from '@/controllers/smartyController';
import verifyCredits from '@/middlewares/verifyCredits';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return verifyCredits(req, res, () => handleSearchRequest(req, res));
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}