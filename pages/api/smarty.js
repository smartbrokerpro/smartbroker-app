import { handleSearchRequest } from '../../controllers/smartyController';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return handleSearchRequest(req, res);
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
