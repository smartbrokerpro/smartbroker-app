import { bulkUploadStock } from '@/controllers/stockController';
import multer from 'multer';

export const config = {
  api: {
    bodyParser: false,
  },
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    upload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      return bulkUploadStock(req, res);
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}