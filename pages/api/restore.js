import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { collection, organizationId } = req.query;

    if (!collection || !organizationId) {
      return res.status(400).json({ error: 'Collection and organizationId are required' });
    }

    const form = formidable({ multiples: false, keepExtensions: true });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing form data:', err);
        return res.status(500).json({ error: 'Failed to parse form data' });
      }

      console.log('Files received:', files);

      const file = Array.isArray(files.file) ? files.file[0] : files.file;

      if (!file) {
        console.error('File not found');
        return res.status(500).json({ error: 'File not found' });
      }

      const filePath = file.filepath || file.path;

      if (!filePath) {
        console.error('File path not found');
        return res.status(500).json({ error: 'File path not found' });
      }

      console.log('File path:', filePath);

      try {
        const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);

        // Primero, elimina los documentos existentes con el mismo organization_id
        await db.collection(collection).deleteMany({ organization_id: new ObjectId(organizationId) });

        // Luego, inserta los nuevos documentos
        const formattedData = jsonData.map((item) => ({
          ...item,
          organization_id: new ObjectId(organizationId),
        }));

        await db.collection(collection).insertMany(formattedData);

        return res.status(200).json({ message: `${collection} restored successfully for organization ${organizationId}` });
      } catch (error) {
        console.error('Failed to restore collection:', error);
        return res.status(500).json({ error: `Failed to restore ${collection}` });
      } finally {
        fs.unlinkSync(filePath); // Elimina el archivo temporal después de procesar
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
