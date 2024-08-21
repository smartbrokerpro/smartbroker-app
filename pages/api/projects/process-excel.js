import { IncomingForm } from 'formidable';
import { processExcel } from '@/utils/excelProcessor';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const form = new IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: 'Error parsing form' });
      }

      const file = files.file[0];
      const mapping = JSON.parse(fields.mapping[0]);
      const realEstateCompanyId = fields.realEstateCompanyId[0];

      try {
        const result = await processExcel(file, mapping, realEstateCompanyId);
        res.status(200).json(result);
      } catch (error) {
        console.error('Error processing Excel:', error);
        res.status(500).json({ error: 'Error processing Excel file' });
      }
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}