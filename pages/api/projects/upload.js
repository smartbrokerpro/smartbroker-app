// pages/api/projects/upload.js
import { IncomingForm } from 'formidable';
import { getXLSXHeaders } from '../../../lib/excelProcessor';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ message: 'Error parsing form' });
    }

    const file = files.file[0];
    const organization_id = fields.organization_id[0];

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!organization_id) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    try {
      const headers = await getXLSXHeaders(file.filepath);
      // Here you can use the organization_id for further processing if needed
      res.status(200).json({ headers, organization_id });
    } catch (error) {
      console.error('Error processing file:', error);
      res.status(500).json({ message: 'Error processing file' });
    }
  });
}